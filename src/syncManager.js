/**
 * KisanSetu — Offline Sync Manager.
 *
 * Uses IndexedDB to store actions performed while offline.
 * Automatically syncs to the backend when connectivity returns.
 */

const DB_NAME = "kisansetu_offline";
const DB_VERSION = 1;
const STORE_NAME = "pending_actions";
const SYNC_ENDPOINT = "/api/sync/batch";
const HEALTH_ENDPOINT = "/api/health";

let db = null;
let syncInterval = null;
let listeners = [];

// ------------------------------------------------------------------ //
// IndexedDB Setup                                                     //
// ------------------------------------------------------------------ //

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

// ------------------------------------------------------------------ //
// Queue Operations                                                    //
// ------------------------------------------------------------------ //

export async function queueOfflineAction(action, data) {
  const database = await openDB();
  const id = crypto.randomUUID();
  const record = {
    id,
    action,
    timestamp: new Date().toISOString(),
    data,
    sync_status: "PENDING",
  };

  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(record);
    tx.oncomplete = () => {
      notifyListeners();
      resolve(record);
    };
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function getPendingActions() {
  const database = await openDB();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result.filter((r) => r.sync_status === "PENDING"));
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function getPendingCount() {
  const actions = await getPendingActions();
  return actions.length;
}

async function markSynced(ids) {
  const database = await openDB();
  const tx = database.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  for (const id of ids) {
    store.delete(id);
  }
  return new Promise((resolve) => {
    tx.oncomplete = () => {
      notifyListeners();
      resolve();
    };
  });
}

// ------------------------------------------------------------------ //
// Sync Engine                                                         //
// ------------------------------------------------------------------ //

export async function syncNow() {
  const pending = await getPendingActions();
  if (pending.length === 0) return { synced: 0 };

  try {
    const res = await fetch(SYNC_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions: pending }),
    });

    if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
    const result = await res.json();

    // Remove successfully synced items
    const syncedIds = result.results
      .filter((r) => r.status === "synced" || r.status === "skipped")
      .map((r) => r.id);

    if (syncedIds.length > 0) {
      await markSynced(syncedIds);
    }

    console.log(`[KisanSetu Sync] Synced ${result.synced}, skipped ${result.skipped}, failed ${result.failed}`);
    return result;
  } catch (err) {
    console.warn("[KisanSetu Sync] Backend unreachable, will retry later:", err.message);
    return null;
  }
}

// ------------------------------------------------------------------ //
// Auto-Sync: Network Detection + Polling                              //
// ------------------------------------------------------------------ //

export function startAutoSync(intervalMs = 15000) {
  // Listen for browser online event
  window.addEventListener("online", () => {
    console.log("[KisanSetu Sync] Network online detected, syncing...");
    syncNow();
  });

  // Also poll periodically
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(async () => {
    const pending = await getPendingActions();
    if (pending.length > 0) {
      // Check if backend is reachable
      try {
        const health = await fetch(HEALTH_ENDPOINT);
        if (health.ok) {
          syncNow();
        }
      } catch {
        // Still offline, skip
      }
    }
  }, intervalMs);
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

// ------------------------------------------------------------------ //
// Listener System (for UI badge updates)                              //
// ------------------------------------------------------------------ //

export function onSyncChange(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function notifyListeners() {
  getPendingCount().then((count) => {
    listeners.forEach((cb) => cb(count));
  });
}
