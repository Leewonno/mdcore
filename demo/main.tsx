import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { MarkdownEditor } from "../src/editor/react/index.js";
import "./styles.css";
import "../src/editor/core/styles/editor.css";

const INITIAL = `# 안녕하세요

**굵게**, *기울임*, \`인라인 코드\`

- 리스트 아이템
- 두 번째 아이템

> 인용문

\`\`\`ts
const hello = "world";
\`\`\`
`;

function App() {
	const [value, setValue] = useState(INITIAL);

	return (
		<div style={{ maxWidth: 800, margin: "40px auto", padding: "0 16px" }}>
			<h1 style={{ marginBottom: 16 }}>mdcore 데모</h1>
			<MarkdownEditor
				value={value}
				onChange={setValue}
				height={500}
				placeholder="마크다운을 입력하세요..."
			/>
		</div>
	);
}

const root = document.getElementById("root");
if (root)
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
