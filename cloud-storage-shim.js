const LEGACY_PHOTO_KEY = 'japan_photos';
const CLOUD_INDEX_KEY = 'cloudPhotoIndex';
const SUPABASE_STATE_KEY = 'supabaseCloudUploads';
const MIGRATION_VERSION_FLAG = 'cloudStorageShim:v1';
const MAX_INIT_RETRIES = 10;
const PENDING_PROTOCOL = 'cloud-pending://';

const originalSetItem = localStorage.getItem('japan_photos').lengthlocalStorage.setItem.bind(localStorage);
const originalGetItem = localStorage.getItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

const guardedWrites = new Set();
const cardsByHash = new Map();
const dataUrlByHash = new Map();
const hashByDataUrl = new Map();
const pendingRemoteUrls = new Map();
let cloudIndexCache = loadCloudIndex();
let optimizeLogCount = 0;
let quotaLogCount = 0;

const MAX_DEBUG_LOGS = 5;

function parseJson(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[Cloud Shim] Failed to parse JSON payload.', error);
    return null;
  }
}

function withGuardedWrite(key, writeFn) {
  guardedWrites.add(key);
  try {
    writeFn();
  } finally {
    guardedWrites.delete(key);
  }
}

function readDataUrlBytes(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
    return null;
  }
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) {
    return null;
  }
  const base64 = dataUrl.slice(commaIndex + 1);
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.warn('[Cloud Shim] Unable to decode base64 payload.', error);
    return null;
  }
}

function fallbackHashBytes(bytes) {
  if (!bytes || !bytes.length) {
    return null;
  }
  let accumulator = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    accumulator = (accumulator + bytes[i] + ((accumulator << 7) & 0xffffffff)) >>> 0;
  }
  return accumulator.toString(16).padStart(8, '0');
}

function fallbackHashString(value) {
  if (typeof value !== 'string' || !value.length) {
    return null;
  }
  let accumulator = 0;
  for (let i = 0; i < value.length; i += 1) {
    accumulator = (accumulator + value.charCodeAt(i) + ((accumulator << 5) & 0xffffffff)) >>> 0;
  }
  return accumulator.toString(16).padStart(8, '0');
}

function memoizeHashMapping(source, hash) {
  if (!source || !hash) {
    return;
  }
  hashByDataUrl.set(source, hash);
  if (!dataUrlByHash.has(hash)) {
    dataUrlByHash.set(hash, source);
  }
}

function computeHashSync(dataUrl) {
  if (hashByDataUrl.has(dataUrl)) {
    return hashByDataUrl.get(dataUrl);
  }
  const bytes = readDataUrlBytes(dataUrl);
  let hash = null;
  if (bytes && bytes.length) {
    hash = fallbackHashBytes(bytes);
  }
  if (!hash) {
    hash = fallbackHashString(dataUrl);
  }
  if (!hash) {
    return null;
  }
  memoizeHashMapping(dataUrl, hash);
  return hash;
}

function supportsCryptoDigest() {
  return typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function';
}

async function computeHashFromDataUrl(dataUrl) {
  if (hashByDataUrl.has(dataUrl)) {
    return hashByDataUrl.get(dataUrl);
  }
  const bytes = readDataUrlBytes(dataUrl);
  let hash = null;
  if (bytes && bytes.length) {
    if (supportsCryptoDigest()) {
      try {
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        hash = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('[Cloud Shim] crypto.subtle.digest failed, falling back.', error);
      }
    }
    if (!hash) {
      hash = fallbackHashBytes(bytes);
    }
  }
  if (!hash) {
    hash = fallbackHashString(dataUrl);
  }
  if (!hash) {
    return null;
  }
  memoizeHashMapping(dataUrl, hash);
  return hash;
}

function getRemoteUrlForHash(hash) {
  if (!hash) {
    return null;
  }
  const record = cloudIndexCache[hash];
  if (record && typeof record === 'object' && record.url) {
    return record.url;
  }
  if (pendingRemoteUrls.has(hash)) {
    return pendingRemoteUrls.get(hash);
  }
  return null;
}

