import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import vue from '@vitejs/plugin-vue'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 4444,
    strictPort: true,
    hmr: {
      port: 443 // Run the websocket server on the SSL port
    },
    fs: {
      strict: true,
    },
  },

  publicDir: 'public',

  build: {
    // output dir for production build | dist
    outDir: "dist",
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

  plugins: [
    react(),
    vue(),
  ],

  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
      '@': path.resolve(__dirname, 'src'),
    },
  }
})
