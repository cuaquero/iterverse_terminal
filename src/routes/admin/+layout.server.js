// Gates the whole /admin subtree behind a verified Cloudflare Access
// identity - see $lib/server/admin-access.js and hooks.server.js's
// PUBLIC_PATHS (which excludes /admin from the student roster gate this
// app otherwise applies everywhere). Real authentication happens at
// Cloudflare's edge (the Access Application configured per
// wrangler.toml's ACCESS_AUD_ADMIN comment); this is defense-in-depth, not
// the boundary itself - if that Application is ever misconfigured, this
// still fails closed instead of serving admin data to whoever finds the
// URL.
//
// This app has no other server load() (see src/routes/+layout.js's
// comment) - /admin is the one place that genuinely needs one, since the
// check has to happen before any admin markup or data reaches the
// browser, not after like a client-side redirect would.
import { error } from "@sveltejs/kit";
import { requireAdminAccess } from "$lib/server/admin-access";

export async function load({ request, platform }) {
	const email = await requireAdminAccess(request, platform?.env);
	if (!email) throw error(401, "Sign-in required");
	return { email };
}
