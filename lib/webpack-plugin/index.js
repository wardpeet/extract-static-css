const babel = require('@babel/core');
const shouldExtractCss = require('../utils/shouldExtractCss');
const extractCssInJsSnippets = require('../extract-css-in-js-engine/extract');
const compileModules = require('./compile-modules');
const VirtualModulePlugin = require('virtual-module-webpack-plugin');


/** @typedef {import('webpack').compilation.Compilation} Compilation */
/** @typedef {import('webpack').Module} WebpackModule */
/** @typedef {import('webpack').loader.LoaderContext} LoaderContext */

/**
 *
 * @param {string} content
 * @param {Object|null} sourceMap
 * @this {LoaderContext}
 */
async function extractStaticCSSLoader(content, sourceMap) {
  const cb = this.async();

  if (!shouldExtractCss(content)) {
    return cb(null, content, sourceMap);
  }

  const cssInJsSnippets = extractCssInJsSnippets(content, sourceMap);
  const cssModules = await compileModules(this, cssInJsSnippets);
  const filename = this.request.split('!')[this.request.split('!').length -1];

  // Object.keys(cssModules).map(varName => {
  //   const cssModule = cssModules[varName];

  //   return `.${cssModule.classname}{${cssModule.result}}`;
  // }).join('')

  let transpiledSource;
  try {
    transpiledSource = transpile(content, sourceMap, filename, cssModules);
  } catch(err) {
    debugger;
  }

  return cb(null, transpiledSource.code, transpiledSource.map);
}

/**
 *
 * @param {string} source
 * @param {Object|null} sourceMap
 * @param {string} filename
 * @return {babel.BabelFileResult|null}
 */
function transpile(source, sourceMap, filename, cssModules) {
  return babel.transform(source, {
    filename,
    sourceMaps: true,
    inputSourceMap: sourceMap,
    presets: ['@babel/preset-react'],
    plugins: [[require.resolve('../babel-plugin/index.js'), { overrides: cssModules }]],
    babelrc: false,
    parserOpts: {
      plugins: ['jsx'],
    },
  });
}

module.exports = extractStaticCSSLoader;
