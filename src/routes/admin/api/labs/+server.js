// /admin/api/* routes independently re-verify the Access identity (rather
// than trusting src/routes/admin/+layout.server.js's check) since a
// request here doesn't have to come from the admin page itself - same
// reasoning as iterverse_type's functions/admin/api/content-sources.
import { error, json } from "@sveltejs/kit";
import { requireAdminAccess, isSameOriginRequest } from "$lib/server/admin-access";
import { listLabs, createLab } from "$lib/server/labs-db";

async function requireAdmin(request, platform) {
	const email = await requireAdminAccess(request, platform?.env);
	if (!email) throw error(401, "Sign-in required");
	return platform.env.LABS_DB;
}

export async function GET({ request, platform }) {
	const db = await requireAdmin(request, platform);
	const labs = await listLabs(db, { includeInactive: true });
	return json({ labs });
}

export async function POST({ request, platform }) {
	const db = await requireAdmin(request, platform);
	if (!isSameOriginRequest(request)) throw error(403, "Forbidden");

	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, "Invalid JSON body");
	}

	const name = typeof body.name === "string" ? body.name.trim() : "";
	if (!name) throw error(400, "Name is required");

	const existing = await listLabs(db, { includeInactive: true });
	const id = crypto.randomUUID();
	const lab = await createLab(db, {
		id,
		name,
		icon: typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : "terminal",
		subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : "",
		description: typeof body.description === "string" ? body.description.trim() : "",
		tags: Array.isArray(body.tags) ? body.tags : [],
		tools: Array.isArray(body.tools) ? body.tools : [],
		difficulty: Array.isArray(body.difficulty) ? body.difficulty : [],
		position: existing.length
	});

	return json(lab, { status: 201 });
}
