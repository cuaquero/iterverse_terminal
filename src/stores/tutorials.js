import { readable, writable, derived } from "svelte/store";
import { config as _template } from "$content/_template/config.js";
import { config as terminalBasics } from "$content/terminal-basics/config.js";
import { config as terminalExercises } from "$content/carpentries-shell-novice/config.js";
import { config as playground } from "$content/playground/config.js";
import DynamicStep from "$components/DynamicStep.svelte";

const staticTutorials = [playground, terminalBasics, terminalExercises, _template];

// Labs shown on the home page, in order. Add new code-based labs here.
const staticLabs = [terminalBasics, terminalExercises];

// Labs authored through /admin (src/routes/admin), fetched from D1 at
// runtime instead of imported at build time - see src/routes/api/labs.
// Starts empty so the site still works before the fetch resolves (or if
// it fails); populated by loadDynamicLabs, called once from
// src/routes/+layout.svelte's onMount (the /tutorials route tree renders
// with ssr=false, so a client-side fetch is the only option here).
const dynamicLabs = writable([]);

export async function loadDynamicLabs(fetchFn = fetch) {
	try {
		const res = await fetchFn("/api/labs");
		if (!res.ok) return;
		const { labs: fetched } = await res.json();
		dynamicLabs.set(
			(fetched || []).map((lab) => ({
				...lab,
				steps: lab.steps.map((step) => ({ ...step, component: DynamicStep, props: { content: step.content } }))
			}))
		);
	} catch {
		// Ignore - the site still works with just the code-based labs below.
	}
}

// All tutorials the router can resolve
export const tutorials = derived(dynamicLabs, ($dynamicLabs) => [...staticTutorials, ...$dynamicLabs]);

// Labs shown on the home page, in order.
export const labs = derived(dynamicLabs, ($dynamicLabs) => [...staticLabs, ...$dynamicLabs]);

// Tool playgrounds (delete this export if you removed /src/routes/playgrounds)
export const playgrounds = readable([
	{
		name: "Awk",
		description: "Filter and wrangle tabular data",
		url: "/playgrounds/awk",
		tags: ["awk"]
	},
	{
		name: "Jq",
		description: "Filter and wrangle JSON data",
		url: "/playgrounds/jq",
		tags: ["jq", "json"]
	},
	{
		name: "Grep",
		description: "Search and filter utility",
		url: "/playgrounds/grep",
		tags: ["grep", "regex"]
	},
	{
		name: "Sed",
		description: "Search and replace utility",
		url: "/playgrounds/sed",
		tags: ["sed", "regex"]
	}
]);
