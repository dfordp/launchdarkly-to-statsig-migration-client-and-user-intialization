Transforms the LaunchDarkly initialization to use Statsig's createClient function, replacing the synchronous LDClient.initialize with an asynchronous createClient call that takes an environment parameter and intializes the user.


### Before

```ts
import { LDClient } from 'launchdarkly-js-client-sdk';

const environment = isDevelopment() ? 'development' : 'production';

const ldClient = LDClient.initialize(environment, {
  key: 'user_key',
  name: 'User Name',
});
const user = LDClient.User({
  key: 'user_key',
  name: 'User Name',
});
```

### After

```ts
import { createClient } from '@statsig/client';

const environment = isDevelopment() ? 'development' : 'production';
const client = await createClient('YOUR_STATSIG_API_KEY', { environment });
const user = {
  id: 'user_key',
  attributes: { name: 'User Name' },
};

await client.createUser(user);
```
Handles the same in Different intialization method

### Before

```ts
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
```

### After

```ts
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
```

