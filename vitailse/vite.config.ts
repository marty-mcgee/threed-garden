import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import liveReload from 'vite-plugin-live-reload'
import { resolve } from 'path'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import { VitePWA } from 'vite-plugin-pwa'
import VueI18n from '@intlify/vite-plugin-vue-i18n'

// https://vitejs.dev/config/
export default defineConfig({

	plugins: [
		vue(),
		liveReload([
		  // edit live reload paths according to your source code
		  // for example:
		  __dirname + '/(app|config|views)/**/*.php',
		  // using this for our example:
		  __dirname + '/../public/*.php',
		]),
		Components({
			dts: true,
			resolvers: [
				IconsResolver({
					prefix: 'icon',
				}),
			],
		}),
		Icons({
			compiler: 'vue3',
		}),
		AutoImport({
			dts: true,
			// targets to transform
			include: [
				/\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
				/\.vue\??/, // .vue
			],

			// global imports to register
			imports: [
				// presets
				'vue',
				'vue-router',
				'vue-i18n',
				'@vueuse/core',
				'@vueuse/head',
				// custom
			],

			// custom resolvers
			// see https://github.com/antfu/unplugin-auto-import/pull/23/
			resolvers: [],
		}),
		Pages(),
		Layouts(),
		VitePWA({
			// disable: true,
			strategies: 'generateSW', // 'generateSW' | 'injectManifest',
			// srcDir: 'src',
			// filename: 'sw.ts',
			includeAssets: [
				'index.html', //doesn't solve issue, not pre-cached
				'favicon-16x16.png',
				'favicon-32x32.png',
				'favicon.ico',
				'robots.txt',
				'apple-touch-icon.png',
			],
			manifest: {
				name: 'ThreeD Garden',
				short_name: 'ThreeD Garden',
				description: '3D WordPress Plugin',
				theme_color: '#076AE0',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
				],
				//start_url: "index.php",
				//background_color: "#222222",
				//display: "standalone"
			},
			workbox: {
				swDest: resolve(__dirname, '../public/dist/threedgarden-sw.js'),
				// globPatterns: [
				// 	'*/*.*',
				// 	'*.*'
				// ],
				//directoryIndex: resolve(__dirname, '../public/index.php'),
				//directoryIndex: null,
				//navigationPreload: false,
				//exclude: [/\.map$/, /^manifest.*\.js(?:on)?$/, /\.html$/],
				//navigateFallback: '/index.php',
				// templatedURLs: {
				// 	'.': ['index.php']
				// }
				globPatterns: [
					// '*/*.*',
					// '*.*',
					'index.html'
				],
			},
			// injectManifest: {
			// 	swDest: resolve(__dirname, '../public/dist/threedgarden-sw.js')
			// },
		}),
		VueI18n({
			runtimeOnly: true,
			compositionOnly: true,
			include: [resolve(__dirname, 'locales/**')],
		}),
	],

	// config
	root: 'src',

	base: process.env.APP_ENV === 'development'
	  ? '/public/dist/'
	  : '/public/dist/',

	build: {
		// output dir for production build
		outDir: resolve(__dirname, '../public/dist'),
		emptyOutDir: true,
	
		// emit manifest so PHP can find the hashed files
		manifest: true,

		// lib: {
		// 	entry: resolve(__dirname, 'src/main.ts'),
		// 	name: 'threedgarden-sw',
		// 	formats: ['es'],
		// 	fileName: (format) => `my-lib.${format}.js`
		// },

		// ignored when using output.assetFileNames
		//assetsDir: './assets/', 

  		cssCodeSplit: false,
  		minify: false,

		//ssr: true,
	  	rollupOptions: {

			input: {
				//main: 'index.html',
				//main: resolve(__dirname, 'index.php'),
				//main: '.'
				//main: 'main.ts'
				//main: resolve(__dirname, 'index.html'),
				a: 'main.ts',
				//'b/index': resolve(__dirname, 'index.html')
				//b: resolve(__dirname, 'index.html')
			},

			// make sure to externalize deps that shouldn't be bundled
			// into your library
			external: ['vue', 'jquery'],

			output: {
				format: 'cjs', // ('es' | 'cjs' | 'umd' | 'iife')
				name: 'ThreeDGardenBundle',
				entryFileNames: `assets/[name].js`,
				chunkFileNames: `assets/[name].js`,
				assetFileNames: `assets/[name].[ext]`,
				// Provide global variables to use in the UMD build
				// for externalized deps
				globals: {
					vue: 'Vue',
					jquery: '$'
				}
			}

		}
	},
	
	resolve: {
		alias: {
			'@': resolve(__dirname, './src'),
			vue: 'vue/dist/vue.esm-bundler.js'
		},
	},

	server: {
		fs: {
			strict: true,
		},

		// required to load scripts from custom host
		cors: true,
	
		// we need a strict port to match on PHP side
		// change freely, but update on PHP to match the same port
		strictPort: true,
		port: 3000
	},

	optimizeDeps: {
		include: ['vue', 'vue-router', '@vueuse/core', '@vueuse/head'],
		exclude: ['vue-demi'],
	},

	// @ts-ignore
	ssgOptions: {
		script: 'async',
		formatting: 'minify',
	},
})
