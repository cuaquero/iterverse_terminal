import { error, json } from "@sveltejs/kit";
import { requireAdminAccess, isSameOriginRequest } from "$lib/server/admin-access";
import { reorderSteps } from "$lib/server/labs-db";

// Body: { order: [stepId, ...] } - the step ids in their new order.
// Re-numbers every step's position in one batch so a reorder can't leave
// two steps sharing a position if it were done as separate PATCH calls.
export async function POST({ request, platform, params }) {
	const email = await requireAdminAccess(request, platform?.env);
	if (!email) throw error(401, "Sign-in required");
	if (!isSameOriginRequest(request)) throw error(403, "Forbidden");

	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, "Invalid JSON body");
	}

	if (!Array.isArray(body.order) || body.order.some((id) => typeof id !== "string")) {
		throw error(400, "order must be an array of step ids");
	}

	const steps = await reorderSteps(platform.env.LABS_DB, params.id, body.order);
	return json({ steps });
}
