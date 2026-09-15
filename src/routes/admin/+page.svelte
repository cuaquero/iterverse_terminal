<script>
import { onMount } from "svelte";
import { fetchLabs, createLab, updateLab, deleteLab } from "$lib/admin-labs-client";

let labs = null; // null = still loading
let error = null;
let showNewForm = false;
let newName = "";
let creating = false;

const refresh = () => fetchLabs().then((res) => (labs = res.labs));

onMount(refresh);

async function handleCreate(e) {
	e.preventDefault();
	if (!newName.trim()) return;
	creating = true;
	error = null;
	try {
		await createLab({ name: newName.trim() });
		newName = "";
		showNewForm = false;
		await refresh();
	} catch (err) {
		error = err.message;
	} finally {
		creating = false;
	}
}

async function toggleActive(lab) {
	error = null;
	try {
		await updateLab(lab.id, { active: !lab.active });
		await refresh();
	} catch (err) {
		error = err.message;
	}
}

async function handleDelete(lab) {
	if (!confirm(`Delete "${lab.name}"? This also deletes all of its steps and can't be undone.`)) return;
	error = null;
	try {
		await deleteLab(lab.id);
		await refresh();
	} catch (err) {
		error = err.message;
	}
}
</script>

<div class="wrap">
	<div class="header-row">
		<div>
			<h1>Labs</h1>
			<p class="muted">
				{#if labs}{labs.length} lab{labs.length === 1 ? "" : "s"} - changes apply on the site immediately, no deploy needed.{/if}
			</p>
		</div>
		<button class="btn" on:click={() => (showNewForm = !showNewForm)}>+ New Lab</button>
	</div>

	{#if error}
		<div class="banner banner-error">{error}</div>
	{/if}

	{#if showNewForm}
		<form class="card form" on:submit={handleCreate}>
			<label for="new-lab-name">Name</label>
			<input id="new-lab-name" type="text" bind:value={newName} placeholder="e.g. Intro to grep" autocomplete="off" />
			<div class="actions">
				<button class="btn" type="submit" disabled={creating || !newName.trim()}>Create</button>
				<button class="btn btn-ghost" type="button" on:click={() => (showNewForm = false)}>Cancel</button>
			</div>
		</form>
	{/if}

	{#if labs == null}
		<p class="muted">Loading labs…</p>
	{:else if labs.length === 0}
		<p class="muted">No labs yet - use "+ New Lab" to create one.</p>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>Steps</th>
						<th>Status</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each labs as lab (lab.id)}
						<tr class:archived={!lab.active}>
							<td>
								<a class="lab-link" href="/admin/{lab.id}">{lab.name}</a>
							</td>
							<td>{lab.stepCount ?? 0}</td>
							<td>{lab.active ? "Active" : "Archived"}</td>
							<td class="row-actions">
								<a class="btn-small" href="/admin/{lab.id}">Edit</a>
								<button class="btn-small" on:click={() => toggleActive(lab)}>
									{lab.active ? "Archive" : "Unarchive"}
								</button>
								{#if !lab.active}
									<button class="btn-small btn-danger" on:click={() => handleDelete(lab)}>Delete</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
.wrap {
	width: min(100%, 860px);
	display: flex;
	flex-direction: column;
	gap: 20px;
}
.header-row {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
}
h1 {
	font-size: 22px;
	font-weight: 700;
	margin: 0;
}
.muted {
	color: var(--admin-text-muted);
	font-size: 13px;
	margin: 4px 0 0;
}
.banner {
	padding: 10px 14px;
	border-radius: 6px;
	font-size: 13px;
}
.banner-error {
	background: rgba(229, 84, 76, 0.15);
	border: 1px solid var(--admin-danger);
	color: #ffb4af;
}
.card {
	background: var(--admin-surface-card);
	border: 1px solid var(--admin-border-subtle);
	border-radius: 8px;
	padding: 16px;
}
.form {
	display: flex;
	flex-direction: column;
	gap: 8px;
}
.form label {
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: var(--admin-text-muted);
}
.form input {
	padding: 8px 10px;
	border-radius: 5px;
	border: 1px solid var(--admin-border-default);
	background: var(--admin-surface-page);
	color: var(--admin-text-body);
	font-size: 14px;
}
.actions {
	display: flex;
	gap: 10px;
	margin-top: 4px;
}
.table-wrap {
	overflow-x: auto;
}
table {
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;
}
th {
	text-align: left;
	font-size: 11px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: var(--admin-text-muted);
	padding: 8px 10px;
	border-bottom: 1px solid var(--admin-border-subtle);
}
td {
	padding: 10px;
	border-bottom: 1px solid var(--admin-border-subtle);
	vertical-align: middle;
}
tr.archived {
	opacity: 0.6;
}
.lab-link {
	color: var(--admin-text-body);
	text-decoration: none;
	font-weight: 500;
}
.lab-link:hover {
	color: #e2495a;
}
.row-actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
	white-space: nowrap;
}
.btn {
	padding: 8px 16px;
	border-radius: 6px;
	border: none;
	background: #d22030;
	color: white;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
}
.btn:hover {
	background: #a81826;
}
.btn:disabled {
	opacity: 0.5;
	cursor: not-allowed;
}
.btn-ghost {
	background: transparent;
	border: 1px solid var(--admin-border-default);
	color: var(--admin-text-body);
}
.btn-small {
	padding: 4px 10px;
	font-size: 12px;
	border-radius: 5px;
	border: 1px solid var(--admin-border-default);
	background: transparent;
	color: var(--admin-text-body);
	cursor: pointer;
	text-decoration: none;
}
.btn-small:hover {
	background: var(--admin-surface-subtle);
}
.btn-danger {
	border-color: var(--admin-danger);
	color: #ffb4af;
}
</style>
