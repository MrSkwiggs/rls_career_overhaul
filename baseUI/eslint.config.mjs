import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import vue from "eslint-plugin-vue";
import beamng from "lint-plugin-beamng";
import babelParser from "@babel/eslint-parser";

export default defineConfig([
  {
    ignores: [
      "node_modules",
      "dist",
    ],
  },

  js.configs.recommended,

  ...vue.configs["flat/essential"],

  {
    plugins: {
      vue,
      beamng,
    },

    languageOptions: {
      parser: babelParser, // Default parser for JS files
      parserOptions: {
        requireConfigFile: false,
        sourceType: "module",
      },
      globals: {
        __dirname: "readonly",
        process: "readonly",
        console: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        history: "readonly",
        fetch: "readonly",
        XMLHttpRequest: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        Document: "readonly",
        Node: "readonly",
        Element: "readonly",
        HTMLElement: "readonly",
        SVGElement: "readonly",
        Image: "readonly",
        OffscreenCanvas: "readonly",
        createImageBitmap: "readonly",
        localStorage: "readonly",
        Event: "readonly",
        EventTarget: "readonly",
        CustomEvent: "readonly",
        Blob: "readonly",
        URL: "readonly",
        DOMParser: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        IntersectionObserver: "readonly",
        ResizeObserver: "readonly",
        MutationObserver: "readonly",
        "vue/setup-compiler-macros": true,
        bngApi: "readonly",
        beamng: "readonly",
      },
    },

    rules: {
      "vue/multi-word-component-names": "off",
      "vue/require-v-for-key": "off",
      "vue/no-mutating-props": "off",
      "vue/no-setup-props-destructure": "off",
      "no-unused-vars": ["warn", {
        "varsIgnorePattern": "^_$",
        "caughtErrors": "none",
      }],
      "no-fallthrough": "off",
      "no-empty": "off",
      "no-var": "error",
    },
  },

  {
    files: ["**/*.vue"],
    rules: {
      "beamng/vue-template-operators": "error",
    },
  },

  {
    files: ["src/bridge/LuaFunctionSignatures.js"],
    rules: {
      "beamng/lua-signatures": "error",
      "no-unused-vars": ["warn", {
        "varsIgnorePattern": "^_$",
        "caughtErrors": "none",
        "args": "none",
      }],
    },
  },
])
