import { error, json } from "@sveltejs/kit";
import { requireAdminAccess, isSameOriginRequest } from "$lib/server/admin-access";
import { getLab, updateLab, deleteLab } from "$lib/server/labs-db";

async function requireAdmin(request, platform) {
	const email = await requireAdminAccess(request, platform?.env);
	if (!email) throw error(401, "Sign-in required");
	return platform.env.LABS_DB;
}

export async function GET({ request, platform, params }) {
	const db = await requireAdmin(request, platform);
	const lab = await getLab(db, params.id);
	if (!lab) throw error(404, "Not found");
	return json(lab);
}

const EDITABLE_FIELDS = ["name", "icon", "subtitle", "description", "tags", "tools", "difficulty", "active", "position"];

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

	const lab = await updateLab(db, params.id, patch);
	if (!lab) throw error(404, "Not found");
	return json(lab);
}

export async function DELETE({ request, platform, params }) {
	const db = await requireAdmin(request, platform);
	if (!isSameOriginRequest(request)) throw error(403, "Forbidden");

	const deleted = await deleteLab(db, params.id);
	if (!deleted) throw error(404, "Not found");
	return json({ ok: true });
}
