import { describe, expect, test, beforeEach } from 'vitest';
import { http } from 'msw';
import { server } from '@elba-security/test-utils';
import { getUsers, type GuruUser } from './users';
import type { GuruError } from './commons/error';

const users: GuruUser[] = [
  {
    id: 'user-id',
    email: 'user@gmail.com',
  },
];

const validToken = 'test-token';
const email = 'test@example.com';
const nextPage = 'next-page';
const lastPage = 'last-page';

describe('getUsers', () => {
  beforeEach(() => {
    server.use(
      http.get(`https://api.getguru.com/api/v1/members`, ({ request }) => {
        const validBase64Credentials = btoa(`${email}:${validToken}`);
        const validAuthHeader = `Basic ${validBase64Credentials}`;
        if (request.headers.get('Authorization') !== validAuthHeader) {
          return new Response(undefined, { status: 401 });
        }
        const url = new URL(request.url);
        const lastPage = 'last-page';
        const nextPage = 'next-page';
        const requestPage = url.searchParams.get('token');

        return new Response(JSON.stringify(users), {
          headers:
            requestPage !== lastPage
              ? { Link: `<https://example.com?token=${nextPage}>; rel="next"` }
              : undefined,
          status: 200,
        });
      })
    );
  });

  test('should fetch users when token is valid', async () => {
    const result = await getUsers(validToken, email, null);
    console.log(result);
    expect(result.users).toEqual(users);
  });

  test('should throw GuruError when token is invalid', async () => {
    try {
      await getUsers('invalidToken', email, null);
    } catch (error) {
      expect((error as GuruError).message).toEqual('Could not retrieve users');
    }
  });

  test('should return next offset when there is next offset', async () => {
    const result = await getUsers(validToken, email, null);
    expect(result.pagination.nextPage).toEqual(nextPage);
  });

  test('should return next as null when there are no more pages', async () => {
    const result = await getUsers(validToken, email, lastPage);
    expect(result.pagination.nextPage).toBeNull();
  });
});