function deepTransform(value, handler, path = []) {
  if (typeof value === 'string') {
    return handler(value, path);
  }
  if (Array.isArray(value)) {
    let mutated = false;
    let result = value;
    for (let index = 0; index < value.length; index += 1) {
      const child = deepTransform(value[index], handler, path.concat(index));
      if (child.mutated || child.value !== value[index]) {
        if (!mutated && result === value) {
          result = value.slice();
        }
        result[index] = child.value;
        mutated = true;
      }
    }
    return { value: result, mutated };
  }
  if (value && typeof value === 'object') {
    let mutated = false;
    let result = value;
    Object.keys(value).forEach(key => {
      const child = deepTransform(value[key], handler, path.concat(key));
      if (child.mutated || child.value !== value[key]) {
        if (!mutated && result === value) {
          result = { ...value };
        }
        result[key] = child.value;
        mutated = true;
      }
    });
    return { value: result, mutated };
  }
  return { value, mutated: false };
}

function normalizeStringValue(value, state, path) {
  if (typeof value !== 'string') {
    return { value, mutated: false };
  }
  const key = path.length ? path[path.length - 1] : null;
  if (key === 'cloudHash') {
    const trimmed = value.trim();
    if (trimmed) {
      state.hash = trimmed;
    }
    return trimmed === value ? { value, mutated: false } : { value: trimmed, mutated: true };
  }
  if (key === 'cloudUrl') {
    const trimmed = value.trim();
    if (trimmed) {
      state.remoteUrl = trimmed;
      if (state.hash) {
        memoizeHashMapping(trimmed, state.hash);
      }
    }
    return trimmed === value ? { value, mutated: false } : { value: trimmed, mutated: true };
  }
  if (value.startsWith('data:image/')) {
    let fieldHash = hashByDataUrl.get(value) || state.hash;
    if (!fieldHash) {
      fieldHash = computeHashSync(value);
    }
    if (!fieldHash) {
      return { value, mutated: false };
    }
    state.hash = fieldHash;
    memoizeHashMapping(value, fieldHash);
    const remoteUrl = getRemoteUrlForHash(fieldHash);
    if (remoteUrl) {
      state.remoteUrl = remoteUrl;
      memoizeHashMapping(remoteUrl, fieldHash);
      return { value: remoteUrl, mutated: value !== remoteUrl };
    }
    const placeholder = `${PENDING_PROTOCOL}${fieldHash}`;
    memoizeHashMapping(placeholder, fieldHash);
    return { value: placeholder, mutated: value !== placeholder };
  }
  if (value.startsWith(PENDING_PROTOCOL)) {
    const pendingHash = value.slice(PENDING_PROTOCOL.length).trim();
    if (pendingHash) {
      if (!state.hash) {
        state.hash = pendingHash;
      }
      memoizeHashMapping(value, pendingHash);
    }
    return { value, mutated: false };
  }
  if (state.hash) {
    const resolved = getRemoteUrlForHash(state.hash);
    if (resolved && value === resolved) {
      state.remoteUrl = resolved;
      memoizeHashMapping(resolved, state.hash);
    }
  }
  return { value, mutated: false };
}

function normalizePhotoRecord(record) {
  if (!record || typeof record !== 'object') {
    return { record, mutated: false, hash: null, remoteUrl: null };
  }
  const initialHash = typeof record.cloudHash === 'string' && record.cloudHash.trim() ? record.cloudHash.trim() : null;
  const initialUrl = typeof record.cloudUrl === 'string' && record.cloudUrl.trim() ? record.cloudUrl.trim() : null;
  const state = {
    hash: initialHash,
    remoteUrl: initialUrl
  };
  const { value: transformed, mutated } = deepTransform(record, (stringValue, path) => normalizeStringValue(stringValue, state, path));
  let nextRecord = transformed;
  let recordMutated = mutated;
  if (state.hash) {
    const resolvedUrl = getRemoteUrlForHash(state.hash) || state.remoteUrl;
    if (resolvedUrl) {
      state.remoteUrl = resolvedUrl;
      memoizeHashMapping(resolvedUrl, state.hash);
    }
  }
  if (!nextRecord || typeof nextRecord !== 'object') {
    if (state.hash || state.remoteUrl) {
      nextRecord = {};
      recordMutated = true;
    }
  }
  if (nextRecord && typeof nextRecord === 'object') {
    if (state.hash && nextRecord.cloudHash !== state.hash) {
      nextRecord = { ...nextRecord, cloudHash: state.hash };
      recordMutated = true;
    }
    if (state.hash && state.remoteUrl && nextRecord.cloudUrl !== state.remoteUrl) {
      nextRecord = { ...nextRecord, cloudUrl: state.remoteUrl };
      recordMutated = true;
    }
  }
  return {
    record: nextRecord,
    mutated: recordMutated,
    hash: state.hash,
    remoteUrl: state.remoteUrl
  };
}

