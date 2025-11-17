(function setupCloudSyncSummary() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const STORAGE_KEY = 'cloud-sync-summary-v1';
  const BADGE_STATES = {
    idle: { label: 'Idle', className: '' },
    syncing: { label: 'Syncing', className: 'cloud-sync-badge--syncing' },
    success: { label: 'Backed up', className: 'cloud-sync-badge--success' },
    error: { label: 'Needs attention', className: 'cloud-sync-badge--error' }
  };

  const state = {
    totalUploads: 0,
    pendingUploads: 0,
    lastSync: null,
    lastError: null,
    lastErrorAt: null,
    latencyMs: null,
    status: 'idle'
  };

  hydrateFromStorage();

  const bootstrap = () => {
    updateUI();
    instrumentFetch();
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    bootstrap();
  } else {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  }

  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        const incoming = JSON.parse(event.newValue);
        Object.assign(state, incoming);
        updateUI();
      } catch (_) {
        /* ignore */
      }
    }
  });

  window.cloudSyncSummary = {
    getState: () => ({ ...state }),
    markSuccess(latencyMs) {
      applySuccess(latencyMs);
    },
    markError(message) {
      applyError(message || 'Upload failed');
    },
    refresh: updateUI
  };

  function hydrateFromStorage() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        Object.assign(state, parsed);
      }
    } catch (_) {
      /* ignore */
    }
  }

  function persistState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      /* ignore private mode/localStorage issues */
    }
  }

  function formatRelativeTime(dateString) {
    if (!dateString) {
      return 'Not yet synced';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }
    const diff = Date.now() - date.getTime();
    if (diff < 60_000) {
      return 'Just now';
    }
    if (diff < 3_600_000) {
      const minutes = Math.round(diff / 60_000);
      return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    }
    if (diff < 86_400_000) {
      const hours = Math.round(diff / 3_600_000);
      return `${hours} hr${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.round(diff / 86_400_000);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  function formatTimestamp(dateString) {
    if (!dateString) {
      return 'Not yet synced';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }
    return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  }

  function formatLatency(latency) {
    if (!Number.isFinite(latency) || latency <= 0) {
      return '—';
    }
    if (latency >= 1000) {
      return `≈ ${(latency / 1000).toFixed(1)} s`;
    }
    return `≈ ${Math.round(latency)} ms`;
  }

  function updateUI() {
    const badge = document.getElementById('cloudSyncBadge');
    if (!badge) {
      return;
    }
    const subtitle = document.getElementById('cloudSyncSubtitle');
    const photoCount = document.getElementById('cloudPhotoCount');
    const pendingCount = document.getElementById('cloudPendingCount');
    const lastSync = document.getElementById('cloudLastSync');
    const lastError = document.getElementById('cloudLastError');
    const latency = document.getElementById('cloudLatencyStat');

    const badgeState = BADGE_STATES[state.status] || BADGE_STATES.idle;
    badge.textContent = badgeState.label;
    badge.className = `cloud-sync-badge ${badgeState.className}`.trim();

    subtitle.textContent = buildSubtitle();
    photoCount.textContent = state.totalUploads.toString();
    pendingCount.textContent = state.pendingUploads.toString();
    lastSync.textContent = formatTimestamp(state.lastSync);
    lastSync.setAttribute('title', state.lastSync || 'No sync yet');
    lastError.textContent = state.lastError
      ? `${state.lastError}${state.lastErrorAt ? ` (${formatRelativeTime(state.lastErrorAt)})` : ''}`
      : 'None 🎉';
    latency.textContent = formatLatency(state.latencyMs);
  }

  function buildSubtitle() {
    if (state.status === 'syncing') {
      const count = Math.max(state.pendingUploads, 1);
      return `Uploading ${count} photo${count === 1 ? '' : 's'}…`;
    }
    if (state.status === 'success' && state.lastSync) {
      return `Latest backup ${formatRelativeTime(state.lastSync)}`;
    }
    if (state.status === 'error' && state.lastErrorAt) {
      return `Last failure ${formatRelativeTime(state.lastErrorAt)}`;
    }
    if (state.totalUploads > 0 && state.lastSync) {
      return `Last synced ${formatRelativeTime(state.lastSync)}`;
    }
    return 'Waiting for first upload';
  }

  function instrumentFetch() {
    if (window.__cloudSyncFetchWrapped || typeof window.fetch !== 'function') {
      return;
    }
    const nativeFetch = window.fetch.bind(window);
    window.__cloudSyncFetchWrapped = true;

    window.fetch = async function wrappedFetch(input, init) {
      const url = extractUrl(input);
      const method = extractMethod(input, init);
      const isUploadRequest = typeof url === 'string' && url.includes('/.netlify/functions/upload-photo');

      if (!isUploadRequest || method !== 'POST') {
        return nativeFetch(input, init);
      }

      adjustPending(1);
      setStatus('syncing');
      const startedAt = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      try {
        const response = await nativeFetch(input, init);
        const duration = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - startedAt;
        if (response.ok) {
          state.totalUploads += 1;
          state.lastSync = new Date().toISOString();
          state.latencyMs = duration;
          state.lastError = null;
          state.lastErrorAt = null;
          setStatus('success');
        } else {
          const message = await extractErrorMessage(response);
          state.latencyMs = duration;
          applyError(message || 'Upload failed');
        }
        persistState();
        updateUI();
        return response;
      } catch (error) {
        const duration = ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - startedAt;
        state.latencyMs = duration;
        applyError(error?.message || 'Network error');
        persistState();
        updateUI();
        throw error;
      } finally {
        adjustPending(-1);
      }
    };
  }

  function extractUrl(input) {
    if (typeof input === 'string') {
      return input;
    }
    if (input && typeof input.url === 'string') {
      return input.url;
    }
    return '';
  }

  function extractMethod(input, init) {
    const fromInit = init && typeof init.method === 'string' ? init.method : null;
    const fromInput = input && typeof input.method === 'string' ? input.method : null;
    return (fromInit || fromInput || 'GET').toUpperCase();
  }

  async function extractErrorMessage(response) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (data && typeof data === 'object') {
        return data.message || data.details || JSON.stringify(data);
      }
      if (typeof data === 'string') {
        return data;
      }
    } catch (_) {
      try {
        const text = await response.clone().text();
        if (text) {
          return text;
        }
      } catch (_) {
        /* ignore */
      }
    }
    return response.statusText;
  }

  function adjustPending(delta) {
    state.pendingUploads = Math.max(0, state.pendingUploads + delta);
    persistState();
    updateUI();
  }

  function setStatus(nextStatus) {
    state.status = nextStatus;
    persistState();
    updateUI();
  }

  function applySuccess(latency) {
    state.latencyMs = latency ?? state.latencyMs;
    state.lastSync = new Date().toISOString();
    state.lastError = null;
    state.lastErrorAt = null;
    setStatus('success');
  }

  function applyError(message) {
    state.lastError = message;
    state.lastErrorAt = new Date().toISOString();
    setStatus('error');
  }
})();
