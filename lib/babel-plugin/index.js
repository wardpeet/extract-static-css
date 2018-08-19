const { declare } = require('@babel/helper-plugin-utils');
const { default: generate } = require('@babel/generator');
const t = require('@babel/types');
const requireFromString = require('require-from-string');

/** @typedef {import('@babel/core')} Babel */
/** @typedef {import('@babel/traverse').NodePath<t.TaggedTemplateExpression>} TaggedTemplateExpressionNodePath */
/** @typedef {import('@babel/traverse').NodePath<t.ImportDeclaration>} ImportDeclarationNodePath */

module.exports = declare(api => {
  api.assertVersion(7);

  return {
    visitor: {
      /**
       * @param {ImportDeclarationNodePath} path
       */
      ImportDeclaration: path => {
        if (path.node.source.value === 'emotion') {
          path.replaceWith(t.importDeclaration([], t.stringLiteral('./button.css')));
        }
      },
      /**
       *
       * @param {TaggedTemplateExpressionNodePath} path
       */
      TaggedTemplateExpression: path => {
        const templateExpression = generate(path.node.quasi).code;
        /** @type {Array<string>} */
        const identifiers = [];

        path.node.quasi.expressions.forEach(exp => {
          if (t.isIdentifier(exp)) {
            const binding = path.scope.getBinding(exp.name);

            if (binding) {
              identifiers.push(generate(binding.path.parent).code);
            }
          }
        });

        const code = `
          const {css} = require('emotion');
          ${identifiers.join('\n')}
          const expression = ${templateExpression};

          module.exports = {
            className: css\`\${expression}\`,
            expression: expression,
          };
        `;

        const generatedModule = requireFromString(code);
        path.replaceWith(t.stringLiteral(generatedModule.className));
      },
    },
  };
});
