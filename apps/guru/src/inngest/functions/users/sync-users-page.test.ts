import { expect, test, describe, vi } from 'vitest';
import { createInngestFunctionMock } from '@elba-security/test-utils';
import { NonRetriableError } from 'inngest';
import * as usersConnector from '@/connectors/users';
import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { syncUsersPage } from './sync-users-page';
import { elbaUsers, users } from './__mocks__/integration';
import * as crypto from '@/common/crypto';
import { env } from '@/env';
const organisation = {
  id: '45a76301-f1dd-4a77-b12f-9d7d3fca3c90',
  token: 'test-token',
  email: 'test@example.com',
  region: 'us',
};
const syncStartedAt = Date.now();

const setup = createInngestFunctionMock(syncUsersPage, 'guru/users.page_sync.requested');

describe('sync-users', () => {
  test('should abort sync when organisation is not registered', async () => {
    // setup the test without organisation entries in the database, the function cannot retrieve a token
    const [result, { step }] = setup({
      organisationId: organisation.id,
      isFirstSync: false,
      syncStartedAt: Date.now(),
      region: organisation.region,
      page: null,
    });

    // assert the function throws a NonRetriableError that will inform inngest to definitly cancel the event (no further retries)
    await expect(result).rejects.toBeInstanceOf(NonRetriableError);

    // check that the function is not sending other event
    expect(step.sendEvent).toBeCalledTimes(0);
  });

  test('should continue the sync when there is a next page', async () => {
    // setup the test with an organisation
    await db.insert(Organisation).values(organisation);
    // @ts-expect-error -- this is a mock
    vi.spyOn(crypto, 'decrypt').mockResolvedValue(undefined);
    vi.spyOn(usersConnector, 'getUsers').mockResolvedValue({
      users: users, // This now matches the expected GuruUser[]
      pagination: { nextPage: 'next-page' },
    });
    const [result, { step }] = setup({
      organisationId: organisation.id,
      isFirstSync: false,
      syncStartedAt,
      region: organisation.region,
      page: null,
    });

    await expect(result).resolves.toStrictEqual({ status: 'ongoing' });

    expect(crypto.decrypt).toBeCalledTimes(1);
    expect(crypto.decrypt).toBeCalledWith(organisation.token);
    // check that the function continue the pagination process
    expect(step.sendEvent).toBeCalledTimes(1);
    expect(step.sendEvent).toBeCalledWith('sync-users-page', {
      name: 'guru/users.page_sync.requested',
      data: {
        organisationId: organisation.id,
        isFirstSync: false,
        syncStartedAt,
        region: organisation.region,
        page: 'next-page',
      },
    });
  });

  test('should finalize the sync when there is a no next page', async () => {
    await db.insert(Organisation).values(organisation);
    // @ts-expect-error -- this is a mock
    vi.spyOn(crypto, 'decrypt').mockResolvedValue(undefined);
    vi.spyOn(usersConnector, 'getUsers').mockResolvedValue({
      users,
      pagination: { nextPage: null },
    });
    const [result, { step }] = setup({
      organisationId: organisation.id,
      isFirstSync: false,
      syncStartedAt,
      region: organisation.region,
      page: null,
    });

    await expect(result).resolves.toStrictEqual({ status: 'completed' });

    expect(crypto.decrypt).toBeCalledTimes(1);
    expect(crypto.decrypt).toBeCalledWith(organisation.token);
  });
});
