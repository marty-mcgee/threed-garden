require("dotenv").config();

const webpack = require("webpack");
const path = require("path");
const Dotenv = require("dotenv-webpack");

const withPlugins = require("next-compose-plugins");
const withCSS = require("@zeit/next-css");
const optimizedImages = require("next-optimized-images");

// const [username, repository] = require('./package.json').repository.split('/');

module.exports = withPlugins(
  [
    [
      withCSS,
      {
        cssLoaderOptions: {
          url: false,
        },
      },
    ],
    [optimizedImages],
  ],
  {
    webpack: (config) => {
      config.plugins = config.plugins || [];

      config.plugins = [
        ...config.plugins,

        new Dotenv({
          path: path.join(__dirname, ".env"),
          systemvars: true,
        }),

        new webpack.IgnorePlugin(/\.flow$/),
      ];

      return config;
    },
    assetPrefix: process.env.PATH_PREFIX ? `/${PATH_PREFIX}` : "",
  }
);
