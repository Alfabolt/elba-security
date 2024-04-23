import { Elba, type User } from '@elba-security/sdk';
import { NonRetriableError } from 'inngest';
import { eq } from 'drizzle-orm';
import { type GuruUser, getUsers } from '@/connectors/users';
import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { env } from '@/env';
import { inngest } from '@/inngest/client';
import { decrypt } from '@/common/crypto';
const formatElbaUser = (user: GuruUser): User => ({
  id: user.id,
  displayName: user.email,
  email: user.email,
  role: 'member',
  authMethod: 'password',
  additionalEmails: [],
});

export const syncUsersPage = inngest.createFunction(
  {
    id: 'guru-sync-users-page',
    priority: {
      run: 'event.data.isFirstSync ? 600 : 0',
    },
    concurrency: {
      key: 'event.data.organisationId',
      limit: 1,
    },
    retries: env.USERS_SYNC_MAX_RETRY,
    cancelOn: [
      {
        event: 'guru/elba_app.uninstalled',
        match: 'data.organisationId',
      },
    ],
  },
  { event: 'guru/users.page_sync.requested' },
  async ({ event, step, logger }) => {
    const { organisationId, syncStartedAt, region, page } = event.data;

    const elba = new Elba({
      organisationId,
      apiKey: env.ELBA_API_KEY,
      baseUrl: env.ELBA_API_BASE_URL,
      region,
    });

    const organisation = await step.run('get-organisation', async () => {
      const [row] = await db
        .select({
          token: Organisation.token,
          email: Organisation.email,
        })
        .from(Organisation)
        .where(eq(Organisation.id, organisationId));
      if (!row) {
        throw new NonRetriableError(`Could not retrieve organisation with id=${organisationId}`);
      }
      return row;
    });

    const nextPage = await step.run('list-users', async () => {
      // retrieve this users page
      const decryptedToken = await decrypt(organisation.token);
      const result = await getUsers(decryptedToken, organisation.email, page);

      const users = result.users.map(formatElbaUser);
      // send the batch of users to Elba
      logger.debug('Sending batch of users to Elba: ', { organisationId, users });
      await elba.users.update({ users });

      if (result.pagination.nextPage) {
        return result.pagination.nextPage;
      }
      return null;
    });

    // if there is a next page, enqueue a new sync user event
    if (nextPage) {
      await step.sendEvent('sync-users-page', {
        name: 'guru/users.page_sync.requested',
        data: {
          ...event.data,
          page: nextPage,
        },
      });
      return {
        status: 'ongoing',
      };
    }

    // delete the Elba users that have been sent before this sync
    await step.run('finalize', () =>
      elba.users.delete({ syncedBefore: new Date(syncStartedAt).toISOString() })
    );

    return {
      status: 'completed',
    };
  }
);
