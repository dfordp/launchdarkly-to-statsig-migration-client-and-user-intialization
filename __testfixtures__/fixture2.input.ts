const LD_KEY = isDevelopment() ?
  '60ca05fb43d6f10d234bb3ce' :
  '60ca05fb43d6f10d234bb3cf';

function initLaunchDarkly(user ? : UserInfo) {
  client = LDClient.initialize(LD_KEY, {
    kind: 'user',
    key: user ? user.id : 'anon',
  });

  client.on('ready', () => {
    resolveReady(true);
  });
}