// Fail-closed gate for /admin (src/routes/admin/**). Verifies the actual
// signed Cf-Access-Jwt-Assertion instead of trusting the edge to have
// already gated the request - defense-in-depth on top of the Access
// Application configured in the Zero Trust dashboard (see wrangler.toml's
// ACCESS_AUD_ADMIN comment), not a replacement for it. Same convention as
// iterverse_type's functions/_utils/require-access.js and ad_labs' admin
// auth, translated to SvelteKit (one +layout.server.js instead of a
// per-directory _middleware.js).
import { verifyAccessJwt } from "./access.js";

export async function requireAdminAccess(request, env) {
	const teamDomain = env?.ACCESS_TEAM_DOMAIN;
	const expectedAud = env?.ACCESS_AUD_ADMIN;
	const jwt = request.headers.get("Cf-Access-Jwt-Assertion");

	if (!teamDomain || !expectedAud || !jwt) return null;
	return verifyAccessJwt(jwt, teamDomain, expectedAud);
}

// Defense-in-depth against CSRF on Access-protected mutation endpoints,
// which otherwise rely solely on the ambient Access session cookie.
// Sec-Fetch-Site is set by the browser itself on every request and cannot
// be overridden by page script or a cross-site form, so it reliably
// distinguishes a same-origin call (the admin dashboard's own JS) from one
// initiated by another site. Requests with no such header (non-browser
// clients, or older browsers that predate Fetch Metadata) are let through,
// since they're not the browser-mediated CSRF threat this guards against.
// Copy-paste-and-keep-in-sync convention across every Iterverse service -
// same helper as iterverse_type's functions/_utils/csrf.js.
export function isSameOriginRequest(request) {
	const site = request.headers.get("Sec-Fetch-Site");
	if (site === null) return true;
	return site === "same-origin" || site === "none";
}
