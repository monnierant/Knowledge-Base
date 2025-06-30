// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightThemeObsidian from 'starlight-theme-obsidian'

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'A Monnier',
			plugins: [starlightThemeObsidian()],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/monnierant/Knowledge-Base' }],
			sidebar: [
				{
					label: 'Kubernetes',
					autogenerate: { directory: 'kubernetes' },
				},
			],
		}),
	],
});
