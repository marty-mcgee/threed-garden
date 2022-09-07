// =================================================================
// ** Required Variables from .env

if (!process.env) {
  // throw new Error(`
  console.log(`
    Please create a .env local file.
  `)
} else {
  // console.log("process.env=", process.env)
}
if (!process.env?.THREED_WP_GRAPHQL_API_URL) {
  // throw new Error(`
  console.log(`
    Please provide a valid WordPress instance URL.
    Add to your environment variables THREED_WP_GRAPHQL_API_URL.
  `)
} else {
  // console.log("THREED_WP_GRAPHQL_API_URL=", process.env.THREED_WP_GRAPHQL_API_URL)
}

// =================================================================

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
const withPWA = require('next-pwa')
const runtimeCaching = require('next-pwa/cache')

const withTM = require("next-transpile-modules")([
  "three"
])

const path = require('path')

const { PHASE_DEVELOPMENT_SERVER } = require("next/constants")

// console.log("PHASE_DEVELOPMENT_SERVER", PHASE_DEVELOPMENT_SERVER)

// if (phase === PHASE_DEVELOPMENT_SERVER) {
//     return {
//       /* development only config options here */
//       env: {
//         customKey: "my-value",
//       },
//     }
//   }
// }

// =================================================================

/**
 * @type {import("next").NextConfig}
 */
const nextConfig = {

  env: {
    threedKey: process.env.THREED_KEY,
    threedKey2: process.env.THREED_KEY,
    threedKey3: process.env.THREED_KEY,
  },

  images: {
    domains: [
      process.env.THREED_WP_GRAPHQL_API_URL.match(/(?!(w+)\.)\w*(?:\w+\.)+\w+/)[0], // Valid WP Image domain.
      "0.gravatar.com",
      "1.gravatar.com",
      "2.gravatar.com",
      "secure.gravatar.com",
    ],
  },

  // async redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "/demo/",
  //       permanent: true,
  //     },
  //   ]
  // },

  trailingSlash: true,

  experimental: {
    esmExternals: false,
    // jsconfigPaths: true, // enables it for both jsconfig.json and tsconfig.json
    images: {
      allowFutureImage: true
    }
  },

  // use SWC minify instead of Terser (7x faster)
  swcMinify: true,

  // do not use this in dev. disabled by default in prod
  // true causes components to load TWICE in dev
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

    // eslint-disable-next-line no-param-reassign
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision')
    // }

    return config
  },
}

// manage i18n
if (process.env.THREED_I18N !== 'true') {
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
    [withTM, {}],
  ]

  return plugins.reduce(
    (acc, [plugin, config]) => plugin({ ...acc, ...config }),
    {
      ...defaultConfig,
      ...nextConfig,
    }
  )
}
