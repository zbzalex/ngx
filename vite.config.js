import commonjs from "vite-plugin-commonjs"
import { defineConfig } from "vite"

export default defineConfig({
	plugins: [
		commonjs()
	]	
})