function normalizePayload(value) {
  if (Array.isArray(value)) {
    let mutated = false;
    let result = value;
    for (let index = 0; index < value.length; index += 1) {
      const child = normalizePayload(value[index]);
      if (child.mutated || child.value !== value[index]) {
        if (!mutated && result === value) {
          result = value.slice();
        }
        result[index] = child.value;
        mutated = true;
      }
    }
    return { value: result, mutated };
  }
  if (value && typeof value === 'object') {
    const { record: normalizedRecord, mutated: recordMutated } = normalizePhotoRecord(value);
    let result = normalizedRecord;
    let mutated = recordMutated;
    const keys = Object.keys(result);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const child = normalizePayload(result[key]);
      if (child.mutated || child.value !== result[key]) {
        if (!mutated && result === normalizedRecord) {
          result = { ...normalizedRecord };
        }
        result[key] = child.value;
        mutated = true;
      }
    }
    return { value: result, mutated };
  }
  return { value, mutated: false };
}

function summarizeStrings(value) {
  const metrics = {
    total: 0,
    dataUrls: 0,
    pendingRefs: 0,
    remoteUrls: 0,
    maxLength: 0,
    sample: ''
  };

  visitStrings(value, stringValue => {
    metrics.total += 1;
    if (stringValue.startsWith('data:image/')) {
      metrics.dataUrls += 1;
    } else if (stringValue.startsWith(PENDING_PROTOCOL)) {
      metrics.pendingRefs += 1;
    } else if (stringValue.startsWith('http://') || stringValue.startsWith('https://')) {
      metrics.remoteUrls += 1;
    }
    if (stringValue.length > metrics.maxLength) {
      metrics.maxLength = stringValue.length;
      metrics.sample = stringValue.slice(0, 120);
    }
  });

  return metrics;
}

function replaceHashStringValue(value, hash, remoteUrl) {
  if (typeof value !== 'string') {
    return { value, mutated: false, matched: false };
  }
  if (value.startsWith('data:image/')) {
    let valueHash = hashByDataUrl.get(value);
    if (!valueHash) {
      valueHash = computeHashSync(value);
    }
    if (valueHash === hash) {
      memoizeHashMapping(remoteUrl, hash);
      return { value: remoteUrl, mutated: value !== remoteUrl, matched: true };
    }
    if (valueHash) {
      memoizeHashMapping(value, valueHash);
    }
    return { value, mutated: false, matched: false };
  }
  if (value.startsWith(PENDING_PROTOCOL)) {
    const pendingHash = value.slice(PENDING_PROTOCOL.length).trim();
    if (pendingHash === hash) {
      memoizeHashMapping(remoteUrl, hash);
      return { value: remoteUrl, mutated: value !== remoteUrl, matched: true };
    }
    return { value, mutated: false, matched: false };
  }
  if (value === remoteUrl) {
    memoizeHashMapping(remoteUrl, hash);
    return { value, mutated: false, matched: true };
  }
  return { value, mutated: false, matched: false };
}

function applyRemoteToRecord(record, hash, remoteUrl) {
  let foundMatch = false;
  const { value: transformed, mutated } = deepTransform(record, (stringValue, path) => {
    const result = replaceHashStringValue(stringValue, hash, remoteUrl);
    if (result.matched) {
      foundMatch = true;
    }
    return result;
  });
  let nextRecord = transformed;
  let recordMutated = mutated;
  if (!foundMatch) {
    memoizeHashMapping(remoteUrl, hash);
    return { record: nextRecord, mutated: recordMutated };
  }
  if (!nextRecord || typeof nextRecord !== 'object') {
    nextRecord = { cloudHash: hash, cloudUrl: remoteUrl };
    recordMutated = true;
  } else {
    let cloned = false;
    const ensureClone = () => {
      if (!cloned) {
        nextRecord = { ...nextRecord };
        cloned = true;
      }
    };
    if (typeof nextRecord.cloudHash !== 'string' || nextRecord.cloudHash.trim() !== hash) {
      ensureClone();
      nextRecord.cloudHash = hash;
      recordMutated = true;
    }
    if (typeof nextRecord.cloudUrl !== 'string' || nextRecord.cloudUrl.trim() !== remoteUrl) {
      ensureClone();
      nextRecord.cloudUrl = remoteUrl;
      recordMutated = true;
    }
  }
  memoizeHashMapping(remoteUrl, hash);
  return { record: nextRecord, mutated: recordMutated };
}

