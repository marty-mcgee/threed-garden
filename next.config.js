// ==============================================================
// ** NEXT.JS 14 BUILD CONFIGURATION FILE

if (!process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL) {
  throw new Error(`
    Please provide a valid WordPress API URL for ThreeD.
    Hint: Add your .environment variable NEXT_PUBLIC_WP_GRAPHQL_API_URL=
  `)
}

// // import path from 'path'
// // import { resolve } from 'path'
// const path = require('path')
// const __dirname = path.resolve()

// [MM] HEY HEY HEY 5/21/2024 == hide old.. 
// ==== use new next.config.js from REACT-THREE-NEXT example app
// module.exports = nextConfig

// // ** WITH BUNDLE ANALYZER
// const withBundleAnalyzer = require('@next/bundle-analyzer')({
//   enabled: false, // process.env.ANALYZE === 'true',
// })

// // ** WITH NEXT-PWA
// /* A fork of 'next-pwa' that has app directory support
// ** @see https://github.com/shadowwalker/next-pwa/issues/424#issuecomment-1332258575
// */
// const withPWA = require('@ducanh2912/next-pwa').default({
//   dest: 'public',
//   disable: true, // process.env.NODE_ENV === 'development',
// })

// ** MODULE
/** @type {import('next').NextConfig} */
const nextConfig = {

  // // ** use the following snippet if using styled components
  // compiler: {
  //   styledComponents: true,
  // },
  
  reactStrictMode: false, // true: causes components to load TWICE in dev only, not active (moot) in production // Recommended true for the `pages` directory, default in `app`.

  // trailingSlash: false, // true: add a '/' to the final url address -- can cause url-based query string issues

  // experimental: {
  //   // use Next 13 '/app' directory:
  //   appDir: true, // true for Next 13 | false for Next 12

  //   esmExternals: true, // helps with 3rd party modules trying to call non-module js
  //   // externalDir: true, // helps import file loader type for ErrorFallback.tsx boundary
  //   // serverComponentsExternalPackages: ['axios', 'yup', 'prisma', 'tailwindcss'],
  //   // serverComponentsExternalPackages: ['axios'],

  //   swcFileReading: true, // rust for the web -- 'speedy web compiler' https://swc.rs
  // },

  // https://github.com/vercel/next.js/issues/36221
  // swcMinify: true, // true throws error at ErrorBoundary

  // transpilePackages: [
    // ** (ORDER DOES NOT MATTER)

    // '@radix-ui/themes',
    // 'react-dom',

    // 'three',

    // 'axios',
    // 'axios-mock-adapter',

    // 'yup',
    // '@hookform/resolvers',

    // '@fullcalendar/common',
    // '@fullcalendar/daygrid',
    // '@fullcalendar/interaction',
    // '@fullcalendar/react',
    // '@fullcalendar/timegrid',

    // 'react-github-btn',
  // ],

  async headers() {
    return [
      {
        // matching all API routes
        // source: '/api/:path*',
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://threed.design/graphql' }, // replace this your actual origin
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ]
      }
    ]
  },

  // productionBrowserSourceMaps: true,

  // compiler: {
  //   emotion: true,
  // },

  // [MM] ONLY USE THE NEXT /PAGES THAT YU WAN>
  // https://stackoverflow.com/questions/65598753/cant-build-react-next-project-found-page-without-a-react-component-as-default
  // pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],

  // ** IMAGES (production use?)
  images: {
    
    // domains: [
    //   process.env.NEXT_PUBLIC_WP_GRAPHQL_API_URL.match(/(?!(w+)\.)\w*(?:\w+\.)+\w+/)[0], 
    // Valid WP Image domain.
    //   '0.gravatar.com',
    //   '1.gravatar.com',
    //   '2.gravatar.com',
    //   'secure.gravatar.com',
    //   'images.cdndomain.com',
    // ],
    remotePatterns: [
      // {
      //   protocol: 'http',
      //   hostname: '**',
      //   // port: '7777',
      //   // pathname: '/**',
      // },
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '443',
        pathname: '/threedpublic/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**'
      },
      {
        protocol: 'https',
        hostname: 'vercel.com',
        port: '',
        pathname: '**'
      },
    ],
    // loader: 'default',
    // // path: 'https://somedomain.com/mydirectory/',
    // // deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // // imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    // // minimumCacheTTL: 60,
    disableStaticImages: true, // for avif image files to work properly
    // dangerouslyAllowSVG: true,
    // contentSecurityPolicy: 'default-src 'self'; script-src 'none'; sandbox;',
  },

  // ** REDIRECTS
  async redirects() {
    return [
      // {
      //   source: '/',
      //   destination: '/home',
      //   destination: '/participate',
      //   // destination: '/dashboards/sales',
      //   permanent: false,
      // },
      {
        source: "/github",
        destination: "https://github.com/marty-mcgee/threed-garden",
        permanent: false,
      },
    ]
  },

  // ** WEBPACK
  webpack(config, { isServer }) {
    
    // sharp support
    if (!isServer) {
      // We're in the browser build, so we can safely exclude the sharp module
      config.externals.push('sharp')
    }

    // paper.js support
    if (isServer) {
      config.resolve.alias['paper'] = false
    }

    // // next webpack ignore stuff
    // config.module.rules.push({
    //   test: /src\/app\/ai/,
    //   loader: 'ignore-loader',
    // });

    // shader support
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      // use: ['raw-loader', 'glslify-loader'],
      use: ['glslify-loader'],
    })

    // avif support
    config.module.rules.push({
      test: /\.avif/,
      // include: [/public/],
      exclude: /node_modules/,
      type: 'asset/resource',
      // generator: {
      //   // outputPath: '/public',
      //   outputPath: '../[path]',
      //   // publicPath: '/public',
      //   publicPath: '[path]',
      //   filename: '[name][ext]',
      //   // filename: '../[path]/[name][ext]',
      //   // filename: 'static/chunks/[path]/[name][ext]'
      // },
    })
    
    // ttf support
    config.module.rules.push({
      test: /\.ttf/,
      // include: [/public/],
      exclude: /node_modules/,
      type: 'asset/resource',
    })

    // svg support
    config.module.rules.push({
      test: /\.svg/,
      // include: [/public/],
      exclude: /node_modules/,
      type: 'asset/resource',
    })

    // glb + gltf support
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      // include: [/public/],
      exclude: /node_modules/,
      type: 'asset/resource',
    })
    
    // graphql + gql support
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      include: [/api/],
      exclude: /node_modules/,
      use: [
        {
          loader: 'graphql-tag/loader',
        },
      ],
    })

    // audio support
    config.module.rules.push({
      test: /\.(ogg|mp3|wav|mpe?g)$/i,
      exclude: config.exclude,
      type: 'asset/resource',
      // use: [
      //   {
      //     loader: require.resolve('url-loader'),
      //     options: {
      //       limit: config.inlineImageLimit,
      //       fallback: require.resolve('file-loader'),
      //       publicPath: `${config.assetPrefix}/_next/static/images/`,
      //       outputPath: `${isServer ? '../' : ''}static/images/`,
      //       name: '[name]-[hash].[ext]',
      //       esModule: config.esModule || false,
      //     },
      //   },
      // ],
    })

    // // aliases
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   apexcharts: path.resolve(__dirname, './node_modules/apexcharts-clevision'),
    //   // 'eth-hooks': path.resolve(__dirname, './node_modules/eth-hooks'),
    //   // 'eth-components': path.resolve(__dirname, './node_modules/eth-components'),
    //   // 'react': path.resolve(__dirname, './node_modules/react'),
    //   // 'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    // }

    // doesn't work, but the thought is there
    // config.plugin('@typescript-eslint')
    //   .tap(args => {
    //     args[0].emitWarning = false
    //     args[0].emitError = false
    //     args[0].failOnWarning = false
    //     args[0].failOnError = false
    //     return args
    //   })

    // config.node = {
    //   fs: 'empty',
    // }

    return config
  },

  // ENV VARIABLES ?? :)
  // instead, use .env.local to safely load env variables as needed (NEXT_PUBLIC_)
  // env: {
  //   customKey: process.env.HEY_HEY_HEY, // 'HEY HEY HEY' | process.env.HEY_HEY_HEY
  // },

} // end nextConfig

// ** WITHOUT NEXT-PWA
module.exports = nextConfig

// // ** WITH NEXT-PWA
// yarn install "@ducanh2912/next-pwa": "^10.2.7",
// const KEYS_TO_OMIT = ['webpackDevMiddleware', 'configOrigin', 'target', 'analyticsId', 'webpack5', 'amp', 'assetPrefix']
// // ** EXPORT MODULE
// module.exports = (_phase, { defaultConfig }) => {
//   const plugins = [[withPWA], [withBundleAnalyzer, {}]]

//   const wConfig = plugins.reduce((acc, [plugin, config]) => plugin({ ...acc, ...config }), {
//     ...defaultConfig,
//     ...nextConfig,
//   })

//   const finalConfig = {}
//   Object.keys(wConfig).forEach((key) => {
//     if (!KEYS_TO_OMIT.includes(key)) {
//       finalConfig[key] = wConfig[key]
//     }
//   })

//   return finalConfig
// }
