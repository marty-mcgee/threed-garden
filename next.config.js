// =================================================================
// ** Required Variables from .env

if (!process.env) {
  // throw new Error(`
  console.log(`
    Please create a .env local file.
  `)
} else {
  console.log("process.env=", process.env)
}
if (!process.env?.THREED_WP_GRAPHQL_API_URL) {
  // throw new Error(`
  console.log(`
    Please provide a valid WordPress instance URL.
    Add to your environment variables THREED_WP_GRAPHQL_API_URL.
  `)
} else {
  console.log("process.env.THREED_WP_GRAPHQL_API_URL=", process.env.THREED_WP_GRAPHQL_API_URL)
}

// =================================================================

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const withPWA = require('next-pwa')
const runtimeCaching = require('next-pwa/cache')

// const path = require('path')

// =================================================================

/**
 * @type {import("next").NextConfig}
 */
const nextConfig = {

  // use SWC minify instead of Terser (7x faster)
  swcMinify: true,

  // do not use this in dev or prod
  reactStrictMode: false,

  webpack(config, { isServer }) {
    // audio support
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      exclude: config.exclude,
      use: [
        {
          loader: require.resolve('url-loader'),
          options: {
            limit: config.inlineImageLimit,
            fallback: require.resolve('file-loader'),
            publicPath: `${config.assetPrefix}/_next/static/images/`,
            outputPath: `${isServer ? '../' : ''}static/images/`,
            name: '[name]-[hash].[ext]',
            esModule: config.esModule || false,
          },
        },
      ],
    })

    // shader support (NOT WORKING ??)
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ['raw-loader', 'glslify-loader'],
    })

    // config.module.rules.push({
    //   test: /\.(glsl|vs|fs|vert|frag)$/,
    //   loader: 'webpack-glsl'
    // })
    // config.module.rules.push({
    //   test: /\.(frag|vert)$/,
    //   type: 'asset/source'
    // })

    // config.resolve.alias = {
    //   // Templates: path.resolve(__dirname, 'templates/'),
    //   // Components: path.resolve(__dirname, 'components/'),
    //   '~/*': path.resolve(__dirname, 'src/*'),
    //   '@/*': path.resolve(__dirname, 'src/*')
    // }

    // config.cache = false
    // config.resolve.alias['~/'] = path.join(___dirname, 'src/')
    // config.resolve.alias['@/'] = path.join(___dirname, 'src/')

    return config
  },
}

// manage i18n
if (process.env.EXPORT !== 'true') {
  nextConfig.i18n = {
    locales: ['en-US'],
    defaultLocale: 'en-US',
  }
}

module.exports = (_phase, { defaultConfig }) => {
  const plugins = [
    [
      withPWA,
      {
        pwa: {
          dest: 'public',
          disable: process.env.NODE_ENV === 'development',
          runtimeCaching,
        },
      },
    ],
    [withBundleAnalyzer, {}],
  ]

  return plugins.reduce(
    (acc, [plugin, config]) => plugin({ ...acc, ...config }),
    {
      ...defaultConfig,
      ...nextConfig,
    }
  )
}
