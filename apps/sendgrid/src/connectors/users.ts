/**
 * DISCLAIMER:
 * This is an example connector, the function has a poor implementation. When requesting against API endpoint we might prefer
 * to valid the response data received using zod than unsafely assign types to it.
 * This might not fit your usecase if you are using a SDK to connect to the Saas.
 * These file illustrate potential scenarios and methodologies relevant for SaaS integration.
 */

import { SendgridError  } from './commons/error';

export type SendGridUser = {
  username: string;
  email: string;
};

type GetUsersResponseData = { users: SendGridUser[]; nextPage: number | null };

export const getSendGridUsers = async (token: string, limit: number, offset: number) => {
  const response = await fetch(
    `https://api.sendgrid.com/v3/teammates?limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    throw new SendgridError('Could not retrieve users', { response });
  }
  return response.json() as Promise<GetUsersResponseData>;
};
