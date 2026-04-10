import path from "node:path";

import { defineConfig } from "@tarojs/cli";

const sharedGameCorePath = path.resolve(__dirname, "..", "..", "..", "packages", "game-core", "src");

export default defineConfig({
  projectName: "ruletale-mini",
  date: "2026-04-09",
  designWidth: 375,
  deviceRatio: {
    375: 2,
    750: 1,
  },
  sourceRoot: "src",
  outputRoot: "dist",
  framework: "react",
  compiler: "webpack5",
  alias: {
    "@": path.resolve(__dirname, "..", "src"),
    "@game-core": sharedGameCorePath,
  },
  plugins: ["@tarojs/plugin-framework-react"],
  mini: {
    compile: {
      include: [sharedGameCorePath],
    },
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      url: {
        enable: true,
        config: {
          limit: 1024,
        },
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: "global",
          generateScopedName: "[local]",
        },
      },
    },
  },
});
