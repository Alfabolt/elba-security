/**
 * DISCLAIMER:
 * The tests provided in this file are specifically designed for the `auth` connectors function.
 * Theses tests exists because the services & inngest functions using this connector mock it.
 * If you are using an SDK we suggest you to mock it not to implements calls using msw.
 * These file illustrate potential scenarios and methodologies relevant for SaaS integration.
 */

import { http } from 'msw';
import { describe, expect, test, beforeEach } from 'vitest';
import { env } from '@/env';
import { server } from '../../vitest/setup-msw-handlers';
import { type SendGridUser, getSendGridUsers } from './users';
import type { SendgridError } from './commons/error';

const sendGridUsers: SendGridUser[] = [
  {
  username: "awan7676",
  email: "abdullah.awan@alfabolt.com",
  }
];

const validToken = env.SENDGRID_API_TOKEN; 

const limit = 10;
let offset = 0; 

describe('getSendGridUsers', () => {
  beforeEach(() => {
    server.use(
      http.get('https://api.sendgrid.com/v3/teammates', ({ request }) => {
        if (request.headers.get('Authorization') !== `Bearer ${validToken}`) {
          return new Response(undefined, { status: 401 });
        }
        const url = new URL(request.url);
        const requestLimit = parseInt(url.searchParams.get('limit') || '0');
        const requestOffset = parseInt(url.searchParams.get('offset') || '0');
        if (requestLimit !== limit || requestOffset !== offset) {
          return new Response(undefined, { status: 400 });
        }
        const nextPage = offset + limit >= sendGridUsers.length ? null : offset + limit;
        const pageUsers = sendGridUsers.slice(offset, offset + limit);
        offset = nextPage !== null ? nextPage : offset; // Update offset for next request only if nextPage is not null
        return new Response(JSON.stringify({ users: pageUsers, nextPage }), { status: 200 });
      })
    );
  });

  test('should fetch SendGrid users when token is valid', async () => {
    const result = await getSendGridUsers(validToken, limit, offset);
    expect(result.users).toEqual(sendGridUsers.slice(offset, offset + limit));
  });

  test('should throw SendgridError when token is invalid', async () => {
    try {
      await getSendGridUsers('invalidToken', limit, offset);
    } catch (error) {
      const sendgridError = error as SendgridError;
      expect(sendgridError.message).toEqual('Could not retrieve users');
    }
  });
  test('should return nextPage as null when end of list is reached', async () => {
    const result = await getSendGridUsers(validToken, limit, offset);
    expect(result.nextPage).toBeNull();
  });
});
