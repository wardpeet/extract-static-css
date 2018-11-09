const babel = require('@babel/core');
const path = require('path');
const shouldExtractCss = require('../utils/shouldExtractCss');
const { getOutputDirectory, getOutputFile } = require('../utils/getFilePath');
const extractCssInJsSnippets = require('../extract-css-in-js-engine/extract');
const compileModules = require('./compile-modules');
const promisify = require('util').promisify;
const readFile = promisify(require('fs').readFile);
const writeFile = promisify(require('fs').writeFile);
const mkdirp = promisify(require('mkdirp'));
const extractProperty = 'extracta81a5b4568774a92838fb4da58f872eb';

/** @typedef {import('webpack').compilation.Compilation} Compilation */
/** @typedef {import('webpack').Module} WebpackModule */
/** @typedef {import('webpack').loader.LoaderContext} LoaderContext */

const cache = new Map();

/**
 *
 * @param {string} content
 * @param {Object|null} sourceMap
 * @this {LoaderContext}
 */
module.exports = async function (content, sourceMap) {
  if(this.cacheable) {
    this.cacheable();
  }

  if (!cache.has(this.resourcePath) || !cache.get(this.resourcePath)) {
    return content;
  }

  let transpiledSource;
  try {
    transpiledSource = transpile(content, sourceMap, this.resourcePath, cache.get(this.resourcePath));
  } catch(err) {
    console.log('error', err);
  }

  return this.callback(null, transpiledSource.code, transpiledSource.map);

};

/**
 *
 * @param {string} content
 * @param {Object|null} sourceMap
 * @this {LoaderContext}
 */
module.exports.pitch = async function extractStaticCSSLoader(request) {
  if (cache.has(this.resourcePath)) {
    return;
  }

  const cb = this.async();
  const filename = request.split('!')[request.split('!').length -1];

  const content = (await readFile(filename, 'utf8')).toString();

  if (!shouldExtractCss(content)) {
    cache.set(this.resourcePath, false);
    return cb();
  }

  const outputFilename = getOutputFile(this.resourcePath);

  let cssInJsSnippets = extractCssInJsSnippets(content, extractProperty);
  const cssModules = await compileModules(this, cssInJsSnippets);

  cache.set(this.resourcePath, cssModules);

  await mkdirp(getOutputDirectory());
  await writeFile(outputFilename, cssModules[extractProperty]);


  return cb();
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
