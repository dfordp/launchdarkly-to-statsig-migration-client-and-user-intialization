export default function transform(file, api, options) {
  const j = api.jscodeshift;
  const root = j(file.source);
  let dirtyFlag = false;

  // Replace import statement
  root.find(j.ImportDeclaration, {
    source: { value: 'launchdarkly-js-client-sdk' },
  }).forEach((path) => {
    const specifier = path.node.specifiers.find(
      (spec) => spec.imported.name === 'LDClient',
    );
    if (specifier) {
      path.replace(
        j.importDeclaration(
          [j.importSpecifier(j.identifier('createClient'))],
          j.literal('@statsig/client'),
        ),
      );
      dirtyFlag = true;
    }
  });

  // Replace LDClient.initialize with await createClient
  root.find(j.VariableDeclaration).forEach((path) => {
    path.node.declarations.forEach((decl) => {
      if (
        j.CallExpression.check(decl.init) &&
        j.MemberExpression.check(decl.init.callee) &&
        decl.init.callee.object.name === 'LDClient' &&
        decl.init.callee.property.name === 'initialize'
      ) {
        const environmentArg = decl.init.arguments[0];
        decl.id.name = 'client';
        decl.init = j.awaitExpression(
          j.callExpression(j.identifier('createClient'), [
            j.literal('YOUR_STATSIG_API_KEY'),
            j.objectExpression([
              j.property.from({
                kind: 'init',
                key: j.identifier('environment'),
                value: environmentArg,
                shorthand: true,
              }),
            ]),
          ]),
        );
        dirtyFlag = true;
      }
    });
  });

  // Replace LDClient.User with plain object
  root.find(j.VariableDeclaration).forEach((path) => {
    path.node.declarations.forEach((decl) => {
      if (
        j.CallExpression.check(decl.init) &&
        j.MemberExpression.check(decl.init.callee) &&
        decl.init.callee.object.name === 'LDClient' &&
        decl.init.callee.property.name === 'User'
      ) {
        const userArgs = decl.init.arguments[0].properties;
        const keyProp = userArgs.find(
          (prop) => prop.key.name === 'key',
        );
        const nameProp = userArgs.find(
          (prop) => prop.key.name === 'name',
        );
        decl.init = j.objectExpression([
          j.property.from({
            kind: 'init',
            key: j.identifier('id'),
            value: keyProp.value,
          }),
          j.property.from({
            kind: 'init',
            key: j.identifier('attributes'),
            value: j.objectExpression([
              j.property.from({
                kind: 'init',
                key: j.identifier('name'),
                value: nameProp.value,
              }),
            ]),
          }),
        ]);
        dirtyFlag = true;
      }
    });
  });

  // Add await client.createUser(user)
  const ldClientVar = root
    .find(j.VariableDeclaration)
    .filter((path) =>
      path.node.declarations.some((decl) => decl.id.name === 'client'),
    );

  if (ldClientVar.length > 0) {
    const userVar = root.find(j.VariableDeclaration, {
      declarations: [{ id: { name: 'user' } }],
    });

    if (userVar.length > 0) {
      j(userVar.get()).insertAfter(
        j.expressionStatement(
          j.awaitExpression(
            j.callExpression(
              j.memberExpression(
                j.identifier('client'),
                j.identifier('createUser'),
              ),
              [j.identifier('user')],
            ),
          ),
        ),
      );
      dirtyFlag = true;
    }
  }

  return dirtyFlag ? root.toSource() : undefined;
}