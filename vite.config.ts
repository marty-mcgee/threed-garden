import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// custom middleware
const middleware = () => {
  return {
    name: 'middleware',
    apply: 'serve',
    configureServer(viteDevServer) {
      return () => {
        viteDevServer.middlewares.use(async (req, res, next) => {
          // if (!req.originalUrl.endsWith('.html') && req.originalUrl !== '/') {
          //     req.url = `/templates/` + req.originalUrl + '.html'
          // } else if (req.url === '/index.html') {
          //     req.url = `/templates/` + req.url
          // }

          next()
        });
      }
    }
  }
}

/** 
 * @type { import('vite').UserConfig } 
 * https://vitejs.dev/config/
 */
export default defineConfig({

  root: process.cwd(), // 'src' | 'demo' | default is process.cwd()

  // vite
  server: {
    // host: 'localhost',
    // open: 'localhost:4444/',
    port: 4444,
    strictPort: true,
    hmr: {
      // port: 443 // Run the websocket server on the SSL port
    },
    fs: {
      strict: true,
      // Allow serving files from one level up to the project root
      // allow: ['..']
    },
  },

  // vite:preview
  preview: {
    // host: 'localhost',
    // open: '/demo',
    // open: 'localhost:4488/',
    port: 4488,
    // strictPort: true
  },

  // .env variable prefix
  envPrefix: 'THREED_',

  // always include these public assets
  publicDir: 'public',

  assetsInclude: [
    // '**/*.html', // not needed/already working
    '**/*.gltf'
  ],

  build: {
    // output dir for production build | dist
    outDir: 'dist',
    emptyOutDir: true,

    // server side rendering ??
    // ssr: true,

    // emit manifest so PHP can find the hashed files
    manifest: true,

    // lib: {
    // 	entry: resolve(__dirname, 'src/main.ts'),
    // 	name: 'threedgarden-sw',
    // 	formats: ['es'],
    // 	fileName: (format) => `my-lib.${format}.js`
    // },

    // ignored when using output.assetFileNames
    // assetsDir: './assets/', 

    cssCodeSplit: false,
    minify: false,

    rollupOptions: {

      // plugins: [inject({ Buffer: ['buffer', 'Buffer'] })],

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
      // external: ['vue', 'jquery'],

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

  plugins: [
    // middleware(),
    react(),
    vue(),
  ],

  // auto-inject react ?? not needed
  // esbuild: {
  //   jsxInject: `import React from 'react'`
  // },

  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src'),
      // '/demo': path.resolve(__dirname, 'public/demo/index.html') // process.cwd()
    },
  }

})
