import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	build: {
		lib: {
			entry: {
				index: "src/editor/core/index.ts",
				react: "src/editor/react/index.ts",
			},
			formats: ["es"],
		},
		rollupOptions: {
			external: ["react", "react-dom", "react/jsx-runtime"],
		},
		cssCodeSplit: false, // CSS를 하나의 style.css로
	},
});