function applyRemoteToPayload(value, hash, remoteUrl) {
  if (Array.isArray(value)) {
    let mutated = false;
    let result = value;
    for (let index = 0; index < value.length; index += 1) {
      const child = applyRemoteToPayload(value[index], hash, remoteUrl);
      if (child.mutated || child.value !== value[index]) {
        if (!mutated && result === value) {
          result = value.slice();
        }
        result[index] = child.value;
        mutated = true;
      }
    }
    return { value: result, mutated };
  }
  if (value && typeof value === 'object') {
    const { record: updatedRecord, mutated: recordMutated } = applyRemoteToRecord(value, hash, remoteUrl);
    let result = updatedRecord;
    let mutated = recordMutated;
    const keys = Object.keys(result);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const child = applyRemoteToPayload(result[key], hash, remoteUrl);
      if (child.mutated || child.value !== result[key]) {
        if (!mutated && result === updatedRecord) {
          result = { ...updatedRecord };
        }
        result[key] = child.value;
        mutated = true;
      }
    }
    return { value: result, mutated };
  }
  return { value, mutated: false };
}

function visitStrings(value, visitor, path = []) {
  if (typeof value === 'string') {
    visitor(value, path);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitStrings(item, visitor, path.concat(index)));
    return;
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach(key => {
      visitStrings(value[key], visitor, path.concat(key));
    });
  }
}

function forEachPhotoRecord(value, visitor, visited = new WeakSet()) {
  if (Array.isArray(value)) {
    value.forEach(item => forEachPhotoRecord(item, visitor, visited));
    return;
  }
  if (!value || typeof value !== 'object') {
    return;
  }
  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  let looksLikePhoto = false;
  if (typeof value.cloudHash === 'string' || typeof value.cloudUrl === 'string') {
    looksLikePhoto = true;
  } else {
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      const child = value[keys[i]];
      if (typeof child === 'string' && child.startsWith('data:image/')) {
        looksLikePhoto = true;
        break;
      }
    }
  }

  if (looksLikePhoto) {
    visitor(value);
  }

  Object.keys(value).forEach(key => {
    forEachPhotoRecord(value[key], visitor, visited);
  });
}

function optimizeLegacyPayload(raw) {
  const photos = parseJson(raw);
  if (!photos) {
    if (typeof raw === 'string' && raw.length && optimizeLogCount < MAX_DEBUG_LOGS) {
      optimizeLogCount += 1;
      console.warn('[Cloud Shim] optimizeLegacyPayload: unable to parse payload', {
        length: raw.length,
        snippet: raw.slice(0, 200)
      });
    }
    return raw;
  }
  const { value: normalized, mutated } = normalizePayload(photos);
  if (optimizeLogCount < MAX_DEBUG_LOGS) {
    const serialized = mutated ? JSON.stringify(normalized) : raw;
    optimizeLogCount += 1;
    const metrics = summarizeStrings(normalized);
    console.debug('[Cloud Shim] optimizeLegacyPayload outcome', {
      mutated,
      inputLength: typeof raw === 'string' ? raw.length : null,
      outputLength: serialized.length,
      metrics
    });
    return serialized;
  }
  return mutated ? JSON.stringify(normalized) : raw;
}

function loadCloudIndex() {
  const raw = originalGetItem(CLOUD_INDEX_KEY);
  const parsed = parseJson(raw);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed;
  }
  return {};
}

function saveCloudIndex() {
  const payload = JSON.stringify(cloudIndexCache);
  withGuardedWrite(CLOUD_INDEX_KEY, () => {
    originalSetItem(CLOUD_INDEX_KEY, payload);
  });
}

function ensureIndexEntry(hash) {
  if (!hash) {
    return;
  }
  if (!cloudIndexCache[hash]) {
    cloudIndexCache[hash] = {
      hash,
      status: 'unknown',
      updatedAt: new Date().toISOString()
    };
  }
}

function updateIndex(hash, patch) {
  if (!hash) {
    return;
  }
  ensureIndexEntry(hash);
  cloudIndexCache[hash] = {
    ...cloudIndexCache[hash],
    ...patch,
    hash,
    updatedAt: new Date().toISOString()
  };
  saveCloudIndex();
}

