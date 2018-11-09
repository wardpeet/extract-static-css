
const { parse } = require('@babel/parser');
const {default: traverse} = require('@babel/traverse');
const { default: generate } = require('@babel/generator');
const t = require('@babel/types');
const { addDefault, addNamed } = require('@babel/helper-module-imports');

/** @typedef {import('@babel/traverse').NodePath<t.TaggedTemplateExpression>} TaggedTemplateExpressionNodePath */
/** @typedef {import('@babel/traverse').Scope} Scope */
/** @typedef {import('@babel/traverse').Binding} Binding */
/** @typedef {import('../../typings/cssInJsExpression').CssInJsExpression} CssInJsExpression */

/**
 *
 * @param {string} code
 */
module.exports = function(code, extractProperty) {
  const ast = parse(code, {
    plugins: ['jsx'],
    sourceType: "module"
  });

  if (!ast) {
    return [];
  }

  // add one line to our file to make room for our import
  const fileAsString = new Array(ast.loc.end.line + 2);
  fileAsString[1] = `import { caches } from 'emotion'`;

  traverse(ast, {
    Program: path => {
      // inject our extraction js
      addDefault(path, 'extract-static-css/lib/extract-css-in-js-engine/test', { nameHint: "extract" });
    },
    /**
     * @param {TaggedTemplateExpressionNodePath} path
     */
    TaggedTemplateExpression: path => {
      /** @type {Array<Binding|null>} */
      const dependencyBindings = [
        getBinding(path.node.tag, path.scope)
      ];

      path.node.quasi.expressions.forEach(exp => {
        dependencyBindings.push(getBinding(exp, path.scope))
      });

      dependencyBindings.filter(dep => dep !== null).forEach(binding => {
        if (fileAsString[binding.identifier.loc.start.line]) {
          return;
        }

        fileAsString[binding.identifier.loc.start.line] = generate(binding.path.parent).code;
      });

      const grandParent = path.parentPath.parentPath;
      let templateLiteral = `export ${generate(grandParent.node).code}`;
      path.replaceWith(t.callExpression(t.identifier("_extract"), [path.node.tag, path.node.quasi]));
      templateLiteral = `export ${generate(grandParent.node).code}`;
      fileAsString[0] = `import _extract from '../../../../lib/extract-css-in-js-engine/test'`;
      fileAsString[grandParent.node.loc.start.line] = templateLiteral;
    }
  });

  fileAsString.push(`export const ${extractProperty} = Object.values(caches.inserted).join('');`);
  return fileAsString.join('\n');
}

/**
 * @type{CssInJsExpression}
 */
function generateSnippet(expression) {

}

/**
 * @param {t.Node} node
 * @param {Scope} scope
 * @return {Binding|null}
 */
function getBinding(node, scope) {
  if (t.isIdentifier(node)) {
    const binding = scope.getBinding(node.name);

    if (binding) {
      return binding;
    }
  }

  return null;
}
