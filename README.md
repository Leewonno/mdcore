# @dldnjssh123/mdcore

프레임워크 독립적인 마크다운 에디터 라이브러리입니다. Vanilla JS 코어 위에 React 어댑터를 제공합니다.

## 특징

- **분할 뷰** — 편집창과 미리보기가 나란히 표시되며 스크롤 동기화
- **툴바** — H1~H3, 굵게, 기울임, 코드, 링크, 이미지, 목록, 인용구, 구분선
- **키보드 단축키** — 자주 쓰는 포맷 단축키 기본 제공
- **이미지 모달** — URL 입력 및 파일 업로드(선택) 지원
- **문법 강조** — highlight.js 기반 코드 블록 하이라이팅
- **XSS 방어** — DOMPurify로 렌더링 결과 자동 정제
- **URL 필터** — `javascript:`, `data:`, `vbscript:` 기본 차단 + 커스텀 필터 지원
- **플러그인** — 파서 플러그인으로 커스텀 블록/인라인 문법 확장 가능
- **Tailwind 불필요** — 자체 CSS 제공, Tailwind 설치 없이 사용 가능

## 설치

```bash
npm install @dldnjssh123/mdcore
```

## CSS 적용

```ts
import "@dldnjssh123/mdcore/style";
```

---

## Vanilla JS

### 에디터

```ts
import { MarkdownEditor } from "@dldnjssh123/mdcore";
import "@dldnjssh123/mdcore/style";

const editor = new MarkdownEditor(document.getElementById("editor"), {
  value: "# Hello",
  height: 500,
  placeholder: "내용을 입력하세요.",
  onChange: (value) => console.log(value),
  onSave: (value) => save(value),       // Ctrl+Enter
  uploadImage: async (file) => {        // 이미지 업로드 핸들러
    const url = await uploadToServer(file);
    return url;
  },
});

// 값 읽기 / 쓰기
editor.getValue();
editor.setValue("새 내용");

// 정리
editor.destroy();
```

### 뷰어 (읽기 전용)

```ts
import { Viewer } from "@dldnjssh123/mdcore";
import "@dldnjssh123/mdcore/style";

const viewer = new Viewer(document.getElementById("preview"));
viewer.render("# Hello\n\n내용");

viewer.destroy();
```

---

## React

```tsx
import { MarkdownEditor, MarkdownViewer } from "@dldnjssh123/mdcore/react";
import "@dldnjssh123/mdcore/style";

function App() {
  const [value, setValue] = useState("# Hello");

  return (
    <>
      <MarkdownEditor
        value={value}
        onChange={setValue}
        onSave={(v) => save(v)}
        height={500}
        placeholder="내용을 입력하세요."
        uploadImage={async (file) => {
          const url = await uploadToServer(file);
          return url;
        }}
        className="my-editor"
      />

      {/* 읽기 전용 */}
      <MarkdownViewer content={value} />
    </>
  );
}
```

---

## 옵션

| 옵션 | 타입 | 설명 |
|------|------|------|
| `value` | `string` | 초기 마크다운 값 |
| `onChange` | `(value: string) => void` | 값이 변경될 때 호출 |
| `onSave` | `(value: string) => void` | Ctrl+Enter 저장 시 호출 |
| `height` | `number` | 에디터 높이(px), 기본값 `400` |
| `placeholder` | `string` | textarea placeholder |
| `plugins` | `ParserPlugin[]` | 파서 플러그인 배열 |
| `urlFilter` | `(url: string) => boolean` | 추가 URL 안전 필터. `false` 반환 시 `#`으로 대체 |
| `uploadImage` | `(file: File) => Promise<string>` | 이미지 업로드 핸들러. 미제공 시 파일 업로드 탭 비활성화 |

## 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl+B` | 굵게 |
| `Ctrl+I` | 기울임 |
| `Ctrl+K` | 링크 삽입 |
| `Ctrl+Shift+K` | 코드 블록 |
| `Ctrl+Enter` | 저장 (`onSave` 호출) |
| `Ctrl+D` | 현재 줄 복제 |
| `Ctrl+/` | HTML 주석 토글 |
| `Tab` / `Shift+Tab` | 들여쓰기 / 내어쓰기 |
| `Enter` | 목록에서 자동 다음 항목 생성 |

## 파서 플러그인

블록 또는 인라인 커스텀 문법을 추가할 수 있습니다.

```ts
import type { ParserPlugin } from "@dldnjssh123/mdcore";

const calloutPlugin: ParserPlugin = {
  block: {
    name: "callout",
    pattern: /^:::(\w+)\n([\s\S]*?):::/m,
    parse: (match) => ({
      type: "callout",
      kind: match[1],
      children: [],
      raw: match[0],
    }),
  },
};
```

## 라이선스

MIT
