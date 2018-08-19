/**
 * Does the source have an import statement from our library
 *
 * @param {string} source
 * @return {boolean}
 */
function shouldExtractCss(source) {
  return (
    /import .+ from ['"]emotion['"]/g.test(source) || /require\(['"]emotion['"]\)/g.test(source)
  );
}

module.exports = shouldExtractCss;
