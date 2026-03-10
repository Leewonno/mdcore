import { openImageModal } from "./imageModal.js";
import { insertAround, insertLine } from "./shortcuts.js";
import type { MarkdownEditorOptions } from "./types.js";

interface ToolbarButton {
	label: string;
	title: string;
	icon: string;
	action: (textarea: HTMLTextAreaElement) => void;
}

const ICONS = {
	h1: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="17" font-size="14" font-weight="bold" stroke="none" fill="currentColor">H1</text></svg>`,
	h2: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="17" font-size="14" font-weight="bold" stroke="none" fill="currentColor">H2</text></svg>`,
	h3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><text x="2" y="17" font-size="14" font-weight="bold" stroke="none" fill="currentColor">H3</text></svg>`,
	bold: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
	italic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
	code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
	codeblock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
	link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
	image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
	ul: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>`,
	ol: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="2" y="9" font-size="7" stroke="none" fill="currentColor">1.</text><text x="2" y="14" font-size="7" stroke="none" fill="currentColor">2.</text><text x="2" y="19" font-size="7" stroke="none" fill="currentColor">3.</text></svg>`,
	blockquote: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
	hr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
};

function buildButtons(options: MarkdownEditorOptions): ToolbarButton[] {
	return [
		{
			label: "H1",
			title: "제목 1",
			icon: ICONS.h1,
			action: (ta) => insertLine(ta, "# ", "제목"),
		},
		{
			label: "H2",
			title: "제목 2",
			icon: ICONS.h2,
			action: (ta) => insertLine(ta, "## ", "제목"),
		},
		{
			label: "H3",
			title: "제목 3",
			icon: ICONS.h3,
			action: (ta) => insertLine(ta, "### ", "제목"),
		},
		null as unknown as ToolbarButton, // 구분선
		{
			label: "B",
			title: "굵게 (Ctrl+B)",
			icon: ICONS.bold,
			action: (ta) => insertAround(ta, "**", "**"),
		},
		{
			label: "I",
			title: "기울임 (Ctrl+I)",
			icon: ICONS.italic,
			action: (ta) => insertAround(ta, "*", "*"),
		},
		{
			label: "Code",
			title: "인라인 코드",
			icon: ICONS.code,
			action: (ta) => insertAround(ta, "`", "`"),
		},
		{
			label: "CodeBlock",
			title: "코드 블록 (Ctrl+Shift+K)",
			icon: ICONS.codeblock,
			action: (ta) => insertAround(ta, "```\n", "\n```"),
		},
		null as unknown as ToolbarButton, // 구분선
		{
			label: "Link",
			title: "링크 (Ctrl+K)",
			icon: ICONS.link,
			action: (ta) => insertAround(ta, "[", "](url)"),
		},
		{
			label: "Image",
			title: "이미지",
			icon: ICONS.image,
			action: (ta) => {
				openImageModal({
					...(options.uploadImage !== undefined && {
						uploadImage: options.uploadImage,
					}),
					onInsert: (markdown) => {
						const { selectionStart: start, value } = ta;
						const next = value.slice(0, start) + markdown + value.slice(start);
						const nativeSetter = Object.getOwnPropertyDescriptor(
							HTMLTextAreaElement.prototype,
							"value",
						)?.set;
						nativeSetter?.call(ta, next);
						ta.dispatchEvent(new Event("input", { bubbles: true }));
						const cursor = start + markdown.length;
						ta.setSelectionRange(cursor, cursor);
						ta.focus();
					},
				});
			},
		},
		null as unknown as ToolbarButton,
		{
			label: "UL",
			title: "순서 없는 목록",
			icon: ICONS.ul,
			action: (ta) => insertLine(ta, "- ", "항목"),
		},
		{
			label: "OL",
			title: "순서 있는 목록",
			icon: ICONS.ol,
			action: (ta) => insertLine(ta, "1. ", "항목"),
		},
		{
			label: "Quote",
			title: "인용구",
			icon: ICONS.blockquote,
			action: (ta) => insertLine(ta, "> ", "인용문"),
		},
		{
			label: "HR",
			title: "구분선",
			icon: ICONS.hr,
			action: (ta) => {
				const { selectionStart: start, value } = ta;
				const insertion = "\n---\n";
				const next = value.slice(0, start) + insertion + value.slice(start);
				const nativeSetter = Object.getOwnPropertyDescriptor(
					HTMLTextAreaElement.prototype,
					"value",
				)?.set;
				nativeSetter?.call(ta, next);
				ta.dispatchEvent(new Event("input", { bubbles: true }));
				const cursor = start + insertion.length;
				ta.setSelectionRange(cursor, cursor);
				ta.focus();
			},
		},
	];
}

export function createToolbar(
	container: HTMLElement,
	textarea: HTMLTextAreaElement,
	options: MarkdownEditorOptions,
): HTMLElement {
	const toolbar = document.createElement("div");
	toolbar.className = "mdcore-toolbar";

	const buttons = buildButtons(options);

	for (const btn of buttons) {
		if (btn === null) {
			const sep = document.createElement("div");
			sep.className = "mdcore-toolbar-sep";
			toolbar.appendChild(sep);
			continue;
		}

		const el = document.createElement("button");
		el.type = "button";
		el.title = btn.title;
		el.className = "mdcore-toolbar-btn";
		el.innerHTML = btn.icon;
		el.addEventListener("click", (e) => {
			e.preventDefault();
			btn.action(textarea);
			textarea.focus();
		});
		toolbar.appendChild(el);
	}

	container.appendChild(toolbar);
	return toolbar;
}
