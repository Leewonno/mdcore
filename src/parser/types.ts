// remark/mdast 스펙 호환 MDAST 타입 정의
// https://github.com/syntax-tree/mdast

// ─── Phrasing Content (인라인) ────────────────────────────────────────────────

export interface Text {
	type: "text";
	value: string;
}

export interface Strong {
	type: "strong";
	children: PhrasingContent[];
}

export interface Emphasis {
	type: "emphasis";
	children: PhrasingContent[];
}

export interface InlineCode {
	type: "inlineCode";
	children: string;
}

export interface Link {
	type: "link";
	url: string;
	title: string | null;
	children: PhrasingContent;
}

export interface Image {
	type: "image";
	url: string;
	title: string | null;
	alt: string;
}

export interface Html {
	type: "html";
	value: string;
}

export type PhrasingContent =
	| Text
	| Strong
	| Emphasis
	| InlineCode
	| Link
	| Image
	| Html;

// ─── Block Content ────────────────────────────────────────────────────────────

export interface Paragraph {
	type: "paragraph";
	children: PhrasingContent[];
}

export interface Heading {
	type: "heading";
	depth: 1 | 2 | 3 | 4 | 5 | 6;
	children: PhrasingContent[];
}

export interface Code {
	type: "code";
	lang: string | null;
	value: string;
}

export interface Blockquote {
	type: "blockquote";
	children: BlockContent[];
}

export interface ListItem {
	type: "listItem";
	checked: boolean | null;
	children: BlockContent[];
}

export interface List {
	type: "list";
	ordered: boolean;
	start: number | null;
	children: ListItem[];
}

export interface ThematicBreak {
	type: "thematicBreak";
}

export interface TableCell {
	type: "tableCell";
	children: PhrasingContent[];
}

export interface TableRow {
	type: "tableRow";
	children: TableCell[];
}

export interface Table {
	type: "table";
	align: ("left" | "right" | "center" | null)[];
	children: TableRow[];
}

export type BlockContent =
	| Paragraph
	| Heading
	| Code
	| Blockquote
	| List
	| ThematicBreak
	| Table
	| Html;

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface Root {
	type: "root";
	children: BlockContent[];
}

// ─── Plugin Interface ─────────────────────────────────────────────────────────

export interface BlockPluginResult {
	node: BlockContent;
	/** 파서가 다음 처리를 시작할 줄 인덱스 */
	nextIndex: number;
}

export interface InlinePluginResult {
	node: PhrasingContent;
	/** 소비한 문자 수 */
	length: number;
}

export interface ParserPlugin {
	/** 블록 파싱 훅: 현재 줄과 전체 줄 배열을 받아 노드를 반환하거나 null */
	block?: (
		line: string,
		lines: string[],
		index: number,
	) => BlockPluginResult | null;
	/** 인라인 파싱 훅: 현재 남은 문자열을 받아 노드와 소비 길이를 반환하거나 null */
	inline?: (src: string) => InlinePluginResult | null;
}