function readSupabaseState(raw) {
  const parsed = parseJson(raw);
  if (!parsed || typeof parsed !== 'object') {
    return {};
  }
  return parsed;
}

function rewriteStorageForHash(hash, remoteUrl) {
  const raw = originalGetItem(LEGACY_PHOTO_KEY);
  const parsed = parseJson(raw);
  if (!parsed) {
    memoizeHashMapping(remoteUrl, hash);
    return;
  }
  const { value: updatedRoot, mutated } = applyRemoteToPayload(parsed, hash, remoteUrl);
  if (!mutated) {
    return;
  }
  const payload = JSON.stringify(updatedRoot);
  withGuardedWrite(LEGACY_PHOTO_KEY, () => {
    originalSetItem(LEGACY_PHOTO_KEY, payload);
  });
  memoizeHashMapping(remoteUrl, hash);
}

function applyRemoteUrl(hash) {
  if (!hash) {
    return;
  }
  const remoteUrl = getRemoteUrlForHash(hash);
  if (!remoteUrl) {
    return;
  }
  rewriteStorageForHash(hash, remoteUrl);
  updateCardsForHash(hash, remoteUrl);
  updateIndex(hash, { url: remoteUrl, status: 'success' });
  pendingRemoteUrls.delete(hash);
}

function onSupabaseStateChange(raw) {
  const entries = readSupabaseState(raw);
  Object.keys(entries).forEach(hash => {
    const record = entries[hash];
    if (!record || typeof record !== 'object') {
      return;
    }
    const { status, url = null, message = null } = record;
    updateIndex(hash, { status: status || 'unknown', url, message: message || undefined });
    if (status === 'success' && url) {
      pendingRemoteUrls.set(hash, url);
      applyRemoteUrl(hash);
    }
  });
}

function registerDataUrl(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return;
  }
  if (hashByDataUrl.has(dataUrl)) {
    applyRemoteUrl(hashByDataUrl.get(dataUrl));
    return;
  }
  computeHashFromDataUrl(dataUrl).then(hash => {
    if (!hash) {
      return;
    }
    memoizeHashMapping(dataUrl, hash);
    applyRemoteUrl(hash);
  }).catch(error => {
    console.warn('[Cloud Shim] Failed to compute hash for data URL.', error);
  });
}

function onLegacyPhotosWrite(raw) {
  const payload = parseJson(raw);
  if (!payload) {
    return;
  }
  forEachPhotoRecord(payload, record => {
    const recordHash = typeof record.cloudHash === 'string' ? record.cloudHash.trim() : null;
    const recordUrl = typeof record.cloudUrl === 'string' ? record.cloudUrl.trim() : null;
    if (recordHash) {
      ensureIndexEntry(recordHash);
    }
    if (recordHash && recordUrl) {
      updateIndex(recordHash, { url: recordUrl });
      memoizeHashMapping(recordUrl, recordHash);
    }
    visitStrings(record, value => {
      if (typeof value !== 'string') {
        return;
      }
      if (value.startsWith('data:image/')) {
        registerDataUrl(value);
        return;
      }
      if (value.startsWith(PENDING_PROTOCOL)) {
        const pendingHash = value.slice(PENDING_PROTOCOL.length).trim();
        if (pendingHash) {
          ensureIndexEntry(pendingHash);
        }
      }
    });
  });
}

function updateCardsForHash(hash, remoteUrl) {
  const cards = cardsByHash.get(hash);
  if (!cards || !cards.size) {
    return;
  }
  cards.forEach(card => {
    const image = card.querySelector('img');
    if (image && image.src !== remoteUrl) {
      image.src = remoteUrl;
    }
    card.dataset.cloudDataUrl = remoteUrl;
  });
}

function trackCard(card, attempt = 0) {
  if (!(card instanceof Element)) {
    return;
  }
  const { cloudHash: hash = '', cloudDataUrl: dataUrl = '' } = card.dataset;
  if (!hash && attempt < MAX_INIT_RETRIES) {
    setTimeout(() => trackCard(card, attempt + 1), 100);
    return;
  }
  if (hash) {
    if (!cardsByHash.has(hash)) {
      cardsByHash.set(hash, new Set());
    }
    cardsByHash.get(hash).add(card);
    if (dataUrl) {
      memoizeHashMapping(dataUrl, hash);
    }
    applyRemoteUrl(hash);
  }
}

