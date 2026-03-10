// ─── 블록 파싱 정규식 ──────────────────────────────────────────────────────────

import type {
	BlockContent,
	BlockPluginResult,
	Blockquote,
	Code,
	Heading,
	List,
	ListItem,
	Paragraph,
	ParserPlugin,
	Table,
	ThematicBreak,
} from "./types.js";
import { getLine, indentLevel, parseAlignRow, parseTableRow } from "./utils.js";

// Header 블럭 (# ~ ######)
const ATX_HEADING_RE = /^(#{1,6})\s+(.*?)(?:\s+#+\s*)?$/;
// 코드 블럭 (```)
const FENCED_CODE_RE = /^(`{3,}|~{3,})(.*)?$/;
// 인용문 (>)
const BLOCKQUOTE_RE = /^>\s?(.*)/;
// 구분선(---, ===, ***)
const THEMATIC_BREAK_RE = /^(?:---+|===+|\*\*\*+)\s*$/;
// 순서 없는 리스트
const UNORDERED_LIST_RE = /^([ \t]*)[-*+]\s+(.*)/;
// 순서 있는 리스트
const ORDERED_LIST_RE = /^([ \t]*)(\d+)\.\s+(.*)/;
// 테이블
const TABLE_SEPARATOR_RE = /^\|?[\s:|-]+[\s:|-|]*\|?$/;
// HTML 주석
const HTML_COMMENT_RE = /^<!--/;
// HTML 태그
const HTML_BLOCK_RE = /^<([a-zA-Z][a-zA-Z0-9-]*)[\s>]/;

// ─── 메인 블록 파서 ────────────────────────────────────────────────────────────

export function tokenize(
	markdown: string,
	plugins: ParserPlugin[],
): BlockContent[] {
	const lines = markdown.split("\n");
	const nodes: BlockContent[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = getLine(lines, i);
		const trimmed = line.trim();

		// 빈 줄 스킵
		if (trimmed === "") {
			i++;
			continue;
		}

		// ── 플러그인 블록 훅 ──
		let pluginMatched = false;
		for (const plugin of plugins) {
			if (!plugin.block) continue;
			const result: BlockPluginResult | null = plugin.block(line, lines, i);
			if (result) {
				nodes.push(result.node);
				i = result.nextIndex;
				pluginMatched = true;
				break;
			}
		}
		if (pluginMatched) continue;

		// ── Thematic break ──
		if (THEMATIC_BREAK_RE.test(trimmed)) {
			nodes.push({ type: "thematicBreak" } satisfies ThematicBreak);
			i++;
			continue;
		}

		// ── ATX Heading ──
		const headingMatch = ATX_HEADING_RE.exec(trimmed);
		if (headingMatch) {
			const depth = (headingMatch[1] ?? "").length as 1 | 2 | 3 | 4 | 5 | 6;
			nodes.push({
				type: "heading",
				depth,
				children: parseInlineTokens(headingMatch[2] ?? "", plugins),
			} satisfies Heading);
			i++;
			continue;
		}

		// ── Fenced Code Block ──
		const fencedMatch = FENCED_CODE_RE.exec(trimmed);
		if (fencedMatch) {
			const fence = fencedMatch[1] ?? "```";
			const lang = fencedMatch[2]?.trim() || null;
			const codeLines: string[] = [];
			i++;
			while (i < lines.length) {
				const codeLine = getLine(lines, i);
				if (codeLine.trim().startsWith(fence)) {
					i++;
					break;
				}
				codeLines.push(codeLine);
				i++;
			}
			nodes.push({
				type: "code",
				lang,
				value: codeLines.join("\n"),
			} satisfies Code);
			continue;
		}

		// ── HTML Comment ──
		if (HTML_COMMENT_RE.test(trimmed)) {
			const commentLines: string[] = [];
			while (i < lines.length) {
				const commentLine = getLine(lines, i);
				commentLines.push(commentLine);
				i++;
				if (commentLine.includes("-->")) break;
			}
			// 주석은 노드로 추가하지 않음 (뷰어에서 보이지 않게)
			continue;
		}

		// ── HTML Block ──
		if (HTML_BLOCK_RE.test(trimmed)) {
			const htmlLines: string[] = [];
			while (i < lines.length && getLine(lines, i).trim() !== "") {
				htmlLines.push(getLine(lines, i));
				i++;
			}
			nodes.push({ type: "html", value: htmlLines.join("\n") } satisfies Html);
			continue;
		}

		// ── Blockquote ──
		if (BLOCKQUOTE_RE.test(trimmed)) {
			const quoteLines: string[] = [];
			while (i < lines.length && BLOCKQUOTE_RE.test(getLine(lines, i).trim())) {
				const m = BLOCKQUOTE_RE.exec(getLine(lines, i).trim());
				quoteLines.push(m ? (m[1] ?? "") : "");
				i++;
			}
			const blockquote: Blockquote = {
				type: "blockquote",
				children: tokenize(quoteLines.join("\n"), plugins),
			};
			nodes.push(blockquote);
			continue;
		}

		// ── List ──
		const ulMatch = UNORDERED_LIST_RE.exec(line);
		const olMatch = ORDERED_LIST_RE.exec(line);
		if (ulMatch || olMatch) {
			const ordered = !!olMatch;
			const baseIndent = indentLevel(line);
			const startNum = olMatch ? parseInt(olMatch[2] ?? "1", 10) : null;
			const items: ListItem[] = [];

			while (i < lines.length) {
				const currentLine = getLine(lines, i);
				const currentTrimmed = currentLine.trim();

				if (currentTrimmed === "") {
					i++;
					break;
				}

				const currentIndent = indentLevel(currentLine);
				if (currentIndent < baseIndent && items.length > 0) break;

				const uMatch = UNORDERED_LIST_RE.exec(currentLine);
				const oMatch = ORDERED_LIST_RE.exec(currentLine);

				if ((ordered ? oMatch : uMatch) && currentIndent === baseIndent) {
					const content = ordered ? (oMatch?.[3] ?? "") : (uMatch?.[2] ?? "");
					// 태스크 리스트 체크박스
					const checkMatch = /^\[(x| )\]\s+(.*)/.exec(content);
					const checked = checkMatch ? checkMatch[1] === "x" : null;
					const text = checkMatch ? (checkMatch[2] ?? "") : content;

					const item: ListItem = {
						type: "listItem",
						checked,
						children: [
							{
								type: "paragraph",
								children: parseInlineTokens(text, plugins),
							} satisfies Paragraph,
						],
					};
					items.push(item);
					i++;
				} else if (currentIndent > baseIndent && items.length > 0) {
					// 들여쓰기된 하위 내용 → 마지막 아이템에 추가
					const subLines: string[] = [];
					while (
						i < lines.length &&
						indentLevel(getLine(lines, i)) > baseIndent
					) {
						subLines.push(getLine(lines, i).slice(baseIndent + 2));
						i++;
					}
					const lastItem = items[items.length - 1];
					if (lastItem) {
						const subNodes = tokenize(subLines.join("\n"), plugins);
						lastItem.children.push(...subNodes);
					}
				} else {
					break;
				}
			}

			nodes.push({
				type: "list",
				ordered,
				start: startNum,
				children: items,
			} satisfies List);
			continue;
		}

		// ── Table (GFM) ──
		// 다음 줄이 구분자 행인지 확인
		if (
			i + 1 < lines.length &&
			TABLE_SEPARATOR_RE.test(getLine(lines, i + 1).trim())
		) {
			const headerRow = parseTableRow(trimmed, plugins);
			const align = parseAlignRow(getLine(lines, i + 1).trim());
			const rows: TableRow[] = [headerRow];
			i += 2;
			while (i < lines.length && getLine(lines, i).trim().startsWith("|")) {
				rows.push(parseTableRow(getLine(lines, i).trim(), plugins));
				i++;
			}
			nodes.push({ type: "table", align, children: rows } satisfies Table);
			continue;
		}

		// ── Paragraph ──
		const paraLines: string[] = [];
		while (i < lines.length) {
			const paraLine = getLine(lines, i);
			const paraTrimmed = paraLine.trim();
			if (paraTrimmed === "") break;
			if (
				ATX_HEADING_RE.test(paraTrimmed) ||
				FENCED_CODE_RE.test(paraTrimmed) ||
				THEMATIC_BREAK_RE.test(paraTrimmed) ||
				BLOCKQUOTE_RE.test(paraTrimmed) ||
				UNORDERED_LIST_RE.test(paraLine) ||
				ORDERED_LIST_RE.test(paraLine)
			) {
				break;
			}
			paraLines.push(paraTrimmed);
			i++;
		}

		if (paraLines.length > 0) {
			nodes.push({
				type: "paragraph",
				children: parseInlineTokens(paraLines.join(" "), plugins),
			} satisfies Paragraph);
		}
	}

	return nodes;
}
