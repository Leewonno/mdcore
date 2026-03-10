import { useEffect, useRef } from "react";
import type { ParserPlugin } from "../../parser/types.js";
import { Viewer as CoreViewer } from "../core/Viewer.js";

export interface MarkdownViewerProps {
	content: string;
	plugins?: ParserPlugin[];
	urlFilter?: (url: string) => boolean;
	className?: string;
}

export function MarkdownViewer({
	content,
	plugins,
	urlFilter,
	className,
}: MarkdownViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<CoreViewer | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const viewer = new CoreViewer(
			containerRef.current,
			plugins ?? [],
			urlFilter,
		);
		viewerRef.current = viewer;
		viewer.render(content);

		return () => {
			viewer.destroy();
			viewerRef.current = null;
		};
	}, [content]);

	useEffect(() => {
		viewerRef.current?.render(content);
	}, [content]);

	return <div ref={containerRef} className={className} />;
}
