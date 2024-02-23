import { env } from '@/env';
import { SendgridError } from './commons/error';

export type SendGridUser = {
  name: string;
  email: string;
};

export type Pagination = {
  next: number | null;
};

type GetUsersResponseData = { data: { users: SendGridUser[]; pagination: Pagination } };

export const getUsers = async (token: string, offset: number | null) => {
  const response = await fetch(
    `https://api.sendgrid.com/v3/teammates?limit=${env.USERS_SYNC_BATCH_SIZE}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) {
    throw new SendgridError('Could not retrieve users', { response });
  }
  const data = (await response.json()) as GetUsersResponseData;
  return data.data;
};
