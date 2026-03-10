// ─── 텍스트 삽입 유틸 ─────────────────────────────────────────────────────────

function insertAround(
	textarea: HTMLTextAreaElement,
	before: string,
	after: string,
): void {
	const { selectionStart: start, selectionEnd: end, value } = textarea;
	const selected = value.slice(start, end);

	// 이미 감싸진 경우 토글 해제
	const beforeSel = value.slice(start - before.length, start);
	const afterSel = value.slice(end, end + after.length);
	if (beforeSel === before && afterSel === after) {
		const next =
			value.slice(0, start - before.length) +
			selected +
			value.slice(end + after.length);
		setNativeValue(textarea, next);
		setSelection(textarea, start - before.length, end - before.length);
		return;
	}

	const next =
		value.slice(0, start) + before + selected + after + value.slice(end);
	setNativeValue(textarea, next);
	setSelection(textarea, start + before.length, end + before.length);
}

function insertLine(
	textarea: HTMLTextAreaElement,
	prefix: string,
	placeholder: string,
): void {
	const { selectionStart: start, value } = textarea;
	const lineStart = value.lastIndexOf("\n", start - 1) + 1;
	const lineEnd = value.indexOf("\n", start);
	const end = lineEnd === -1 ? value.length : lineEnd;
	const currentLine = value.slice(lineStart, end);

	// 이미 해당 prefix가 있으면 제거
	if (currentLine.startsWith(prefix)) {
		const next =
			value.slice(0, lineStart) +
			currentLine.slice(prefix.length) +
			value.slice(end);
		setNativeValue(textarea, next);
		setSelection(textarea, start - prefix.length, start - prefix.length);
		return;
	}

	const content = currentLine.trim() || placeholder;
	const next = value.slice(0, lineStart) + prefix + content + value.slice(end);
	setNativeValue(textarea, next);
	const newCursor = lineStart + prefix.length + content.length;
	setSelection(textarea, newCursor, newCursor);
}

// 라인 복제
function duplicateLine(textarea: HTMLTextAreaElement): void {
	const { selectionStart: start, value } = textarea;
	const lineStart = value.lastIndexOf("\n", start - 1) + 1;
	const lineEnd = value.indexOf("\n", start);
	const end = lineEnd === -1 ? value.length : lineEnd;
	const currentLine = value.slice(lineStart, end);
	const next = `${value.slice(0, end)}\n${currentLine}${value.slice(end)}`;
	setNativeValue(textarea, next);
	const newCursor = end + 1 + (start - lineStart);
	setSelection(textarea, newCursor, newCursor);
}

function toggleComment(textarea: HTMLTextAreaElement): void {
	insertAround(textarea, "<!-- ", " -->");
}

function handleTab(textarea: HTMLTextAreaElement, shift: boolean): void {
	const { selectionStart: start, value } = textarea;
	const lineStart = value.lastIndexOf("\n", start - 1) + 1;
	const lineContent = value.slice(lineStart);
	const isListItem = /^[ \t]*[-*+]\s|^[ \t]*\d+\.\s/.test(lineContent);

	if (isListItem) {
		if (shift) {
			// 내어쓰기: 앞 공백 2칸 제거
			const spaceMatch = /^( {2}|\t)/.exec(value.slice(lineStart));
			if (spaceMatch) {
				const next =
					value.slice(0, lineStart) +
					value.slice(lineStart + spaceMatch[0].length);
				setNativeValue(textarea, next);
				setSelection(
					textarea,
					start - spaceMatch[0].length,
					start - spaceMatch[0].length,
				);
			}
		} else {
			// 들여쓰기: 앞에 공백 2칸 추가
			const next = `${value.slice(0, lineStart)}  ${value.slice(lineStart)}`;
			setNativeValue(textarea, next);
			setSelection(textarea, start + 2, start + 2);
		}
	} else {
		if (!shift) {
			const next = `${value.slice(0, start)}  ${value.slice(start)}`;
			setNativeValue(textarea, next);
			setSelection(textarea, start + 2, start + 2);
		}
	}
}

