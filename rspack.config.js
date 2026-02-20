import { defineConfig } from "@rspack/cli";

export default defineConfig({
  devtool: false,

  target: ["web", "es2015"],   // 👈 important

  entry: {
    main: "./src/circular-countdown-card.js",
  },

  output: {
    clean: true,
    filename: "circular-countdown-card.js",
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "builtin:swc-loader",
        options: {
          jsc: {
            target: "es2015"   // 👈 important
          }
        }
      }
    ]
  }
});