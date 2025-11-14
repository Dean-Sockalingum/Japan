const STORAGE_KEY = 'supabaseCloudUploads';
const MAX_CONCURRENT_UPLOADS = 2;
const SUPABASE_FUNCTION_ENDPOINT = '/.netlify/functions/upload-photo';
const HASH_RETRY_LIMIT = 5;

const uploadState = loadUploadState();
const dataUrlHashCache = new Map();
const uploadQueue = [];
let activeUploads = 0;
let savePhotoPatched = false;

function loadUploadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('[Supabase Sync] Failed to load persisted state.', error);
    return {};
  }
}

function persistUploadState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uploadState));
  } catch (error) {
    console.warn('[Supabase Sync] Unable to persist state.', error);
  }
}

function setState(hash, patch) {
  const current = uploadState[hash] || {};
  const next = { ...current, ...patch, hash };

  if (next.status && next.status !== 'error') {
    delete next.message;
  }

  uploadState[hash] = next;
  persistUploadState();
  renderStatusForHash(hash);
}

function renderStatusForHash(hash) {
  const record = uploadState[hash];
  const cards = getCardsForHash(hash);
  cards.forEach(card => renderCardStatus(card, record));
}

function getCardsForHash(hash) {
  return Array.from(document.querySelectorAll(`.photo-item[data-cloud-hash="${hash}"]`));
}

function ensureStatusElements(card) {
  let container = card.querySelector('.cloud-sync-status');
  if (!container) {
    container = document.createElement('div');
    container.className = 'cloud-sync-status';
    container.innerHTML = `
      <span class="cloud-sync-status__text"></span>
      <a class="cloud-sync-status__link" target="_blank" rel="noopener" hidden>View</a>
      <button type="button" class="cloud-sync-status__retry" hidden>Retry</button>
    `;
    card.appendChild(container);

    const retryButton = container.querySelector('.cloud-sync-status__retry');
    retryButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      const hash = card.dataset.cloudHash;
      const dataUrl = card.dataset.cloudDataUrl;
      if (!hash || !dataUrl) {
        return;
      }
      enqueueUpload({ hash, dataUrl, card, force: true, reason: 'retry' });
    });
  }

  return {
    container,
    text: container.querySelector('.cloud-sync-status__text'),
    link: container.querySelector('.cloud-sync-status__link'),
    retry: container.querySelector('.cloud-sync-status__retry')
  };
}

function renderCardStatus(card, record) {
  const status = record?.status ?? 'queued';
  const elements = ensureStatusElements(card);

  elements.container.dataset.status = status;
  elements.link.hidden = true;
  elements.retry.hidden = true;
  elements.retry.disabled = false;

  switch (status) {
    case 'success': {
  elements.text.textContent = 'Cloud synced';
      if (record?.url) {
        elements.link.hidden = false;
        elements.link.href = record.url;
        elements.link.textContent = 'View';
        elements.link.title = 'Open uploaded photo in a new tab';
      }
      break;
    }
    case 'uploading': {
  elements.text.textContent = 'Cloud syncing...';
      break;
    }
    case 'queued': {
  elements.text.textContent = 'Cloud upload queued';
      break;
    }
    case 'error': {
  const message = record?.message ? truncate(record.message, 80) : 'Upload failed';
  elements.text.textContent = `Warning: ${message}`;
      elements.retry.hidden = false;
      elements.retry.textContent = 'Retry';
      break;
    }
    default: {
  elements.text.textContent = 'Cloud upload pending';
    }
  }
}

