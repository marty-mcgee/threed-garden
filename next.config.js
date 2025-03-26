// ==============================================================
// ** NEXT.JS 15 BUILD CONFIGURATION FILE

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

// ** MODULE
/** @type {import('next').NextConfig} */
const nextConfig = {
  
  // ** TESTING ONLY
  reactStrictMode: true, // true: causes components to load TWICE in dev only, not active (moot) in production // Recommended true for the `pages` directory, default in `app`.
  
  // ** TESTING ONLY
  // !! WARNING !!
  // Dangerously allow production builds to successfully complete?
  // even if your project has type errors.
  typescript: {
    // ignoreBuildErrors: true,
  },
  eslint: {
    // ignoreDuringBuilds: true,
    ignoreDuringBuilds: ['/src/lib/farmbot']
  },

  // ** TESTING ONLY
  // !! WARNING !!
  async headers() {
    return [
      {
        // matching all API routes
        // source: '/api/:path*',
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: 'https://threed.design/graphql' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ]
      }
    ]
  },

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

    return config
  },

} // end nextConfig

// ** 
module.exports = nextConfig
