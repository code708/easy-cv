// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: process.env.SITE_DOMAIN || 'https://code708.com',
	base: process.env.SITE_BASE || '/',
	vite: {
		plugins: [tailwindcss()],
	},
});
