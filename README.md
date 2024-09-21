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

