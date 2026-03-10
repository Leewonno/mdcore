import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { parse } from "../../parser/index.js";
import type {
	BlockContent,
	Emphasis,
	Heading,
	Image,
	Link,
	List,
	ListItem,
	ParserPlugin,
	PhrasingContent,
	Root,
	Strong,
	Table,
} from "../../parser/types.js";

// ─── 기본 위험 URL 스킴 ───────────────────────────────────────────────────────

const BLOCKED_SCHEMES = ["javascript:", "data:", "vbscript:"];

function isSafeUrl(
	url: string,
	userFilter?: (url: string) => boolean,
): boolean {
	const lower = url.trim().toLowerCase();
	const blockedByDefault = BLOCKED_SCHEMES.some((scheme) =>
		lower.startsWith(scheme),
	);
	if (blockedByDefault) return false;
	if (userFilter) return userFilter(url);
	return true;
}

function safeUrl(url: string, userFilter?: (url: string) => boolean): string {
	return isSafeUrl(url, userFilter) ? url : "#";
}

// ─── AST → HTML 문자열 변환 ────────────────────────────────────────────────────

function renderInline(
	nodes: PhrasingContent[],
	urlFilter?: (url: string) => boolean,
): string {
	return nodes
		.map((node) => {
			switch (node.type) {
				case "text":
					return escapeHtml(node.value);
				case "strong":
					return `<strong>${renderInline((node as Strong).children, urlFilter)}</strong>`;
				case "emphasis":
					return `<em>${renderInline((node as Emphasis).children, urlFilter)}</em>`;
				case "inlineCode":
					return `<code>${escapeHtml(node.value)}</code>`;
				case "link": {
					const link = node as Link;
					const href = safeUrl(link.url, urlFilter);
					const title = link.title ? ` title="${escapeAttr(link.title)}"` : "";
					return `<a href="${escapeAttr(href)}"${title} target="_blank" rel="noopener noreferrer">${renderInline(link.children, urlFilter)}</a>`;
				}
				case "image": {
					const img = node as Image;
					const src = safeUrl(img.url, urlFilter);
					const title = img.title ? ` title="${escapeAttr(img.title)}"` : "";
					return `<img src="${escapeAttr(src)}" alt="${escapeAttr(img.alt)}"${title} />`;
				}
				case "html":
					return node.value;
				default:
					return "";
			}
		})
		.join("");
}

function renderBlock(
	node: BlockContent,
	urlFilter?: (url: string) => boolean,
): string {
	switch (node.type) {
		case "paragraph":
			return `<p>${renderInline(node.children, urlFilter)}</p>`;

		case "heading": {
			const h = node as Heading;
			const text = h.children
				.map((n) => (n.type === "text" ? n.value : ""))
				.join("");
			return `<h${h.depth} id="${text}">${renderInline(h.children, urlFilter)}</h${h.depth}>`;
		}

		case "code": {
			if (node.lang && hljs.getLanguage(node.lang)) {
				const highlighted = hljs.highlight(node.value, {
					language: node.lang,
					ignoreIllegals: true,
				});
				return `<pre><code class="hljs language-${escapeAttr(node.lang)}">${highlighted.value}</code></pre>`;
			}
			return `<pre><code>${escapeHtml(node.value)}</code></pre>`;
		}

		case "blockquote":
			return `<blockquote>${renderBlocks(node.children, urlFilter)}</blockquote>`;

		case "list": {
			const list = node as List;
			const tag = list.ordered ? "ol" : "ul";
			const start =
				list.ordered && list.start !== null && list.start !== 1
					? ` start="${list.start}"`
					: "";
			const items = list.children
				.map((item: ListItem) => {
					const checkbox =
						item.checked !== null
							? `<input type="checkbox" disabled${item.checked ? " checked" : ""} /> `
							: "";
					const content = item.children
						.map((child) =>
							child.type === "paragraph"
								? renderInline(child.children, urlFilter)
								: renderBlock(child, urlFilter),
						)
						.join("");
					return `<li>${checkbox}${content}</li>`;
				})
				.join("");
			return `<${tag}${start}>${items}</${tag}>`;
		}

		case "thematicBreak":
			return "<hr />";

		case "table": {
			const table = node as Table;
			const [headerRow, ...bodyRows] = table.children;
			const thead = headerRow
				? `<thead><tr>${headerRow.children
						.map((cell, idx) => {
							const align = table.align[idx];
							const style = align ? ` style="text-align:${align}"` : "";
							return `<th${style}>${renderInline(cell.children, urlFilter)}</th>`;
						})
						.join("")}</tr></thead>`
				: "";
			const tbody =
				bodyRows.length > 0
					? `<tbody>${bodyRows
							.map(
								(row) =>
									`<tr>${row.children
										.map((cell, idx) => {
											const align = table.align[idx];
											const style = align ? ` style="text-align:${align}"` : "";
											return `<td${style}>${renderInline(cell.children, urlFilter)}</td>`;
										})
										.join("")}</tr>`,
							)
							.join("")}</tbody>`
					: "";
			return `<table>${thead}${tbody}</table>`;
		}

		case "html":
			return node.value;

		default:
			return "";
	}
}

function renderBlocks(
	nodes: BlockContent[],
	urlFilter?: (url: string) => boolean,
): string {
	return nodes.map((node) => renderBlock(node, urlFilter)).join("\n");
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function escapeAttr(str: string): string {
	return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// ─── Viewer 클래스 ─────────────────────────────────────────────────────────────

export class Viewer {
	private container: HTMLElement;
	private plugins: ParserPlugin[];
	private urlFilter?: (url: string) => boolean;

	constructor(
		container: HTMLElement,
		plugins: ParserPlugin[] = [],
		urlFilter?: (url: string) => boolean,
	) {
		this.container = container;
		this.plugins = plugins;
		this.urlFilter = urlFilter;
		this.container.classList.add("mdcore-viewer", "markdown-body");
	}

	render(markdown: string): void {
		const ast: Root = parse(markdown, this.plugins);
		const rawHtml = renderBlocks(ast.children, this.urlFilter);
		const clean = DOMPurify.sanitize(rawHtml, {
			USE_PROFILES: { html: true },
			ADD_ATTR: ["target", "rel"],
			FORBID_TAGS: ["script", "style"],
			FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
		});
		this.container.innerHTML = clean;
	}

	destroy(): void {
		this.container.innerHTML = "";
		this.container.classList.remove("mdcore-viewer", "markdown-body");
	}
}
