<script>
import { createEventDispatcher } from "svelte";
import MarkdownPreview from "$components/MarkdownPreview.svelte";

export let draft;
export let isNew = false;

const dispatch = createEventDispatcher();
</script>

<form class="step-form" on:submit|preventDefault={() => dispatch("save")}>
	<div class="field-row">
		<div class="field flex-1">
			<label for="step-name">Step name</label>
			<input id="step-name" type="text" bind:value={draft.name} required />
		</div>
		<div class="field flex-1">
			<label for="step-subtitle">Subtitle</label>
			<input id="step-subtitle" type="text" bind:value={draft.subtitle} />
		</div>
	</div>
	<label class="checkbox">
		<input type="checkbox" bind:checked={draft.header} />
		Starts a new section in the table of contents
	</label>
	<div class="editor-grid">
		<div class="field">
			<label for="step-content">Markdown</label>
			<textarea id="step-content" bind:value={draft.content} rows="14" />
		</div>
		<div class="field">
			<span class="field-label">Preview</span>
			<div class="preview-box">
				<MarkdownPreview content={draft.content} />
			</div>
		</div>
	</div>
	<div class="actions">
		<button class="btn" type="submit" disabled={!draft.name.trim()}>{isNew ? "Add step" : "Save step"}</button>
		<button class="btn btn-ghost" type="button" on:click={() => dispatch("cancel")}>Cancel</button>
	</div>
</form>

<style>
.step-form {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
	background: var(--admin-surface-subtle);
	border: 1px solid var(--admin-border-subtle);
	border-radius: 8px;
	margin-bottom: 12px;
}
.field-row {
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
}
.field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}
.flex-1 {
	flex: 1;
	min-width: 200px;
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
textarea {
	font-family: monospace;
	resize: vertical;
}
.checkbox {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	color: var(--admin-text-body);
}
.editor-grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
}
@media (max-width: 720px) {
	.editor-grid {
		grid-template-columns: 1fr;
	}
}
.preview-box {
	padding: 10px;
	border-radius: 5px;
	border: 1px solid var(--admin-border-default);
	background: var(--admin-surface-page);
	min-height: 200px;
	max-height: 400px;
	overflow-y: auto;
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
.btn-ghost {
	background: transparent;
	border: 1px solid var(--admin-border-default);
	color: var(--admin-text-body);
}
</style>
