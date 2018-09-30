const { declare } = require('@babel/helper-plugin-utils');
const t = require('@babel/types');
const { addSideEffect } = require('@babel/helper-module-imports');

/** @typedef {import('@babel/core')} Babel */
/** @typedef {import('@babel/traverse').NodePath<t.TaggedTemplateExpression>} TaggedTemplateExpressionNodePath */
/** @typedef {import('@babel/traverse').NodePath<t.ImportDeclaration>} ImportDeclarationNodePath */

module.exports = declare(api => {
  api.assertVersion(7);

  return {
    visitor: {
      Program: path => {
        // inject our extraction js
        addSideEffect(path, './Button.css');
      },

      /**
       * @param {ImportDeclarationNodePath} path
       */
      ImportDeclaration: path => {
        /*if (path.node.source.value === 'emotion') {
         path.replaceWith(t.importDeclaration([], t.stringLiteral('./Button.css')));
        }*/
      },
      /**
       *
       * @param {TaggedTemplateExpressionNodePath} path
       */
      /*TaggedTemplateExpression: (path, state) => {
      }*/
    },
  };
});
