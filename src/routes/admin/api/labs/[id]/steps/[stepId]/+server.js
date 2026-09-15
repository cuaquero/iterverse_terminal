import { error, json } from "@sveltejs/kit";
import { requireAdminAccess, isSameOriginRequest } from "$lib/server/admin-access";
import { updateStep, deleteStep } from "$lib/server/labs-db";

async function requireAdmin(request, platform) {
	const email = await requireAdminAccess(request, platform?.env);
	if (!email) throw error(401, "Sign-in required");
	return platform.env.LABS_DB;
}

const EDITABLE_FIELDS = ["name", "subtitle", "header", "content", "position"];

export async function PATCH({ request, platform, params }) {
	const db = await requireAdmin(request, platform);
	if (!isSameOriginRequest(request)) throw error(403, "Forbidden");

	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, "Invalid JSON body");
	}

	const patch = {};
	for (const field of EDITABLE_FIELDS) {
		if (!(field in body)) continue;
		patch[field] = field === "name" && typeof body[field] === "string" ? body[field].trim() : body[field];
	}
	if ("name" in patch && !patch.name) throw error(400, "Name is required");

	const step = await updateStep(db, params.stepId, patch);
	if (!step) throw error(404, "Not found");
	return json(step);
}

export async function DELETE({ request, platform, params }) {
	const db = await requireAdmin(request, platform);
	if (!isSameOriginRequest(request)) throw error(403, "Forbidden");

	const deleted = await deleteStep(db, params.stepId);
	if (!deleted) throw error(404, "Not found");
	return json({ ok: true });
}
