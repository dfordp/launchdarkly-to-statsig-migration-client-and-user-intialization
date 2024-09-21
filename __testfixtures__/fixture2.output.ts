const LD_KEY = isDevelopment() ?
  '60ca05fb43d6f10d234bb3ce' :
  '60ca05fb43d6f10d234bb3cf';

async function initStatsig(user ? : UserInfo) {
  client = await createClient('YOUR_STATSIG_API_KEY', { LD_KEY });

  const user = {
    id: user ? user.id : 'anon',
    kind: 'user',
  };

  client.on('ready', () => {
    resolveReady(true);
  });
}