<script>
// Static, non-interactive preview of a step's Markdown - used by the
// admin editor (src/routes/admin/[lab]) while writing a step. The live
// site instead uses $components/DynamicStep.svelte, which mounts a real,
// clickable Execute.svelte; there's no terminal here to run a command
// against, so this just shows what the command will look like.
import { afterUpdate, onMount } from "svelte";
import { renderStepMarkdown, hydrateExecutePreview } from "$lib/markdown";

export let content = "";

let container;

function hydrate() {
	if (!container) return;
	container.querySelectorAll("[data-execute]").forEach((el) => {
		try {
			hydrateExecutePreview(el, JSON.parse(decodeURIComponent(el.dataset.execute)));
		} catch {
			// Ignore a malformed placeholder rather than break the whole preview.
		}
	});
}

$: html = renderStepMarkdown(content);

onMount(hydrate);
afterUpdate(hydrate);
</script>

<div class="markdown-preview" bind:this={container}>
	{@html html}
</div>

<style>
.markdown-preview {
	font-size: 14px;
	line-height: 1.6;
}
.markdown-preview :global(.markdown-preview-execute-block) {
	display: block;
	margin-bottom: 12px;
	padding: 10px 14px;
	border-radius: 6px;
	background: #212529;
	color: #f7f7f8;
	font-family: monospace;
	font-size: 0.875em;
	cursor: default;
}
.markdown-preview :global(.markdown-preview-execute-inline) {
	display: inline-block;
	padding: 2px 6px;
	border-radius: 4px;
	background: #212529;
	color: #f7f7f8;
	font-family: monospace;
	font-size: 0.875em;
}
.markdown-preview :global(.alert) {
	padding: 10px 14px;
	border-radius: 6px;
	background: rgba(13, 110, 253, 0.15);
	border: 1px solid rgba(13, 110, 253, 0.35);
}
</style>
