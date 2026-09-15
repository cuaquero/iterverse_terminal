<script>
export let data;

async function logout() {
	// Cloudflare Access has no logout redirect param of its own and signs
	// the account out of every Access Application on the team, not just
	// this one - a non-issue today since /admin is the only Access-gated
	// surface here. Same pattern as iterverse_type's AdminPage.
	try {
		await fetch("/cdn-cgi/access/logout", { credentials: "include" });
	} catch {
		// Ignore - redirect regardless so the admin isn't stuck.
	}
	window.location.href = "/";
}
</script>

<svelte:head>
	<title>Labs Admin - Iterverse Terminal</title>
</svelte:head>

<div class="admin-shell">
	<header class="admin-header">
		<div class="admin-brand">
			<svg class="admin-brand-mark" viewBox="0 0 92 92" width="22" height="22" role="img" aria-label="Iterverse">
				<polygon points="30,18 62,18 78,46 62,74 30,74 14,46" fill="none" stroke="#d22030" stroke-width="11" stroke-linejoin="miter" />
				<rect x="41.5" y="31" width="9" height="30" fill="#f7f7f8" />
			</svg>
			<span class="admin-brand-name"><span class="wm-iter">iter</span><span class="wm-verse">verse</span> Terminal</span>
			<span class="admin-brand-divider" aria-hidden="true" />
			<span class="admin-brand-label">Labs Admin</span>
		</div>
		<div class="admin-header-actions">
			{#if data.email}
				<span class="admin-identity">{data.email}</span>
			{/if}
			<button class="admin-link-button" on:click={logout}>Log out</button>
			<a class="admin-link-button" href="/">Exit</a>
		</div>
	</header>

	<main class="admin-main">
		<slot />
	</main>
</div>

<style>
.admin-shell {
	--admin-surface-page: #232526;
	--admin-surface-card: #36393b;
	--admin-surface-subtle: #3a3a3e;
	--admin-text-body: #f7f7f8;
	--admin-text-muted: #8a8a90;
	--admin-border-subtle: rgba(255, 255, 255, 0.12);
	--admin-border-default: rgba(255, 255, 255, 0.24);
	--admin-danger: #e5544c;
	min-height: 100vh;
	background: var(--admin-surface-page);
	color: var(--admin-text-body);
	font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
.admin-header {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 24px;
	border-bottom: 1px solid var(--admin-border-subtle);
}
.admin-brand {
	display: flex;
	align-items: center;
	gap: 8px;
}
.admin-brand-mark {
	flex-shrink: 0;
}
.admin-brand-name {
	font-size: 18px;
	font-weight: 400;
}
.wm-iter {
	font-weight: 700;
	color: #e2495a;
}
.wm-verse {
	font-weight: 300;
	color: var(--admin-text-muted);
}
.admin-brand-divider {
	width: 1px;
	height: 16px;
	background: var(--admin-border-default);
	margin: 0 2px;
}
.admin-brand-label {
	font-size: 13px;
	color: var(--admin-text-muted);
}
.admin-header-actions {
	display: flex;
	align-items: center;
	gap: 16px;
}
.admin-identity {
	font-size: 13px;
	color: var(--admin-text-muted);
}
.admin-link-button {
	background: none;
	border: none;
	padding: 0;
	font-size: 13px;
	font-family: inherit;
	color: #e2495a;
	text-decoration: none;
	cursor: pointer;
}
.admin-link-button:hover {
	color: #f28a92;
}
.admin-main {
	padding: 32px 24px 64px;
	display: flex;
	justify-content: center;
}
</style>
