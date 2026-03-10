import type { ParserPlugin } from "../../parser/types.js";

export interface MarkdownEditorOptions {
	value?: string;
	onChange?: (value: string) => void;
	onSave?: (value: string) => void;
	height?: number;
	placeholder?: string;
	plugins?: ParserPlugin[];
	/**
	 * URL 안전 여부를 추가로 검사하는 함수.
	 * false를 반환하면 해당 URL을 '#'으로 대체.
	 * 기본 필터(javascript:, data:, vbscript:)는 항상 적용됨.
	 */
	urlFilter?: (url: string) => boolean;
	/**
	 * 파일 업로드 핸들러. 제공하지 않으면 이미지 모달에서 파일 업로드 탭 비활성화.
	 */
	uploadImage?: (file: File) => Promise<string>;
}
