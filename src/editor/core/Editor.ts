import { registerShortcuts } from "./shortcuts.js";
import { createToolbar } from "./Toolbar.js";
import type { MarkdownEditorOptions } from "./types.js";
import { Viewer } from "./Viewer.js";
import "./styles/editor.css";

function debounce<T extends unknown[]>(
	fn: (...args: T) => void,
	delay: number,
): (...args: T) => void {
	let timer: ReturnType<typeof setTimeout>;
	return (...args: T) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}

export class MarkdownEditor {
	private root: HTMLElement;
	private textarea: HTMLTextAreaElement;
	private viewer: Viewer;
	private cleanupShortcuts: () => void;
	private options: MarkdownEditorOptions;

	constructor(container: HTMLElement, options: MarkdownEditorOptions = {}) {
		this.options = options;
		this.root = container;
		this.root.classList.add("mdcore-editor");

		// ─── Textarea ─────────────────────────────────────────────────────────────
		const textarea = document.createElement("textarea");
		textarea.className = "mdcore-textarea";
		textarea.placeholder = options.placeholder ?? "내용을 입력하세요.";
		textarea.value = options.value ?? "";
		this.textarea = textarea;

		// ─── 툴바 ─────────────────────────────────────────────────────────────────
		createToolbar(this.root, textarea, options);

		// ─── 에디터 영역 ──────────────────────────────────────────────────────────
		const editorArea = document.createElement("div");
		editorArea.className = "mdcore-editor-area";
		editorArea.style.height = `${options.height ?? 400}px`;

		// ─── 미리보기 컨테이너 ────────────────────────────────────────────────────
		const previewContainer = document.createElement("div");
		previewContainer.className = "mdcore-preview";

		this.viewer = new Viewer(
			previewContainer,
			options.plugins ?? [],
			options.urlFilter,
		);

		// 초기 렌더링
		this.viewer.render(textarea.value);

		// ─── 입력 이벤트 (100ms debounce) ────────────────────────────────────────
		const debouncedRender = debounce((value: string) => {
			this.viewer.render(value);
		}, 100);

		textarea.addEventListener("input", () => {
			options.onChange?.(textarea.value);
			debouncedRender(textarea.value);
		});

		// ─── 스크롤 동기화 ────────────────────────────────────────────────────────
		textarea.addEventListener("scroll", () => {
			const scrollRatio =
				textarea.scrollTop /
				Math.max(1, textarea.scrollHeight - textarea.clientHeight);
			previewContainer.scrollTop =
				scrollRatio *
				(previewContainer.scrollHeight - previewContainer.clientHeight);
		});

		// ─── 단축키 ──────────────────────────────────────────────────────────────
		this.cleanupShortcuts = registerShortcuts(textarea, {
			...(options.onSave !== undefined && { onSave: options.onSave }),
		});

		// ─── DOM 조립 ─────────────────────────────────────────────────────────────
		editorArea.appendChild(textarea);
		editorArea.appendChild(previewContainer);
		this.root.appendChild(editorArea);
	}

	getValue(): string {
		return this.textarea.value;
	}

	setValue(value: string): void {
		this.textarea.value = value;
		this.viewer.render(value);
		this.options.onChange?.(value);
	}

	destroy(): void {
		this.cleanupShortcuts();
		this.viewer.destroy();
		this.root.innerHTML = "";
		this.root.classList.remove("mdcore-editor");
	}
}
