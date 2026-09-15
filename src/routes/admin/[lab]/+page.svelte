<script>
import { onMount } from "svelte";
import { page } from "$app/stores";
import StepForm from "./StepForm.svelte";
import {
	fetchLab,
	updateLab,
	createStep,
	updateStep,
	deleteStep,
	reorderSteps
} from "$lib/admin-labs-client";

const DIFFICULTIES = ["beginner", "intermediate", "difficult"];
const emptyStepDraft = { name: "", subtitle: "", header: false, content: "" };

let lab = null; // null = still loading
let error = null;
let saving = false;

// Lab metadata form state - populated from `lab` once loaded, kept
// separate so edits don't leak into the read view until Save is clicked.
let meta = null;

let editingStepId = null; // a step's id, or "new"
let stepDraft = emptyStepDraft;

const labId = $page.params.lab;

async function refresh() {
	lab = await fetchLab(labId);
	meta = {
		name: lab.name,
		icon: lab.icon,
		subtitle: lab.subtitle,
		description: lab.description,
		tags: lab.tags.join(", "),
		tools: lab.tools.join(", "),
		difficulty: [...lab.difficulty]
	};
}

onMount(() => {
	refresh().catch((err) => (error = err.message));
});

function splitList(value) {
	return value
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

async function saveMeta(e) {
	e.preventDefault();
	saving = true;
	error = null;
	try {
		await updateLab(labId, {
			name: meta.name.trim(),
			icon: meta.icon.trim() || "terminal",
			subtitle: meta.subtitle.trim(),
			description: meta.description.trim(),
			tags: splitList(meta.tags),
			tools: splitList(meta.tools),
			difficulty: meta.difficulty
		});
		await refresh();
	} catch (err) {
		error = err.message;
	} finally {
		saving = false;
	}
}

function toggleDifficulty(tag) {
	meta.difficulty = meta.difficulty.includes(tag)
		? meta.difficulty.filter((t) => t !== tag)
		: [...meta.difficulty, tag];
}

function startEditStep(step) {
	editingStepId = step.id;
	stepDraft = { name: step.name, subtitle: step.subtitle, header: step.header, content: step.content };
}

function startNewStep() {
	editingStepId = "new";
	stepDraft = { ...emptyStepDraft };
}

function cancelStepEdit() {
	editingStepId = null;
	stepDraft = emptyStepDraft;
}

async function saveStep() {
	if (!stepDraft.name.trim()) return;
	error = null;
	try {
		if (editingStepId === "new") {
			await createStep(labId, stepDraft);
		} else {
			await updateStep(labId, editingStepId, stepDraft);
		}
		cancelStepEdit();
		await refresh();
	} catch (err) {
		error = err.message;
	}
}

async function handleDeleteStep(step) {
	if (!confirm(`Delete step "${step.name}"?`)) return;
	error = null;
	try {
		await deleteStep(labId, step.id);
		await refresh();
	} catch (err) {
		error = err.message;
	}
}

async function moveStep(step, direction) {
	const order = lab.steps.map((s) => s.id);
	const index = order.indexOf(step.id);
	const swapWith = index + direction;
	if (swapWith < 0 || swapWith >= order.length) return;
	[order[index], order[swapWith]] = [order[swapWith], order[index]];
	error = null;
	try {
		await reorderSteps(labId, order);
		await refresh();
	} catch (err) {
		error = err.message;
	}
}
</script>

<div class="wrap">
	<a class="back-link" href="/admin">&larr; All labs</a>

	{#if error}
		<div class="banner banner-error">{error}</div>
	{/if}

	{#if lab == null}
		<p class="muted">Loading lab…</p>
	{:else}
		<section class="card">
			<h1>{lab.name}</h1>
			<form class="form" on:submit={saveMeta}>
				<div class="field">
					<label for="meta-name">Name</label>
					<input id="meta-name" type="text" bind:value={meta.name} required />
				</div>
				<div class="field-row">
					<div class="field">
						<label for="meta-icon">Icon</label>
						<input id="meta-icon" type="text" bind:value={meta.icon} placeholder="terminal" />
					</div>
					<div class="field flex-1">
						<label for="meta-subtitle">Subtitle (HTML allowed, e.g. author credit)</label>
						<input id="meta-subtitle" type="text" bind:value={meta.subtitle} />
					</div>
				</div>
				<div class="field">
					<label for="meta-description">Description</label>
					<textarea id="meta-description" bind:value={meta.description} rows="2" />
				</div>
				<div class="field-row">
					<div class="field flex-1">
						<label for="meta-tags">Tags (comma-separated)</label>
						<input id="meta-tags" type="text" bind:value={meta.tags} placeholder="terminal, grep" />
					</div>
					<div class="field flex-1">
						<label for="meta-tools">Tools (comma-separated)</label>
						<input id="meta-tools" type="text" bind:value={meta.tools} placeholder="grep, awk" />
					</div>
				</div>
				<div class="field">
					<span class="field-label">Difficulty</span>
					<div class="checkbox-row">
						{#each DIFFICULTIES as tag}
							<label class="checkbox">
								<input type="checkbox" checked={meta.difficulty.includes(tag)} on:change={() => toggleDifficulty(tag)} />
								{tag}
							</label>
						{/each}
					</div>
				</div>
				<div class="actions">
					<button class="btn" type="submit" disabled={saving || !meta.name.trim()}>Save</button>
				</div>
			</form>
		</section>

		<section class="card">
			<div class="header-row">
				<h2>Steps</h2>
				<button class="btn" on:click={startNewStep}>+ Add step</button>
			</div>

			{#if editingStepId === "new"}
				<StepForm bind:draft={stepDraft} isNew on:save={saveStep} on:cancel={cancelStepEdit} />
			{/if}

			<div class="steps-list">
				{#each lab.steps as step, i (step.id)}
					{#if editingStepId === step.id}
						<StepForm bind:draft={stepDraft} on:save={saveStep} on:cancel={cancelStepEdit} />
					{:else}
						<div class="step-row">
							<div class="step-info">
								{#if step.header}<span class="badge">Section header</span>{/if}
								<span class="step-name">{step.name}</span>
								{#if step.subtitle}<span class="step-subtitle">{step.subtitle}</span>{/if}
							</div>
							<div class="row-actions">
								<button class="btn-small" on:click={() => moveStep(step, -1)} disabled={i === 0}>↑</button>
								<button class="btn-small" on:click={() => moveStep(step, 1)} disabled={i === lab.steps.length - 1}>↓</button>
								<button class="btn-small" on:click={() => startEditStep(step)}>Edit</button>
								<button class="btn-small btn-danger" on:click={() => handleDeleteStep(step)}>Delete</button>
							</div>
						</div>
					{/if}
				{/each}
				{#if lab.steps.length === 0}
					<p class="muted">No steps yet - use "+ Add step" to write the first one.</p>
				{/if}
			</div>
		</section>
	{/if}
</div>

<style>
.wrap {
	width: min(100%, 920px);
	display: flex;
	flex-direction: column;
	gap: 20px;
}
.back-link {
	font-size: 13px;
	color: var(--admin-text-muted);
	text-decoration: none;
}
.back-link:hover {
	color: var(--admin-text-body);
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
.muted {
	color: var(--admin-text-muted);
	font-size: 13px;
}
.card {
	background: var(--admin-surface-card);
	border: 1px solid var(--admin-border-subtle);
	border-radius: 8px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;
}
h1 {
	font-size: 20px;
	font-weight: 700;
	margin: 0;
}
h2 {
	font-size: 16px;
	font-weight: 700;
	margin: 0;
}
.header-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.form {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
.field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.field-row {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}
.flex-1 {
	flex: 1;
	min-width: 220px;
}
.field label,
.field-label {
	font-size: 12px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	color: var(--admin-text-muted);
}
input[type="text"],
textarea {
	padding: 8px 10px;
	border-radius: 5px;
	border: 1px solid var(--admin-border-default);
	background: var(--admin-surface-page);
	color: var(--admin-text-body);
	font-size: 14px;
	font-family: inherit;
}
.checkbox-row {
	display: flex;
	gap: 16px;
}
.checkbox {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	text-transform: none;
	letter-spacing: normal;
	color: var(--admin-text-body);
}
.actions {
	display: flex;
	gap: 10px;
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
.step-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 12px;
	background: var(--admin-surface-subtle);
	border: 1px solid var(--admin-border-subtle);
	border-radius: 6px;
	margin-bottom: 8px;
}
.step-info {
	display: flex;
	align-items: baseline;
	gap: 8px;
	flex-wrap: wrap;
}
.step-name {
	font-weight: 500;
}
.step-subtitle {
	font-size: 12px;
	color: var(--admin-text-muted);
}
.badge {
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	padding: 2px 6px;
	border-radius: 4px;
	background: rgba(210, 32, 48, 0.2);
	color: #ff8a95;
}
.row-actions {
	display: flex;
	gap: 6px;
	flex-shrink: 0;
}
.btn-small {
	padding: 4px 9px;
	font-size: 12px;
	border-radius: 5px;
	border: 1px solid var(--admin-border-default);
	background: transparent;
	color: var(--admin-text-body);
	cursor: pointer;
}
.btn-small:hover {
	background: var(--admin-surface-page);
}
.btn-small:disabled {
	opacity: 0.35;
	cursor: not-allowed;
}
.btn-danger {
	border-color: var(--admin-danger);
	color: #ffb4af;
}
</style>
