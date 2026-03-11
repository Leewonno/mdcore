import dts from "rollup-plugin-dts";

const external = (id) => /\.css$/.test(id);

export default [
  {
    input: "./dist/editor/core/index.d.ts",
    output: { file: "dist/index.d.ts", format: "es" },
    plugins: [dts()],
    external,
  },
  {
    input: "./dist/editor/react/index.d.ts",
    output: { file: "dist/react.d.ts", format: "es" },
    plugins: [dts()],
    external,
  },
];
