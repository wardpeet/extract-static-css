const { declare } = require('@babel/helper-plugin-utils');
const t = require('@babel/types');
const { addSideEffect } = require('@babel/helper-module-imports');
const { getOutputFile } = require('../utils/getFilePath');
const { default: generate } = require('@babel/generator');

/** @typedef {import('@babel/core')} Babel */
/** @typedef {import('@babel/traverse').NodePath<t.TaggedTemplateExpression>} TaggedTemplateExpressionNodePath */
/** @typedef {import('@babel/traverse').NodePath<t.ImportDeclaration>} ImportDeclarationNodePath */

module.exports = declare(api => {
  api.assertVersion(7);

  return {
    visitor: {
      Program: (path, opts) => {
        // inject our css stylesheet
        addSideEffect(path, getOutputFile(opts.filename));
      },

      /**
       * @param {ImportDeclarationNodePath} path
       */
      ImportDeclaration: path => {
        if (path.node.source.value === 'emotion') {
         path.remove();
        }
      },
      /**
       *
       * @param {TaggedTemplateExpressionNodePath} path
       */
      TaggedTemplateExpression: (path, state) => {
        const variableName = path.parentPath.node.id.name;
        path.replaceWith(t.stringLiteral(state.opts.overrides[variableName].classname));
      }
    },
  };
});
