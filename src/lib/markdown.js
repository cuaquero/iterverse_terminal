// Renders the Markdown behind an admin-authored lab step (src/routes/admin)
// at runtime, in place of the compile-time `svelte-preprocess-markdown`
// pipeline the code-based labs under src/content/ use (their .md files
// become real Svelte components at build time - not possible here, since
// this content is edited live in D1, not committed to the repo).
//
// Supports the same <Alert>/<Execute>/<Link> tags authors already use in
// src/content/*/steps/*.md (see $components/Execute.svelte, Alert.svelte,
// Link.svelte), lifted from src/routes/studio/+page.svelte's own marked
// setup. <Quiz>/<Image>/<Exercise> aren't supported yet - those need more
// than a markdown tag (exercise-checking logic tied to the terminal's
// state) and are out of scope for a first pass; an admin-authored lab
// sticks to instructions + runnable commands for now.
//
// <Execute> is the one tag that needs real interactivity (clicking it
// runs the command against $stores/cli), which {@html}'d static markup
// can't provide - see $components/DynamicStep.svelte, which renders this
// module's HTML then hydrates every `[data-execute]` placeholder into a
// real Execute.svelte instance.
import * as marked from "marked";

const renderer = {
	link(href, title, text) {
		return `<a href="${href}" target="_blank" rel="noreferrer">${text}</a>`;
	}
};

const tagAlert = {
	name: "alert",
	level: "block",
	start(src) {
		return src.match(/^<Alert>/)?.index;
	},
	tokenizer(src) {
		const rule = /^<Alert>\n*([\s\S]*?)\n*<\/Alert>/;
		const match = rule.exec(src);
		if (match) {
			const token = { type: "alert", raw: match[0], text: match[1].trim(), tokens: [] };
			this.lexer.inline(token.text, token.tokens);
			return token;
		}
	},
	renderer(token) {
		return `
			<div class="alert alert-primary" role="alert">
				${this.parser.parseInline(token.tokens)}
			</div>
		`;
	}
};

const tagExecute = {
	name: "execute",
	level: "block",
	start(src) {
		return src.match(/^<Execute/)?.index;
	},
	tokenizer(src) {
		const rule = /^<Execute command="(.+?)"( inline)?\s*\/>/;
		const match = rule.exec(src);
		if (match) {
			return { type: "execute", raw: match[0], command: match[1], inline: !!match[2] };
		}
	},
	renderer(token) {
		// A placeholder, not the real interactive component - marked only
		// produces an HTML string. DynamicStep.svelte mounts a real
		// Execute.svelte instance into this element after the HTML lands in
		// the DOM (see this file's header comment).
		const payload = encodeURIComponent(JSON.stringify({ command: token.command, inline: token.inline }));
		return `<span class="dynamic-execute" data-execute="${payload}"></span>`;
	}
};

marked.use({ renderer, extensions: [tagAlert, tagExecute] });

// <Link href="...">text</Link> is inline (appears mid-sentence in real
// step content), unlike Alert/Execute's own block-level tags above - not
// worth a custom inline marked extension for one tag, so it's rewritten
// into a plain Markdown link first. `renderer.link` above already opens
// it in a new tab, matching $components/Link.svelte's behavior.
function rewriteLinkTags(src) {
	return src.replace(/<Link href="([^"]*)">([\s\S]*?)<\/Link>/g, "[$2]($1)");
}

export function renderStepMarkdown(content) {
	return marked.parse(rewriteLinkTags(content || ""));
}

// Fills in an `[data-execute]` placeholder with plain, non-interactive
// markup that looks like $components/Execute.svelte without needing a
// real instance of it - used by the admin editor's live preview
// (src/routes/admin/[lab]), which has no $stores/cli terminal mounted to
// actually run a command against. The real, clickable rendering (used on
// the live site) is $components/DynamicStep.svelte, which mounts a real
// Execute.svelte instead of calling this.
export function hydrateExecutePreview(el, { command, inline }) {
	el.classList.add(inline ? "markdown-preview-execute-inline" : "markdown-preview-execute-block");
	el.innerHTML = command.replace(/ \\ /g, " \\ <br />&nbsp;&nbsp;&nbsp;");
}
