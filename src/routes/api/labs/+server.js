// Public read side of the admin-authored labs store (see src/routes/admin).
// No separate auth here, unlike /admin/api/* - this route sits under the
// same roster-entitlement session gate hooks.server.js already applies to
// every other route in this app (it's not in PUBLIC_PATHS), so only a
// student who's already passed that gate can reach it, same trust level
// as every other page. See $stores/tutorials.js for how the result gets
// merged into the labs shown on the site.
import { json } from "@sveltejs/kit";
import { listActiveLabsWithSteps } from "$lib/server/labs-db";

export async function GET({ platform }) {
	const db = platform?.env?.LABS_DB;
	if (!db) return json({ labs: [] });
	const labs = await listActiveLabsWithSteps(db);
	return json({ labs });
}
