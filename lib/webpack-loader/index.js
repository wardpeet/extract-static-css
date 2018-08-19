const babel = require('@babel/core');
const shouldExtractCss = require('../utils/shouldExtractCss');

/** @typedef {import('webpack').loader.LoaderContext} WebpackLoaderContext */

/**
 *
 * @param {string} content
 * @param {Object|null} sourceMap
 * @this {WebpackLoaderContext}
 */
function extractStaticCSSLoader(content, sourceMap) {
  const callback = this.async();

  if (shouldExtractCss(content)) {
    const result = transpile(content, sourceMap, this.resourcePath);
    if (result && result.code) {
      content = result.code;
      // console.log(content);
    }
  }

  if (callback) {
    callback(null, content, sourceMap);
  }
}

/**
 *
 * @param {string} source
 * @param {Object|null} sourceMap
 * @param {string} filename
 */
function transpile(source, sourceMap, filename) {
  return babel.transform(source, {
    filename,
    sourceMaps: true,
    inputSourceMap: sourceMap,
    presets: ['@babel/preset-react'],
    plugins: [[require.resolve('../babel-plugin/index.js'), {}]],
    babelrc: false,
    parserOpts: {
      plugins: ['jsx'],
    },
  });
}

module.exports = extractStaticCSSLoader;
