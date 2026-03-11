import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		dts({ tsconfigPath: "./tsconfig.json" }),
	],
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
			output: {
				assetFileNames: "style.css",
			},
		},
		cssCodeSplit: false, // CSS를 하나의 style.css로
	},
});
