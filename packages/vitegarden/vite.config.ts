/// <reference types="vitest" />
import path from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Markdown from 'vite-plugin-md'
import WindiCSS from 'vite-plugin-windicss'
//import { VitePWA } from 'vite-plugin-pwa'
import VueI18n from '@intlify/vite-plugin-vue-i18n'
import Inspect from 'vite-plugin-inspect'
import Prism from 'markdown-it-prism'
import LinkAttributes from 'markdown-it-link-attributes'

import inject from '@rollup/plugin-inject'

const markdownWrapperClasses = 'prose prose-sm m-auto text-left'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, 'src')}/`,
      // *** vue-tailwind-ethereum-template aliases ***
      // src: path.resolve(__dirname, 'src'),
      // assert: require.resolve('assert/'),
      // crypto: require.resolve('crypto-browserify'),
      // http: require.resolve('stream-http'),
      // https: require.resolve('https-browserify'),
      // os: require.resolve('os-browserify/browser'),
      // stream: require.resolve('stream-browserify'),
    },
  },
  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages({
      extensions: ['vue', 'md'],
    }),

    // https://github.com/JohnCampionJr/vite-plugin-vue-layouts
    Layouts(),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue-i18n',
        '@vueuse/head',
        '@vueuse/core',
				'vitest',
      ],
      dts: 'src/auto-imports.d.ts',
    }),

    // https://github.com/antfu/unplugin-vue-components
    Components({
      // allow auto load markdown components under `./src/components/`
      extensions: ['vue', 'md'],

      // allow auto import and register components used in markdown
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],

      // custom resolvers
      resolvers: [
        // auto import icons
        // https://github.com/antfu/unplugin-icons
        IconsResolver({
          componentPrefix: '',
          enabledCollections: ['carbon']
        }),
      ],

      dts: 'src/components.d.ts',
    }),

    // https://github.com/antfu/unplugin-icons
    Icons({
			autoInstall: true,
		}),

    // https://github.com/antfu/vite-plugin-windicss
    WindiCSS({
      safelist: markdownWrapperClasses,
    }),

    // https://github.com/antfu/vite-plugin-md
    // Don't need this? Try vitesse-lite: https://github.com/antfu/vitesse-lite
    Markdown({
      wrapperClasses: markdownWrapperClasses,
      headEnabled: true,
      markdownItSetup(md) {
				// https://prismjs.com/
				md.use(Prism)
				md.use(LinkAttributes, {
					pattern: /^https?:\/\//,
					attrs: {
						target: '_blank',
						rel: 'noopener',
					},
				})
      },
    }),

    // VitePWA({
		// 	registerType: 'autoUpdate',
		// 	includeAssets: ['favicon.svg', 'robots.txt', 'safari-pinned-tab.svg'],
		// 	manifest: {
		// 		name: 'ThreeD Garden',
		// 		short_name: 'ThreeD Garden',
		// 		description: '3D WordPress Plugin',
		// 		theme_color: '#076AE0',
		// 		background_color: "#222222",
		// 		icons: [
		// 			{
		// 				src: '/pwa-192x192.png',
		// 				sizes: '192x192',
		// 				type: 'image/png',
		// 			},
		// 			{
		// 				src: '/pwa-512x512.png',
		// 				sizes: '512x512',
		// 				type: 'image/png',
		// 			},
		// 			{
		// 				src: '/pwa-512x512.png',
		// 				sizes: '512x512',
		// 				type: 'image/png',
		// 				purpose: 'any maskable',
		// 			},
		// 		],
		// 		//start_url: "index.php",
		// 		//display: "standalone"
		// 	},
		// 	workbox: {
		// 		swDest: path.resolve(__dirname, '../public/dist/threedgarden-sw.js'),
		// 		// directoryIndex: path.resolve(__dirname, '../public/index.php'),
		// 		// directoryIndex: null,
		// 		// navigationPreload: false,
		// 		// exclude: [/\.map$/, /^manifest.*\.js(?:on)?$/, /\.html$/],
		// 		// navigateFallback: '/index.php',
		// 		// templatedURLs: {
		// 		// 	'/scene/mcgee-home-garden/': ['../index.php']
		// 		// }
		// 		// globPatterns: [
		// 		// 	// '*/*.*',
		// 		// 	// '*.*',
		// 		// 	'index.html'
		// 		// ],
		// 	},
		// 	// injectManifest: {
		// 	// 	swDest: path.resolve(__dirname, '../public/dist/threedgarden-sw.js')
		// 	// },
		// }),

    // https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n
    VueI18n({
      runtimeOnly: true,
      compositionOnly: true,
      include: [path.resolve(__dirname, 'locales/**')],
    }),

    // https://github.com/antfu/vite-plugin-inspect
    Inspect({
      // change this to enable inspect for debugging
      enabled: false,
    }),
  ],

  server: {
    fs: {
      strict: true,
    },
  },

	// // https://github.com/antfu/vite-ssg
	// ssgOptions: {
	// 	script: 'async', // 'sync' | 'async' | 'defer' | 'async defer'
	// 	formatting: 'none',  // 'none' | 'minify' | 'prettify'
	// 	// mock: true, // browser window, document, etc.. default false
	// 	// includeAllRoutes: false, // default false
	// 	// includedRoutes(routes) {
	// 	// 	return ['index']
	// 	// }
	// 	// mode: 'production',
	// },

  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      '@vueuse/core',
      '@vueuse/head',
    ],
    exclude: [
      'vue-demi',
    ],
  },

	// https://github.com/vitest-dev/vitest
	test: {
		include: ['test/**/*.test.ts'],
		environment: 'jsdom',
		deps: {
			inline: ['@vue', '@vueuse', 'vue-demi'],
		},
	},

  // config
  // root: 'src',
  // mode: 'development',
  base: process.env.APP_ENV === 'development'
    ? '/wp-content/plugins/threed-garden/public/dist/'
    : '/wp-content/plugins/threed-garden/public/dist/',

  build: {
    // output dir for production build
    outDir: path.resolve(__dirname, '../public/dist'),
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

      plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],

      // input: {
      // 	//main: 'index.html',
      // 	main: path.resolve(__dirname, 'index.html'),
      // 	//main: path.resolve(__dirname, 'index.php'),
      // 	//main: '.',
      // 	//main: 'src/main.ts',
      // 	//a: 'index.html',
      // 	//a: 'src/main.ts',
      // 	//'b/index': path.resolve(__dirname, 'index.html'),
      // 	//b: path.resolve(__dirname, 'index.html'),
      // },

      // make sure to externalize deps that shouldn't be bundled
      // into your library
      //external: ['vue', 'jquery'],

      output: {
        //format: 'cjs', // ('es' | 'cjs' | 'umd' | 'iife')
        name: 'ThreeDGardenBundle',
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
        // Provide global variables to use in the UMD build
        // for externalized deps
        // globals: {
        // 	vue: 'Vue',
        // 	jquery: '$'
        // }
      }

    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
