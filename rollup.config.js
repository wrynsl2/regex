import typescript from "rollup-plugin-typescript";

export default {
  input: "./src/index.ts",
  plugins: [
    typescript({
      exclude: "node_modules/**",
      typescript: require("typescript")
    })
  ],
  output: [
    {
      format: "cjs",
      file: "lib/bundle.cjs.js",
      sourcemap: true
    },
    {
      format: "es",
      file: "lib/bundle.esm.js",
      sourcemap: true
    },
    {
      format: "umd",
      file: "lib/bundle.umd.js",
      name: 'RegExp2',
      sourcemap: true
    }
  ]
};
