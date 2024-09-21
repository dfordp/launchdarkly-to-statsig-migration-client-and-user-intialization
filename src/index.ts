export default function transform(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let dirtyFlag = false;

  // Replace LDClient.initialize with createClient
  root.find(j.CallExpression, {
    callee: {
      object: { name: 'LDClient' },
      property: { name: 'initialize' }
    }
  }).replaceWith(path => {
    const args = path.node.arguments;
    const environmentArg = args[0];

    if (j.Literal.check(environmentArg)) {
      dirtyFlag = true;
      return j.awaitExpression(
        j.callExpression(
          j.identifier('createClient'),
          [
            j.literal('YOUR_STATSIG_API_KEY'),
            j.objectExpression([
              j.objectProperty(
                j.identifier('environment'),
                environmentArg
              )
            ])
          ]
        )
      );
    }
    return path.node;
  });

  // Replace LDClient.User with plain object
  root.find(j.CallExpression, {
    callee: {
      object: { name: 'LDClient' },
      property: { name: 'User' }
    }
  }).replaceWith(path => {
    const args = path.node.arguments;
    const userConfig = args[0];

    if (j.ObjectExpression.check(userConfig)) {
      const keyProperty = userConfig.properties.find(prop => prop.key.name === 'key');
      const nameProperty = userConfig.properties.find(prop => prop.key.name === 'name');

      if (keyProperty && nameProperty) {
        dirtyFlag = true;
        return j.objectExpression([
          j.objectProperty(
            j.identifier('id'),
            keyProperty.value
          ),
          j.objectProperty(
            j.identifier('attributes'),
            j.objectExpression([
              j.objectProperty(
                j.identifier('name'),
                nameProperty.value
              )
            ])
          )
        ]);
      }
    }
    return path.node;
  });

  // Update function name and add async keyword
  root.find(j.FunctionDeclaration, {
    id: { name: 'initLaunchDarkly' }
  }).replaceWith(path => {
    dirtyFlag = true;
    return j.functionDeclaration(
      j.identifier('initStatsig'),
      path.node.params,
      path.node.body,
      true // async
    );
  });

  // Update import statement
  root.find(j.ImportDeclaration, {
    source: { value: 'launchdarkly-js-client-sdk' }
  }).replaceWith(path => {
    const specifiers = path.node.specifiers;
    if (specifiers.some(specifier => specifier.imported.name === 'LDClient')) {
      dirtyFlag = true;
      return j.importDeclaration(
        [j.importSpecifier(j.identifier('createClient'))],
        j.literal('@statsig/client')
      );
    }
    return path.node;
  });

  // Add await client.createUser(user) after user object creation
  root.find(j.VariableDeclaration).forEach(path => {
    const declarations = path.node.declarations;
    declarations.forEach(declaration => {
      if (j.Identifier.check(declaration.id) && declaration.id.name === 'user') {
        dirtyFlag = true;
        const parent = path.parent.node;
        const index = parent.body.indexOf(path.node);
        parent.body.splice(index + 1, 0, j.expressionStatement(
          j.awaitExpression(
            j.callExpression(
              j.memberExpression(
                j.identifier('client'),
                j.identifier('createUser')
              ),
              [j.identifier('user')]
            )
          )
        ));
      }
    });
  });

  // Remove old LDClient.initialize and LDClient.User calls
  root.find(j.CallExpression, {
    callee: {
      object: { name: 'LDClient' },
      property: { name: 'initialize' }
    }
  }).remove();

  root.find(j.CallExpression, {
    callee: {
      object: { name: 'LDClient' },
      property: { name: 'User' }
    }
  }).remove();

  // Ensure client variable is declared
  root.find(j.VariableDeclaration).forEach(path => {
    const declarations = path.node.declarations;
    declarations.forEach(declaration => {
      if (j.Identifier.check(declaration.id) && declaration.id.name === 'ldClient') {
        dirtyFlag = true;
        declaration.id.name = 'client';
      }
    });
  });

  // Ensure function is async
  root.find(j.FunctionDeclaration, {
    id: { name: 'initStatsig' }
  }).forEach(path => {
    if (!path.node.async) {
      dirtyFlag = true;
      path.node.async = true;
    }
  });

  return dirtyFlag ? root.toSource() : undefined;
}