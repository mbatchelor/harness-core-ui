/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

const path = require('path')
const fs = require('fs')

const webpack = require('webpack')
const { merge } = require('webpack-merge')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const JSONGeneratorPlugin = require('@harness/jarvis/lib/webpack/json-generator-plugin').default
const { BugsnagSourceMapUploaderPlugin } = require('webpack-bugsnag-plugins')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CircularDependencyPlugin = require('circular-dependency-plugin')

const commonConfig = require('./webpack.common')
const packageJson = require('../package.json')
const CONTEXT = process.cwd()

// this BUGSNAG_TOKEN needs to be same which is passed in the docker file
const BUGSNAG_TOKEN = process.env.BUGSNAG_TOKEN
const BUGSNAG_SOURCEMAPS_UPLOAD = process.env.BUGSNAG_SOURCEMAPS_UPLOAD === 'true'
const harnessPackages = Object.keys(packageJson.dependencies)
  .filter(name => name.startsWith('@harness'))
  .reduce((accumulator, current) => ({ ...accumulator, [current]: require(`${current}/package.json`).version }), {})

const versionContent = {
  version: packageJson.version,
  gitCommit: process.env.GIT_COMMIT,
  gitBranch: process.env.GIT_BRANCH,
  ...harnessPackages
}

console.table(versionContent)

const config = {
  mode: 'production',
  devtool: 'hidden-source-map',
  output: {
    path: path.resolve(CONTEXT, 'dist/static'),
    filename: '[name].[contenthash:6].js',
    chunkFilename: '[name].[id].[contenthash:6].js',
    pathinfo: false,
    assetModuleFilename: 'images/[hash:6][ext][query]'
  },
  plugins: [
    new webpack.DefinePlugin({
      __DEV__: false,
      __BUGSNAG_RELEASE_VERSION__: JSON.stringify(packageJson.version),
      HARNESS_ENABLE_NG_AUTH_UI: false
    }),
    new HTMLWebpackPlugin({
      template: 'src/index.html',
      filename: '../index.html',
      minify: false,
      templateParameters: {
        __DEV__: false,
        __NON_CDN_BASE_PATH__: 'static/'
      }
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:6].css',
      chunkFilename: '[name].[id].[contenthash:6].css'
    }),
    new JSONGeneratorPlugin({
      content: versionContent,
      filename: 'version.json'
    }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true
    }),
    new HTMLWebpackPlugin({
      template: 'src/versions.html',
      filename: 'versions.html',
      minify: false,
      inject: false
    })
  ]
}

if (BUGSNAG_SOURCEMAPS_UPLOAD && BUGSNAG_TOKEN) {
  config.plugins.push(
    new BugsnagSourceMapUploaderPlugin({
      apiKey: BUGSNAG_TOKEN,
      appVersion: packageJson.version,
      publicPath: '*',
      overwrite: true
    })
  )
}

module.exports = merge(commonConfig, config)
