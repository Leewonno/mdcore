type InsertImageFn = (markdown: string) => void;

interface ImageModalOptions {
	uploadImage?: (file: File) => Promise<string>;
	onInsert: InsertImageFn;
}

export function openImageModal(options: ImageModalOptions): void {
	const { uploadImage, onInsert } = options;

	// ─── 오버레이 ────────────────────────────────────────────────────────────────
	const overlay = document.createElement("div");
	overlay.className = "mdcore-modal-overlay";

	const modal = document.createElement("div");
	modal.className = "mdcore-modal";

	// ─── 탭 ─────────────────────────────────────────────────────────────────────
	const tabBar = document.createElement("div");
	tabBar.className = "mdcore-modal-tab-bar";

	const tabUrl = createTab("URL 입력", true);
	const tabFile = createTab("업로드", false, !uploadImage);
	tabBar.appendChild(tabUrl);
	tabBar.appendChild(tabFile);

	// ─── URL 패널 ────────────────────────────────────────────────────────────────
	const urlPanel = document.createElement("div");
	urlPanel.className = "mdcore-modal-panel";

	const urlInput = document.createElement("input");
	urlInput.type = "url";
	urlInput.placeholder = "https://example.com/image.png";
	urlInput.className = "mdcore-modal-input";

	const altUrlInput = document.createElement("input");
	altUrlInput.type = "text";
	altUrlInput.placeholder = "대체 텍스트 (선택)";
	altUrlInput.className = "mdcore-modal-input";

	urlPanel.appendChild(labelWrap("이미지 URL", urlInput));
	urlPanel.appendChild(labelWrap("대체 텍스트", altUrlInput));

	// ─── 파일 패널 ───────────────────────────────────────────────────────────────
	const filePanel = document.createElement("div");
	filePanel.className = "mdcore-modal-panel mdcore-hidden";

	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.accept = "image/*";
	fileInput.className = "mdcore-modal-file-input";

	const altFileInput = document.createElement("input");
	altFileInput.type = "text";
	altFileInput.placeholder = "대체 텍스트 (선택)";
	altFileInput.className = "mdcore-modal-input";

	const uploadStatus = document.createElement("p");
	uploadStatus.className = "mdcore-modal-upload-status mdcore-hidden";
	uploadStatus.textContent = "업로드 중...";

	filePanel.appendChild(labelWrap("이미지 파일", fileInput));
	filePanel.appendChild(labelWrap("대체 텍스트", altFileInput));
	filePanel.appendChild(uploadStatus);

	// ─── 탭 전환 ─────────────────────────────────────────────────────────────────
	let activeTab: "url" | "file" = "url";

	function activateTab(tab: "url" | "file"): void {
		activeTab = tab;
		if (tab === "url") {
			urlPanel.classList.remove("mdcore-hidden");
			filePanel.classList.add("mdcore-hidden");
			tabUrl.classList.add("mdcore-modal-tab--active");
			tabFile.classList.remove("mdcore-modal-tab--active");
		} else {
			filePanel.classList.remove("mdcore-hidden");
			urlPanel.classList.add("mdcore-hidden");
			tabFile.classList.add("mdcore-modal-tab--active");
			tabUrl.classList.remove("mdcore-modal-tab--active");
		}
	}

	tabUrl.addEventListener("click", () => activateTab("url"));
	if (uploadImage) {
		tabFile.addEventListener("click", () => activateTab("file"));
	}

	activateTab("url");

	// ─── 버튼 영역 ───────────────────────────────────────────────────────────────
	const actions = document.createElement("div");
	actions.className = "mdcore-modal-actions";

	const cancelBtn = document.createElement("button");
	cancelBtn.type = "button";
	cancelBtn.textContent = "취소";
	cancelBtn.className = "mdcore-modal-btn-cancel";

	const insertBtn = document.createElement("button");
	insertBtn.type = "button";
	insertBtn.textContent = "삽입";
	insertBtn.className = "mdcore-modal-btn-insert";

	actions.appendChild(cancelBtn);
	actions.appendChild(insertBtn);

	// ─── 닫기 ────────────────────────────────────────────────────────────────────
	function close(): void {
		document.body.removeChild(overlay);
	}

	cancelBtn.addEventListener("click", close);
	overlay.addEventListener("click", (e) => {
		if (e.target === overlay) close();
	});

	// ─── 삽입 ────────────────────────────────────────────────────────────────────
	insertBtn.addEventListener("click", async () => {
		if (activeTab === "url") {
			const url = urlInput.value.trim();
			if (!url) return;
			const alt = altUrlInput.value.trim() || "image";
			onInsert(`![${alt}](${url})`);
			close();
		} else if (activeTab === "file" && uploadImage) {
			const file = fileInput.files?.[0];
			if (!file) return;
			try {
				insertBtn.disabled = true;
				uploadStatus.classList.remove("mdcore-hidden");
				const url = await uploadImage(file);
				const alt = altFileInput.value.trim() || file.name;
				onInsert(`![${alt}](${url})`);
				close();
			} catch {
				uploadStatus.textContent = "업로드 실패. 다시 시도해주세요.";
				insertBtn.disabled = false;
			}
		}
	});

	// ─── 조립 ────────────────────────────────────────────────────────────────────
	modal.appendChild(tabBar);
	modal.appendChild(urlPanel);
	modal.appendChild(filePanel);
	modal.appendChild(actions);
	overlay.appendChild(modal);
	document.body.appendChild(overlay);

	urlInput.focus();
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function createTab(
	label: string,
	active: boolean,
	disabled = false,
): HTMLButtonElement {
	const btn = document.createElement("button");
	btn.type = "button";
	btn.textContent = label;
	const classes = ["mdcore-modal-tab"];
	if (active) classes.push("mdcore-modal-tab--active");
	if (disabled) classes.push("mdcore-modal-tab--disabled");
	btn.className = classes.join(" ");
	if (disabled) btn.disabled = true;
	return btn;
}

function labelWrap(text: string, input: HTMLElement): HTMLElement {
	const wrap = document.createElement("label");
	wrap.className = "mdcore-modal-label";
	const span = document.createElement("span");
	span.className = "mdcore-modal-label-text";
	span.textContent = text;
	wrap.appendChild(span);
	wrap.appendChild(input);
	return wrap;
}
