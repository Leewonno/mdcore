import { tokenize } from "./tokenizer.js";
import type { ParserPlugin, Root } from "./types.js";

export function parse(markdown: string, plugins: ParserPlugin[] = []): Root {
	return {
		type: "root",
		children: tokenize(markdown, plugins),
	};
}

export type {
	BlockContent,
	BlockPluginResult,
	Blockquote,
	Code,
	Emphasis,
	Heading,
	Html,
	Image,
	InlineCode,
	InlinePluginResult,
	Link,
	List,
	ListItem,
	Paragraph,
	ParserPlugin,
	PhrasingContent,
	Root,
	Strong,
	Table,
	TableCell,
	TableRow,
	Text,
	ThematicBreak,
} from "./types.js";
