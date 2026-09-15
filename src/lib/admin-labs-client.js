// Client-side gateway to /admin/api/labs, used by src/routes/admin's pages.
const BASE = "/admin/api/labs";

async function unwrap(res, fallback) {
	if (res.ok) return res.status === 204 ? null : res.json();
	const body = await res.json().catch(() => ({}));
	throw new Error(body.message || fallback);
}

export const fetchLabs = () => fetch(BASE).then((res) => unwrap(res, "Failed to load labs"));

export const fetchLab = (id) =>
	fetch(`${BASE}/${encodeURIComponent(id)}`).then((res) => unwrap(res, "Failed to load lab"));

export const createLab = (fields) =>
	fetch(BASE, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(fields)
	}).then((res) => unwrap(res, "Failed to create lab"));

export const updateLab = (id, patch) =>
	fetch(`${BASE}/${encodeURIComponent(id)}`, {
		method: "PATCH",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(patch)
	}).then((res) => unwrap(res, "Failed to save lab"));

export const deleteLab = (id) =>
	fetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" }).then((res) => unwrap(res, "Failed to delete lab"));

export const createStep = (labId, fields) =>
	fetch(`${BASE}/${encodeURIComponent(labId)}/steps`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(fields)
	}).then((res) => unwrap(res, "Failed to create step"));

export const updateStep = (labId, stepId, patch) =>
	fetch(`${BASE}/${encodeURIComponent(labId)}/steps/${encodeURIComponent(stepId)}`, {
		method: "PATCH",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(patch)
	}).then((res) => unwrap(res, "Failed to save step"));

export const deleteStep = (labId, stepId) =>
	fetch(`${BASE}/${encodeURIComponent(labId)}/steps/${encodeURIComponent(stepId)}`, {
		method: "DELETE"
	}).then((res) => unwrap(res, "Failed to delete step"));

export const reorderSteps = (labId, order) =>
	fetch(`${BASE}/${encodeURIComponent(labId)}/steps/reorder`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ order })
	}).then((res) => unwrap(res, "Failed to reorder steps"));
