import { http } from 'msw';
import { describe, expect, test, beforeEach } from 'vitest';
import { env } from '@/env';
import { server } from '../../vitest/setup-msw-handlers';
import { type SendGridUser, getUsers } from './users';
import type { SendgridError } from './commons/error';

const users: SendGridUser[] = [
  {
    name: 'user1',
    email: 'user1@gmail.com',
  },
];

const validToken = env.SENDGRID_API_TOKEN;

describe('getSendGridUsers', () => {
  beforeEach(() => {
    server.use(
      http.get('https://api.sendgrid.com/v3/teammates', ({ request }) => {
        if (request.headers.get('Authorization') !== `Bearer ${validToken}`) {
          return new Response(undefined, { status: 401 });
        }
        const url = new URL(request.url);
        const offset = parseInt(url.searchParams.get('offset') || '0');
        const lastOffset = 20; //assumed last offset to be 20
        const nextOffset = 10; //max batch size(limit) is set to 10 in env, so next offset will begin from 10
        return new Response(
          JSON.stringify({
            data: {
              users,
              pagination: {
                next: offset === lastOffset ? null : nextOffset,
              },
            },
          }),
          { status: 200 }
        );
      })
    );
  });

  test('should fetch SendGrid users when token is valid', async () => {
    const result = await getUsers(validToken, null);
    expect(result.users).toEqual(users);
  });

  test('should throw SendgridError when token is invalid', async () => {
    try {
      await getUsers('invalidToken', null);
    } catch (error) {
      const sendgridError = error as SendgridError;
      expect(sendgridError.message).toEqual('Could not retrieve users');
    }
  });
  test('should return nextPage when there are more users available', async () => {
    const result = await getUsers(validToken, 0);
    expect(result.pagination.next).equals(10);
  });

  test('should return nextPage as null when end of list is reached', async () => {
    const result = await getUsers(validToken, 20);
    expect(result.pagination.next).toBeNull();
  });
});
