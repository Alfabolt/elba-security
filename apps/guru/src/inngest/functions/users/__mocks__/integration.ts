import { GuruUser } from '@/connectors/users';
export const organisations = Array.from({ length: 5 }, (_, i) => ({
  id: `45a76301-f1dd-4a77-b12f-9d7d3fca3c9${i}`,
  token: `token-${i}`,
  email: `testemail${i}@example.com`,
  region: 'us',
}));

export const users: GuruUser[] = Array.from({ length: 10 }, (_, i) => ({
  id: `id-${i}`,
  email: `user${i}@example.com`,
}));

export const elbaUsers = Array.from({ length: 10 }, (_, i) => ({
  id: `userId-${i}`,
  displayName: `test-${i}@example.com`,
  role: 'member',
  email: `test-${i}@example.com`,
  authMethod: 'password',
}));
