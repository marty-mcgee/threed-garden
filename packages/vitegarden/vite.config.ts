import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/],
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8888,
  },

  // [MM] config (from ViteSpa)

  // root: 'src',
  // mode: 'development',
  // base: process.env.APP_ENV === 'development'
  //   ? '/wp-content/plugins/threed-garden/public/dist/'
  //   : '/wp-content/plugins/threed-garden/public/dist/',

  build: {
    // output dir for production build
    // outDir: path.resolve(__dirname, '../public/dist'),
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
        name: "vitegarden",
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
        // Provide global variables to use in the UMD build
        // for externalized deps
        // globals: {
        // 	vue: 'Vue',
        // 	jquery: '$'
        // }
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
