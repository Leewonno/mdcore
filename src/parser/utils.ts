import { parseInlineTokens } from "./inline.js";
import type { TableCell } from "./types.js";
import type { TableRow } from "./types.js";
import type { ParserPlugin } from "./types.js";

// 리스트 아이템 깊이 측정
export function indentLevel(line: string): number {
	let count = 0;
	for (const ch of line) {
		if (ch === " ") count++;
		else if (ch === "\t") count += 2;
		else break;
	}
	return count;
}

// 테이블 행 파싱
export function parseTableRow(line: string, plugins: ParserPlugin[]): TableRow {
	const raw = line.replace(/^\||\|$/g, "");
	const cells = raw.split("|").map(
		(cell): TableCell => ({
			type: "tableCell",
			children: parseInlineTokens(cell.trim(), plugins),
		}),
	);
	return { type: "tableRow", children: cells };
}

// 테이블 정렬
export function parseAlignRow(
	line: string,
): ("left" | "right" | "center" | null)[] {
	const raw = line.replace(/^\||\|$/g, "");
	return raw.split("|").map((cell) => {
		const c = cell.trim();
		if (c.startsWith(":") && c.endsWith(":")) return "center";
		if (c.endsWith(":")) return "right";
		if (c.startsWith(":")) return "left";
		return null;
	});
}

export function getLine(lines: string[], index: number): string {
	return lines[index] ?? "";
}
