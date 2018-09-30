const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');
const LimitChunkCountPlugin = require('webpack/lib/optimize/LimitChunkCountPlugin');
const VirtualModulePlugin = require('virtual-module-webpack-plugin');

/** @typedef {import('../../typings/cssInJsExpression').CssInJsExpressions} CssInJsExpressions */
/** @typedef {import('webpack').loader.LoaderContext} LoaderContext */
/** @typedef {import('webpack').Compiler} Compiler */
/** @typedef {import('webpack').compilation.Compilation} Compilation */

const NAME = 'ExtractCssInJs';

/**
 * @param {LoaderContext} loader
 * @param {Array<String>} entryModules
 */
module.exports = function(loader, entryModules) {
  const request = loader.request;
  var childFilename = 'css-in-js-output-filename';
  var outputOptions = { filename: childFilename };
  /** @type {Compiler} */
  var childCompiler = getRootCompilation(loader).createChildCompiler('css-in-js-compiler', outputOptions);
  const loaders = loader.loaders.slice(loader.loaderIndex + 1).reduce(function(acc, loader) {
    acc.push(loader.request);
    return acc;
  }, []);

  childCompiler.apply(new NodeTemplatePlugin(outputOptions));
  childCompiler.apply(new LibraryTemplatePlugin(null, 'commonjs2'));
  childCompiler.apply(new NodeTargetPlugin());
  childCompiler.apply(new SingleEntryPlugin(loader.context, '!!' + loaders.join('!') + './css-in-js-compiler.js'));
  childCompiler.apply(new LimitChunkCountPlugin({ maxChunks: 1 }));
  childCompiler.apply(new VirtualModulePlugin({
    moduleName: 'src/components/css-in-js-compiler.js',
    contents: entryModules
  }));

  childCompiler.hooks.compilation.tap(NAME, compilation => {
    if(compilation.cache) {
      const subCache = 'subcache ' + __dirname + ' ' + request;
      if(!compilation.cache[subCache]) {
          compilation.cache[subCache] = {};
      }

      compilation.cache = compilation.cache[subCache];
    }

    // We set loaderContext[__dirname] = false to indicate we already in
    // a child compiler so we don't spawn another child compilers from there.
    compilation.hooks.normalModuleLoader.tap(NAME, loaderContext => {
        loaderContext[__dirname] = false;
    });
  });

  /** @type {string} */
  let source;
  childCompiler.hooks.afterCompile.tapAsync(NAME, (compilation, callback) => {
    source = compilation.assets[childFilename] && compilation.assets[childFilename].source();

    // Remove all chunk assets
    compilation.chunks.forEach(function(chunk) {
        chunk.files.forEach(file => {
            delete compilation.assets[file];
        });
    });

    callback();
  });

  return new Promise((resolve, reject) => {
    childCompiler.runAsChild(function(err, entries, compilation) {
      if (err) {
        return reject(err);
      }

      if(compilation.errors.length > 0) {
          return reject(compilation.errors[0]);
      }
      if (!source) {
          return reject(new Error("Didn't get a result from child compiler"));
      }

      compilation.fileDependencies.forEach(function(dep) {
          loader.addDependency(dep);
      }, loader);

      compilation.contextDependencies.forEach(function(dep) {
          loader.addContextDependency(dep);
      }, loader);

      let result;
      try {
        result = loader.exec(source, request);
        if (result.default && typeof result.default === 'object') {
          result = result.default;
        }
      } catch(e) {
          return reject(e);
      }

      if (!result) {
        return reject(`We couldn't retrieve any css-in-js results`);
      }

      resolve(result);
    });
  });
}


/**
 * @param {LoaderContext} loader
 * @return {Compilation}
 */
function getRootCompilation(loader) {
  var compiler = loader._compiler;
  var compilation = loader._compilation;
  while (compiler.parentCompilation) {
    compilation = compiler.parentCompilation;
    compiler = compilation.compiler;
  }

  return compilation;
}
