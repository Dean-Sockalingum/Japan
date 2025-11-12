const LEGACY_PHOTO_KEY = 'japan_photos';
const CLOUD_INDEX_KEY = 'cloudPhotoIndex';
const SUPABASE_STATE_KEY = 'supabaseCloudUploads';
const MIGRATION_VERSION_FLAG = 'cloudStorageShim:v1';
const MAX_INIT_RETRIES = 10;

const originalSetItem = localStorage.setItem.bind(localStorage);
const originalGetItem = localStorage.getItem.bind(localStorage);
const originalRemoveItem = localStorage.removeItem.bind(localStorage);

const guardedWrites = new Set();
const cardsByHash = new Map();
const dataUrlByHash = new Map();
const hashByDataUrl = new Map();
const pendingRemoteUrls = new Map();
let cloudIndexCache = loadCloudIndex();

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

localStorage.setItem = function patchedSetItem(key, value) {
  const result = originalSetItem(key, value);
  if (guardedWrites.has(key)) {
    return result;
  }
  if (key === LEGACY_PHOTO_KEY) {
    onLegacyPhotosWrite(value);
  }
  if (key === SUPABASE_STATE_KEY) {
    onSupabaseStateChange(value);
  }
  return result;
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

function onLegacyPhotosWrite(raw) {
  const photos = parseJson(raw);
  if (!Array.isArray(photos)) {
    return;
  }
  photos.forEach(record => {
    if (!record || typeof record !== 'object') {
      return;
    }
    Object.keys(record).forEach(key => {
      const value = record[key];
      if (typeof value === 'string' && value.startsWith('data:image/')) {
        registerDataUrl(value);
      }
      if (typeof value === 'string' && key === 'cloudHash' && value) {
        ensureIndexEntry(value);
      }
      if (typeof value === 'string' && key === 'cloudUrl' && record.cloudHash) {
        updateIndex(record.cloudHash, { url: value });
      }
    });
  });
}

function supportsCryptoDigest() {
  return typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function';
}

async function computeHashFromDataUrl(dataUrl) {
  if (hashByDataUrl.has(dataUrl)) {
    return hashByDataUrl.get(dataUrl);
  }
  const base64 = dataUrl.split(',')[1];
  if (!base64) {
    return null;
  }
  let bytes;
  try {
    const binary = atob(base64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
  } catch (error) {
    console.warn('[Cloud Shim] Unable to decode base64 payload.', error);
    return null;
  }
  let hash;
  if (supportsCryptoDigest()) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      hash = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('[Cloud Shim] crypto.subtle.digest failed, falling back.', error);
    }
  }
  if (!hash) {
    let accumulator = 0;
    for (let i = 0; i < bytes.length; i += 1) {
      accumulator = (accumulator + bytes[i] + ((accumulator << 7) & 0xffffffff)) >>> 0;
    }
    hash = accumulator.toString(16).padStart(8, '0');
  }
  hashByDataUrl.set(dataUrl, hash);
  if (!dataUrlByHash.has(hash)) {
    dataUrlByHash.set(hash, dataUrl);
  }
  return hash;
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
    if (!dataUrlByHash.has(hash)) {
      dataUrlByHash.set(hash, dataUrl);
    }
    applyRemoteUrl(hash);
  }).catch(error => {
    console.warn('[Cloud Shim] Failed to compute hash for data URL.', error);
  });
}

function applyRemoteUrl(hash) {
  if (!hash) {
    return;
  }
  const remoteUrl = pendingRemoteUrls.get(hash);
  if (!remoteUrl) {
    return;
  }
  const dataUrl = dataUrlByHash.get(hash);
  if (dataUrl && dataUrl.startsWith('data:image/')) {
    replaceDataUrlInStorage(hash, dataUrl, remoteUrl);
  }
  updateCardsForHash(hash, remoteUrl);
  updateIndex(hash, { url: remoteUrl, status: 'success' });
}

function replaceDataUrlInStorage(hash, dataUrl, remoteUrl) {
  const raw = originalGetItem(LEGACY_PHOTO_KEY);
  const parsed = parseJson(raw);
  if (!Array.isArray(parsed)) {
    return;
  }
  let mutated = false;
  const next = parsed.map(record => {
    if (!record || typeof record !== 'object') {
      return record;
    }
    const clone = { ...record };
    let localHash = clone.cloudHash;
    Object.keys(clone).forEach(key => {
      const value = clone[key];
      if (typeof value === 'string' && value === dataUrl) {
        clone[key] = remoteUrl;
        mutated = true;
        localHash = localHash || hash;
      }
    });
    if (mutated) {
      clone.cloudHash = localHash || hash;
      clone.cloudUrl = remoteUrl;
    }
    return clone;
  });
  if (!mutated) {
    return;
  }
  const payload = JSON.stringify(next);
  withGuardedWrite(LEGACY_PHOTO_KEY, () => {
    originalSetItem(LEGACY_PHOTO_KEY, payload);
  });
  dataUrlByHash.set(hash, remoteUrl);
  hashByDataUrl.set(remoteUrl, hash);
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
      dataUrlByHash.set(hash, dataUrl);
      hashByDataUrl.set(dataUrl, hash);
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
  if (!originalGetItem(MIGRATION_VERSION_FLAG)) {
    onLegacyPhotosWrite(originalGetItem(LEGACY_PHOTO_KEY));
    markMigrationComplete();
  }
  onSupabaseStateChange(originalGetItem(SUPABASE_STATE_KEY));
}

document.addEventListener('DOMContentLoaded', () => {
  observeGallery();
  runInitialSync();
});
