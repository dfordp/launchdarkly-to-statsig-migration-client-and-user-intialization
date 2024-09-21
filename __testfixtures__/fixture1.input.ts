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