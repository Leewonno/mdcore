// 인라인 파싱 규칙 (우선순위 순서대로 처리)

import type {
	Emphasis,
	Html,
	Image,
	InlineCode,
	InlinePluginResult,
	Link,
	ParserPlugin,
	PhrasingContent,
	Strong,
	Text,
} from "./types.js";

const ESCAPE_RE = /^\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/;
const CODE_SPAN_RE = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
const IMAGE_RE = /^!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/;
const LINK_RE = /^\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)/;
const STRONG_RE = /^(\*\*|__)(?!\s)([\s\S]*?)(?<!\s)\1/;
const EMPHASIS_RE = /^(\*|_)(?!\s)([\s\S]*?)(?<!\s)\1/;
const INLINE_HTML_RE = /^<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?\/?>/;

export function parseInlineTokens(
	src: string,
	plugins: ParserPlugin[],
): PhrasingContent[] {
	const tokens: PhrasingContent[] = [];
	let remaining = src;

	while (remaining.length > 0) {
		// 플러그인 인라인 훅 먼저
		let pluginMatched = false;
		for (const plugin of plugins) {
			if (!plugin.inline) continue;
			const result: InlinePluginResult | null = plugin.inline(remaining);
			if (result) {
				tokens.push(result.node);
				remaining = remaining.slice(result.length);
				pluginMatched = true;
				break;
			}
		}
		if (pluginMatched) continue;

		// 1. Escape
		let m = ESCAPE_RE.exec(remaining);
		if (m) {
			tokens.push({ type: "text", value: m[1] ?? "" } satisfies Text);
			remaining = remaining.slice(m[0].length);
			continue;
		}

		// 2. Code span
		m = CODE_SPAN_RE.exec(remaining);
		if (m) {
			tokens.push({
				type: "inlineCode",
				value: (m[2] ?? "").trim(),
			} satisfies InlineCode);
			remaining = remaining.slice(m[0].length);
			continue;
		}

		// 3. Image (링크보다 먼저 처리)
		m = IMAGE_RE.exec(remaining);
		if (m) {
			tokens.push({
				type: "image",
				alt: m[1] ?? "",
				url: (m[2] ?? "").trim(),
				title: m[3] ?? null,
			} satisfies Image);
			remaining = remaining.slice(m[0].length);
			continue;
		}

		// 4. Link
		m = LINK_RE.exec(remaining);
		if (m) {
			const link: Link = {
				type: "link",
				url: (m[2] ?? "").trim(),
				title: m[3] ?? null,
				children: parseInlineTokens(m[1] ?? "", plugins),
			};
			tokens.push(link);
			remaining = remaining.slice(m[0].length);
			continue;
		}

		// 5. Strong
		m = STRONG_RE.exec(remaining);
		if (m) {
			const strong: Strong = {
				type: "strong",
				children: parseInlineTokens(m[2] ?? "", plugins),
			};
			tokens.push(strong);
			remaining = remaining.slice(m[0].length);
			continue;
		}

		// 6. Emphasis
		m = EMPHASIS_RE.exec(remaining);
		if (m) {
			const emphasis: Emphasis = {
				type: "emphasis",
				children: parseInlineTokens(m[2] ?? "", plugins),
			};
			tokens.push(emphasis);
			remaining = remaining.slice(m[0].length);
			continue;
		}

		// 7. Inline HTML
		m = INLINE_HTML_RE.exec(remaining);
		if (m) {
			tokens.push({ type: "html", value: m[0] } satisfies Html);
			remaining = remaining.slice(m[0].length);
			continue;
		}

		// 8. Plain text — 다음 특수 문자 직전까지
		const nextSpecial = remaining.slice(1).search(/[\\`*_![]/);
		const end = nextSpecial === -1 ? remaining.length : nextSpecial + 1;
		const textValue = remaining.slice(0, end);

		const last = tokens[tokens.length - 1];
		if (last?.type === "text") {
			(last as Text).value += textValue;
		} else {
			tokens.push({ type: "text", value: textValue } satisfies Text);
		}
		remaining = remaining.slice(end);
	}

	return tokens;
}
