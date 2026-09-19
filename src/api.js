/**
 * KisanSetu — API Client with Offline Fallback.
 *
 * Every function tries the real backend first. If the backend
 * is unreachable (offline, server down, network error), it
 * silently falls back to returning the provided fallback data.
 * This gives the app "offline-first" behaviour.
 */

const API = "/api";  // Vite proxy will forward to http://localhost:8000

/**
 * Generic fetcher with automatic offline fallback.
 *
 * @param {string} url        — relative API path, e.g. "/farmer/FR-98213/dashboard"
 * @param {*}      fallback   — value to return when the API is unreachable
 * @param {object} options    — standard fetch options (method, body, headers)
 * @returns {Promise<*>}
 */
export async function fetchWithFallback(url, fallback, options = {}) {
  try {
    const res = await fetch(`${API}${url}`, {
      headers: { "Content-Type": "application/json", ...options.headers },
      ...options,
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[KisanSetu] API unavailable for ${url}, using offline fallback:`, err.message);
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/* Farmer endpoints                                                    */
/* ------------------------------------------------------------------ */

export function getFarmerDashboard(farmerId, fallback) {
  return fetchWithFallback(`/farmer/${farmerId}/dashboard`, fallback);
}

export function getFarmerStatus(farmerId, fallback) {
  return fetchWithFallback(`/farmer/${farmerId}/status`, fallback);
}

/* ------------------------------------------------------------------ */
/* Slots                                                               */
/* ------------------------------------------------------------------ */

export function getSlots(centreId, date, fallback, farmerId = null) {
  const query = farmerId ? `?farmer_id=${encodeURIComponent(farmerId)}` : "";
  return fetchWithFallback(`/slots/${centreId}/${date}${query}`, fallback);
}

export function getCropPerishability(fallback) {
  return fetchWithFallback(`/crops/perishability`, fallback);
}

export function bookSlot(farmerId, centreId, slotId) {
  return fetchWithFallback(`/slots/book`, null, {
    method: "POST",
    body: JSON.stringify({
      farmer_id: farmerId,
      centre_id: centreId,
      slot_id: slotId,
    }),
  });
}

/* ------------------------------------------------------------------ */
/* Queue                                                               */
/* ------------------------------------------------------------------ */

export function getQueue(centreId, fallback) {
  return fetchWithFallback(`/queue/${centreId}`, fallback);
}

export function advanceQueue(centreId) {
  return fetchWithFallback(`/queue/advance/${centreId}`, null, {
    method: "POST",
  });
}

export function resetQueue(centreId = 1) {
  return fetchWithFallback(`/queue/reset/${centreId}`, null, {
    method: "POST",
  });
}

/* ------------------------------------------------------------------ */
/* Mandi staff                                                         */
/* ------------------------------------------------------------------ */

export function getMandiDashboard(centreId, fallback) {
  return fetchWithFallback(`/mandi/${centreId}/dashboard`, fallback);
}

export function getMandiUpcoming(centreId, fallback) {
  return fetchWithFallback(`/mandi/${centreId}/upcoming`, fallback);
}

export function startProcessing(bookingId) {
  return fetchWithFallback(`/mandi/process/${bookingId}`, null, {
    method: "POST",
  });
}

export function completeProcurement(bookingId, data) {
  return fetchWithFallback(`/mandi/complete/${bookingId}`, null, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export function getAdminOverview(fallback, centreId = null, state = null) {
  const params = new URLSearchParams();
  if (centreId) params.append("centre_id", centreId);
  if (state) params.append("state", state);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchWithFallback(`/admin/overview${q}`, fallback);
}

export function getAdminCentres(fallback, state = null) {
  const q = state ? `?state=${encodeURIComponent(state)}` : "";
  return fetchWithFallback(`/admin/centres${q}`, fallback);
}

export function getAdminStorage(fallback, centreId = null, state = null) {
  const params = new URLSearchParams();
  if (centreId) params.append("centre_id", centreId);
  if (state) params.append("state", state);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchWithFallback(`/admin/storage${q}`, fallback);
}

export function getAdminDbtQuota(fallback, centreId = null, state = null) {
  const params = new URLSearchParams();
  if (centreId) params.append("centre_id", centreId);
  if (state) params.append("state", state);
  const q = params.toString() ? `?${params.toString()}` : "";
  return fetchWithFallback(`/admin/dbt-quota${q}`, fallback);
}

/* ------------------------------------------------------------------ */
/* Allocation                                                          */
/* ------------------------------------------------------------------ */

export function getDemandCapacity(centreId, date, fallback) {
  return fetchWithFallback(`/allocation/demand/${centreId}?date=${date}`, fallback);
}

export function getImbalances(date, fallback) {
  return fetchWithFallback(`/allocation/imbalance?date=${date}`, fallback);
}

export function applyAllocationAction(sourceCentreId, targetCentreId, moveCount, date) {
  return fetchWithFallback(`/allocation/apply`, null, {
    method: "POST",
    body: JSON.stringify({
      source_centre_id: sourceCentreId,
      target_centre_id: targetCentreId,
      move_count: moveCount,
      date: date,
    }),
  });
}

/* ------------------------------------------------------------------ */
/* ML Arrival Prediction                                               */
/* ------------------------------------------------------------------ */

export function getArrivalForecast(centreId, rainAlert = false, crop = "Soybean", fallback = null) {
  return fetchWithFallback(`/prediction/forecast/${centreId}?rain_alert=${rainAlert}&crop=${crop}`, fallback);
}

export function getPredictionDrivers(fallback = null) {
  return fetchWithFallback(`/prediction/drivers`, fallback);
}


