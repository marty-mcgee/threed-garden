/** VUE CONFIG */
module.exports = {
    // pages: {
    //     index: {
    //         // entry for the page
    //         //entry: 'public/js/threed-garden-public.js',
    //         entry: 'src/main.js',
    //         // the source template
    //         //template: 'public/index.html',
    //         // output as dist/index.html
    //         //filename: 'index.html',
    //         // when using title option,
    //         // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
    //         title: 'THREED GARDEN PLUGIN',
    //         // chunks to include on this page, by default includes
    //         // extracted common chunks and vendor chunks.
    //         chunks: ['chunk-vendors', 'chunk-common', 'index']
    //     },
    //     // when using the entry-only string format,
    //     // template is inferred to be `public/subpage.html`
    //     // and falls back to `public/index.html` if not found.
    //     // Output filename is inferred to be `subpage.html`.
    //     //subpage: 'src/subpage/main.js'
    // },

    //publicPath: '/', // default
    publicPath: '/wp-content/plugins/threed-garden/public/dist/',
    //publicPath: '#',

    outputDir: 'public/dist',
    
    filenameHashing: false,

    runtimeCompiler: true, // templates (+10kb)

    chainWebpack: config => {
        config.plugins.delete('html');
        config.plugins.delete('preload');
        config.plugins.delete('prefetch');
    },

    devServer: {
        host: 'garden.university.local',
        hot: false,
        writeToDisk: true,
    },

    css: {
        extract: true,
    },
}
/** */