function truncate(value, maxLength) {
  if (!value || value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}...`;
}

function enqueueUpload({ hash, dataUrl, card, force = false, reason = 'auto' }) {
  if (!hash || !dataUrl) {
    return;
  }

  if (card) {
    card.dataset.cloudHash = hash;
    card.dataset.cloudDataUrl = dataUrl;
  }

  const record = uploadState[hash];
  if (!force && record?.status === 'success') {
    renderStatusForHash(hash);
    return;
  }

  const nextRecord = {
    ...record,
    status: 'queued',
    reason,
    lastQueuedAt: new Date().toISOString()
  };

  setState(hash, nextRecord);
  pushQueueEntry(hash, dataUrl, card, force);
  processQueue();
}

function pushQueueEntry(hash, dataUrl, card, force) {
  let entryIndex = uploadQueue.findIndex(item => item.hash === hash);
  if (entryIndex === -1) {
    const entry = {
      hash,
      dataUrl,
      cards: new Set(card ? [card] : []),
      metadata: buildMetadata(card)
    };
    uploadQueue.push(entry);
    return;
  }

  const entry = uploadQueue[entryIndex];
  entry.dataUrl = dataUrl;
  if (card) {
    entry.cards.add(card);
  }

  if (force) {
    uploadQueue.splice(entryIndex, 1);
    uploadQueue.push(entry);
  }
}

function buildMetadata(card) {
  const metadata = {
    pageUrl: window.location.href,
    queuedAt: new Date().toISOString()
  };

  if (!card) {
    return metadata;
  }

  const caption = card.querySelector('figcaption, .photo-caption, .photo-title');
  if (caption?.textContent) {
    metadata.caption = caption.textContent.trim();
  }

  return metadata;
}

function processQueue() {
  if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
    return;
  }

  if (!uploadQueue.length) {
    return;
  }

  const entry = uploadQueue.shift();
  if (!entry) {
    return;
  }

  activeUploads += 1;
  setState(entry.hash, {
    status: 'uploading',
    lastAttemptAt: new Date().toISOString()
  });

  performUpload(entry)
    .catch(error => {
      console.error('[Supabase Sync] Upload error', error);
    })
    .finally(() => {
      activeUploads = Math.max(0, activeUploads - 1);
      processQueue();
    });
}

async function performUpload(entry) {
  const { hash, dataUrl, metadata } = entry;

  let response;
  try {
    response = await fetch(SUPABASE_FUNCTION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dataUrl, hash, metadata })
    });
  } catch (networkError) {
    setState(hash, {
      status: 'error',
      message: networkError?.message || 'Network error during upload.'
    });
    return;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.message || `Upload failed (${response.status})`;
    setState(hash, {
      status: 'error',
      message
    });
    return;
  }

  setState(hash, {
    status: 'success',
    url: payload?.url ?? null,
    path: payload?.path ?? null,
    bucket: payload?.bucket ?? null,
    uploadedAt: payload?.storedAt ?? new Date().toISOString()
  });
}

async function handleCard(card) {
  if (!card) {
    return;
  }

  const img = card.querySelector('img');
  if (!img) {
    return;
  }

  const dataUrl = (img.currentSrc || img.src || '').trim();
  if (!dataUrl.startsWith('data:image/')) {
    return;
  }

  card.dataset.cloudDataUrl = dataUrl;

  try {
    const hash = await computeHash(dataUrl);
    card.dataset.cloudHash = hash;

    const record = uploadState[hash];
    if (!record) {
      enqueueUpload({ hash, dataUrl, card, reason: 'initial' });
      return;
    }

    switch (record.status) {
      case 'success':
        renderCardStatus(card, record);
        break;
      case 'error':
        renderCardStatus(card, record);
        break;
      default:
        enqueueUpload({ hash, dataUrl, card, force: true, reason: 'resume' });
    }
  } catch (error) {
    console.error('[Supabase Sync] Unable to hash image.', error);
    renderCardStatus(card, {
      status: 'error',
      message: 'Could not prepare image for upload.'
    });
  }
}

function getCardsMatchingDataUrl(dataUrl) {
  return Array.from(document.querySelectorAll('.photo-item img'))
    .filter(img => img.src === dataUrl || img.currentSrc === dataUrl)
    .map(img => img.closest('.photo-item'))
    .filter(Boolean);
}

function scheduleHandleDataUrl(dataUrl, attempt = 0) {
  if (attempt > HASH_RETRY_LIMIT) {
    return;
  }

  setTimeout(() => {
    const cards = getCardsMatchingDataUrl(dataUrl);
    if (!cards.length) {
      scheduleHandleDataUrl(dataUrl, attempt + 1);
      return;
    }
    cards.forEach(card => handleCard(card));
  }, attempt * 120);
}

async function computeHash(dataUrl) {
  if (dataUrlHashCache.has(dataUrl)) {
    return dataUrlHashCache.get(dataUrl);
  }

  const bytes = await readDataUrlBytes(dataUrl);
  if (!bytes || !bytes.length) {
    throw new Error('No bytes extracted from data URL.');
  }

  let hash;
  if (supportsSubtleCrypto()) {
    const digest = await crypto.subtle.digest('SHA-256', bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
    hash = bufferToHex(new Uint8Array(digest));
  } else {
    hash = fallbackHash(bytes);
  }

  dataUrlHashCache.set(dataUrl, hash);
  return hash;
}

function supportsSubtleCrypto() {
  return typeof crypto !== 'undefined' && typeof crypto.subtle?.digest === 'function';
}

async function readDataUrlBytes(dataUrl) {
  if (typeof fetch === 'function') {
    try {
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.warn('[Supabase Sync] fetch() failed for data URL, falling back to atob.', error);
    }
  }

  const base64 = dataUrl.split(',')[1];
  if (!base64) {
    return null;
  }

  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bufferToHex(bytes) {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function fallbackHash(bytes) {
  let hash = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    hash = (hash + bytes[i] + ((hash << 7) & 0xffffffff)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function initObserver() {
  const gallery = document.getElementById('photoGallery');
  if (!gallery) {
    return;
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) {
          return;
        }
        if (node.classList.contains('photo-item')) {
          handleCard(node);
          return;
        }
        const card = node.querySelector?.('.photo-item');
        if (card) {
          handleCard(card);
        }
      });
    }
  });

  observer.observe(gallery, { childList: true });
}

function patchSavePhoto(attempt = 0) {
  if (savePhotoPatched) {
    return;
  }

  if (typeof window.savePhoto !== 'function') {
    if (attempt > HASH_RETRY_LIMIT) {
      console.warn('[Supabase Sync] Failed to locate savePhoto function. Automatic uploads disabled.');
      return;
    }
    setTimeout(() => patchSavePhoto(attempt + 1), 150);
    return;
  }

  const originalSavePhoto = window.savePhoto;
  window.savePhoto = function patchedSavePhoto(...args) {
    const [dataUrl] = args;
    const result = originalSavePhoto.apply(this, args);
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
      scheduleHandleDataUrl(dataUrl);
    }
    return result;
  };
  savePhotoPatched = true;
}

async function bootstrapExistingCards() {
  const cards = Array.from(document.querySelectorAll('.photo-item'));
  for (const card of cards) {
    await handleCard(card);
  }
}

function initialize() {
  patchSavePhoto();
  initObserver();
  bootstrapExistingCards();
}

document.addEventListener('DOMContentLoaded', () => {
  initialize();
});
