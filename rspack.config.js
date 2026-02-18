import { defineConfig } from "@rspack/cli";

export default defineConfig({
	devtool: false,
	entry: {
		main: "./src/circular-countdown-card.js",
	},
	output: {
		clean: true,
		filename: "circular-countdown-card.js",
	},
});