function handleEnter(textarea: HTMLTextAreaElement): boolean {
	const { selectionStart: start, value } = textarea;
	const lineStart = value.lastIndexOf("\n", start - 1) + 1;
	const lineContent = value.slice(lineStart, start);

	// 순서 없는 목록
	const ulMatch = /^([ \t]*)([-*+])\s(.*)/.exec(lineContent);
	if (ulMatch) {
		const indent = ulMatch[1] ?? "";
		const bullet = ulMatch[2] ?? "-";
		const content = ulMatch[3] ?? "";
		if (content.trim() === "") {
			// 내용 없으면 목록 종료 (현재 줄 제거 + 개행)
			const next = `${value.slice(0, lineStart)}\n${value.slice(start)}`;
			setNativeValue(textarea, next);
			setSelection(textarea, lineStart + 1, lineStart + 1);
		} else {
			const insertion = `\n${indent}${bullet} `;
			const next = value.slice(0, start) + insertion + value.slice(start);
			setNativeValue(textarea, next);
			setSelection(
				textarea,
				start + insertion.length,
				start + insertion.length,
			);
		}
		return true;
	}

	// 순서 있는 목록
	const olMatch = /^([ \t]*)(\d+)\.\s(.*)/.exec(lineContent);
	if (olMatch) {
		const indent = olMatch[1] ?? "";
		const numStr = olMatch[2] ?? "1";
		const content = olMatch[3] ?? "";
		if (content.trim() === "") {
			const next = `${value.slice(0, lineStart)}\n${value.slice(start)}`;
			setNativeValue(textarea, next);
			setSelection(textarea, lineStart + 1, lineStart + 1);
		} else {
			const nextNum = parseInt(numStr, 10) + 1;
			const insertion = `\n${indent}${nextNum}. `;
			const next = value.slice(0, start) + insertion + value.slice(start);
			setNativeValue(textarea, next);
			setSelection(
				textarea,
				start + insertion.length,
				start + insertion.length,
			);
		}
		return true;
	}

	return false;
}

// ─── React synthetic event 호환을 위한 네이티브 값 설정 ────────────────────────

function setNativeValue(el: HTMLTextAreaElement, value: string): void {
	const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
		HTMLTextAreaElement.prototype,
		"value",
	)?.set;
	nativeInputValueSetter?.call(el, value);
	el.dispatchEvent(new Event("input", { bubbles: true }));
}

function setSelection(
	el: HTMLTextAreaElement,
	start: number,
	end: number,
): void {
	el.setSelectionRange(start, end);
	el.focus();
}

// ─── 단축키 핸들러 등록 ───────────────────────────────────────────────────────

export interface ShortcutHandlerOptions {
	onSave?: (value: string) => void;
}

// 단축키
export function registerShortcuts(
	textarea: HTMLTextAreaElement,
	options: ShortcutHandlerOptions,
): () => void {
	const handler = (e: KeyboardEvent): void => {
		// 한글 입력 후 엔터, 탭 등 키보드 입력 시 두 번 실행되는 문제 해결
		if (e.isComposing) return;

		const ctrl = e.ctrlKey || e.metaKey;

		// Enter: 목록 자동 생성
		if (e.key === "Enter" && !ctrl && !e.shiftKey && !e.altKey) {
			const handled = handleEnter(textarea);
			if (handled) e.preventDefault();
			return;
		}

		// Tab / Shift+Tab
		if (e.key === "Tab") {
			e.preventDefault();
			handleTab(textarea, e.shiftKey);
			return;
		}

		if (!ctrl) return;

		switch (e.key) {
			case "b":
			case "B":
				e.preventDefault();
				insertAround(textarea, "**", "**");
				break;

			case "i":
			case "I":
				if (!e.shiftKey) {
					e.preventDefault();
					insertAround(textarea, "*", "*");
				}
				break;

			case "k":
			case "K":
				e.preventDefault();
				if (e.shiftKey) {
					// Ctrl+Shift+K: 코드 블록
					insertAround(textarea, "```\n", "\n```");
				} else {
					// Ctrl+K: 링크
					insertAround(textarea, "[", "](url)");
				}
				break;

			case "/":
				e.preventDefault();
				toggleComment(textarea);
				break;

			case "d":
			case "D":
				e.preventDefault();
				duplicateLine(textarea);
				break;

			case "Enter":
				e.preventDefault();
				options.onSave?.(textarea.value);
				break;
		}
	};

	textarea.addEventListener("keydown", handler);
	return () => textarea.removeEventListener("keydown", handler);
}

export { insertAround, insertLine };
