import { createClient } from '@statsig/client';

const environment = isDevelopment() ? 'development' : 'production';
const client = await createClient('YOUR_STATSIG_API_KEY', { environment });
const user = {
  id: 'user_key',
  attributes: { name: 'User Name' },
};

await client.createUser(user);