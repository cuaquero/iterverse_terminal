<script>
// Renders one step of an admin-authored lab (src/routes/admin), where the
// step body is Markdown stored in D1 rather than a compiled Svelte
// component like the code-based labs under src/content/ use. See
// $lib/markdown.js for what's supported.
import { onDestroy } from "svelte";
import Execute from "$components/Execute.svelte";
import { renderStepMarkdown } from "$lib/markdown";

export let content = "";

let container;
let mountedExecutes = [];
let previousContent;

// {@html} only ever produces static markup, so every <Execute> tag comes
// through as an inert `[data-execute]` placeholder (see markdown.js) -
// after each render, replace those placeholders with real Execute.svelte
// instances so clicking one still runs the command against $stores/cli,
// same as the code-based labs.
function hydrateExecuteBlocks() {
	if (!container) return;
	container.querySelectorAll("[data-execute]").forEach((el) => {
		let props;
		try {
			props = JSON.parse(decodeURIComponent(el.dataset.execute));
		} catch {
			return;
		}
		mountedExecutes.push(new Execute({ target: el, props }));
	});
}

// Only re-hydrates when `content` actually changes value, not on every
// render this component happens to go through - all steps of a dynamic
// lab share one <svelte:component this={DynamicStep}> instance (see
// Tutorial.svelte), so navigating between steps updates this prop in
// place rather than remounting. Old instances are torn down first since
// the `{@html}` markup below is about to be replaced wholesale, orphaning
// their target elements; the actual (re)hydration is deferred a tick so
// it runs after that markup change has landed in the DOM.
$: if (content !== previousContent) {
	previousContent = content;
	mountedExecutes.forEach((instance) => instance.$destroy());
	mountedExecutes = [];
	Promise.resolve().then(hydrateExecuteBlocks);
}

onDestroy(() => {
	mountedExecutes.forEach((instance) => instance.$destroy());
	mountedExecutes = [];
});
</script>

<div bind:this={container}>
	{@html renderStepMarkdown(content)}
</div>
