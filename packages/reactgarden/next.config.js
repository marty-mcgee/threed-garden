if (!process.env.WP_GRAPHQL_API_URL) {
  throw new Error(`
    Please provide a valid WordPress instance URL.
    Add to your environment variables WP_GRAPHQL_API_URL.
  `)
}

const withTM = require("next-transpile-modules")([
  "@babel/preset-react",
  "@fullcalendar/common",
  "@fullcalendar/daygrid",
  "@fullcalendar/interaction",
  "@fullcalendar/react",
  "@fullcalendar/timegrid",
  "react-github-btn",
])

const { PHASE_DEVELOPMENT_SERVER } = require("next/constants")

console.log("PHASE_DEVELOPMENT_SERVER", PHASE_DEVELOPMENT_SERVER)

// if (phase === PHASE_DEVELOPMENT_SERVER) {
//     return {
//       /* development only config options here */
//       env: {
//         customKey: "my-value",
//       },
//     }
//   }
// }

/**
 * @type {import("next").NextConfig}
 */
const nextConfig = {
  /* nextjs config options here */
  env: {
    customKey: process.env.HEY_HEY_HEY, // "HEY HEY HEY" | process.env.HEY_HEY_HEY
  },
  images: {
    domains: [
      process.env.WP_GRAPHQL_API_URL.match(/(?!(w+)\.)\w*(?:\w+\.)+\w+/)[0], // Valid WP Image domain.
      "0.gravatar.com",
      "1.gravatar.com",
      "2.gravatar.com",
      "secure.gravatar.com",
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboards/analytics",
        permanent: true,
      },
    ]
  },
  reactStrictMode: true,
}

module.exports = withTM(nextConfig)

// NEXT 12
// const { PHASE_DEVELOPMENT_SERVER } = require("next/constants")

// module.exports = (phase, { defaultConfig }) => {
//   if (phase === PHASE_DEVELOPMENT_SERVER) {
//     return {
//       /* development only config options here */
//       env: {
//         customKey: "my-value",
//       },
//     }
//   }

//   return {
//     /* config options for all phases except development here */
//       env: {
//         customKey: "my-value-2",
//       },
//   }
// }

// MINIMUM REQUIRED
// module.exports = {
//   /* config options here */
// }

// NEXT 10
// const withPlugins = require("next-compose-plugins");
// const withImages = require("next-images");
// const withSass = require("@zeit/next-sass");
// const withCSS = require("@zeit/next-css");
// const webpack = require("webpack");
// const path = require("path");

// module.exports = withPlugins([[withSass], [withImages], [withCSS]], {
//   webpack(config, options) {
//     config.resolve.modules.push(path.resolve("./"));
//     return config;
//   },
// });