function observeGallery() {
  const gallery = document.getElementById('photoGallery');
  if (!gallery) {
    return;
  }
  gallery.querySelectorAll('.photo-item').forEach(card => trackCard(card));
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node instanceof Element) {
          if (node.classList.contains('photo-item')) {
            trackCard(node);
          } else {
            const nested = node.querySelector('.photo-item');
            if (nested) {
              trackCard(nested);
            }
          }
        }
      });
    });
  });
  observer.observe(gallery, { childList: true, subtree: true });
}

function markMigrationComplete() {
  withGuardedWrite(MIGRATION_VERSION_FLAG, () => {
    originalSetItem(MIGRATION_VERSION_FLAG, 'true');
  });
}

function runInitialSync() {
  const existing = originalGetItem(LEGACY_PHOTO_KEY);
  if (existing) {
    const optimized = optimizeLegacyPayload(existing);
    if (optimized !== existing) {
      withGuardedWrite(LEGACY_PHOTO_KEY, () => {
        originalSetItem(LEGACY_PHOTO_KEY, optimized);
      });
      onLegacyPhotosWrite(optimized);
    } else {
      onLegacyPhotosWrite(existing);
    }
  } else {
    onLegacyPhotosWrite(null);
  }
  onSupabaseStateChange(originalGetItem(SUPABASE_STATE_KEY));
  if (!originalGetItem(MIGRATION_VERSION_FLAG)) {
    markMigrationComplete();
  }
}

localStorage.setItem = function patchedSetItem(key, value) {
  const isGuarded = guardedWrites.has(key);
  let nextValue = value;
  if (!isGuarded && key === LEGACY_PHOTO_KEY) {
    try {
      nextValue = optimizeLegacyPayload(value);
    } catch (error) {
      console.warn('[Cloud Shim] Failed to optimize legacy payload before write.', error);
    }
    if (typeof value === 'string' && typeof nextValue === 'string' && optimizeLogCount < MAX_DEBUG_LOGS) {
      console.debug('[Cloud Shim] setItem pre-write', {
        originalLength: value.length,
        optimizedLength: nextValue.length,
        mutated: nextValue !== value
      });
    }
  }
  try {
    originalSetItem(key, nextValue);
  } catch (error) {
    if (!isGuarded && key === LEGACY_PHOTO_KEY && error?.name === 'QuotaExceededError') {
      console.warn('[Cloud Shim] Quota exceeded while saving. Retrying after optimization.');
      try {
        const retryValue = optimizeLegacyPayload(nextValue);
        if (retryValue !== nextValue) {
          originalSetItem(key, retryValue);
          nextValue = retryValue;
        } else {
          throw error;
        }
      } catch (retryError) {
        if (quotaLogCount < MAX_DEBUG_LOGS) {
          quotaLogCount += 1;
          console.error('[Cloud Shim] Unable to recover from quota error.', retryError, {
            attemptedLength: typeof nextValue === 'string' ? nextValue.length : null,
            parsed: !!parseJson(nextValue)
          });
          const parsedForDebug = parseJson(nextValue);
          if (parsedForDebug) {
            const metrics = summarizeStrings(parsedForDebug);
            console.info('[Cloud Shim] Payload summary at quota failure', metrics);
          } else if (typeof nextValue === 'string') {
            console.info('[Cloud Shim] Payload snippet at quota failure', nextValue.slice(0, 200));
          }
        }
        throw error;
      }
    } else {
      throw error;
    }
  }
  if (isGuarded) {
    return;
  }
  if (key === LEGACY_PHOTO_KEY) {
    onLegacyPhotosWrite(nextValue);
  }
  if (key === SUPABASE_STATE_KEY) {
    onSupabaseStateChange(nextValue);
  }
};

localStorage.removeItem = function patchedRemoveItem(key) {
  const result = originalRemoveItem(key);
  if (guardedWrites.has(key)) {
    return result;
  }
  if (key === LEGACY_PHOTO_KEY) {
    onLegacyPhotosWrite(null);
  }
  if (key === SUPABASE_STATE_KEY) {
    onSupabaseStateChange(null);
  }
  return result;
};

document.addEventListener('DOMContentLoaded', () => {
  observeGallery();
  runInitialSync();
});
