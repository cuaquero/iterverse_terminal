import { error, json } from "@sveltejs/kit";
import { requireAdminAccess, isSameOriginRequest } from "$lib/server/admin-access";
import { getLab, createStep } from "$lib/server/labs-db";

async function requireAdmin(request, platform) {
	const email = await requireAdminAccess(request, platform?.env);
	if (!email) throw error(401, "Sign-in required");
	return platform.env.LABS_DB;
}

// Appends a new step at the end of the lab - reordering happens
// separately via POST /admin/api/labs/[id]/steps/reorder.
export async function POST({ request, platform, params }) {
	const db = await requireAdmin(request, platform);
	if (!isSameOriginRequest(request)) throw error(403, "Forbidden");

	const lab = await getLab(db, params.id);
	if (!lab) throw error(404, "Lab not found");

	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, "Invalid JSON body");
	}

	const name = typeof body.name === "string" ? body.name.trim() : "";
	if (!name) throw error(400, "Name is required");

	const step = await createStep(db, {
		id: crypto.randomUUID(),
		labId: params.id,
		position: lab.steps.length,
		name,
		subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : "",
		header: !!body.header,
		content: typeof body.content === "string" ? body.content : ""
	});

	return json(step, { status: 201 });
}
