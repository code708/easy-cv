// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.code708.com',
	base: process.env.ASTRO_BASE || '/',
	vite: {
		plugins: [tailwindcss()],
	},
});
