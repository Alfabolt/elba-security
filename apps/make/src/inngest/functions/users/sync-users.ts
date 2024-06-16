/* eslint-disable @typescript-eslint/no-loop-func */
/* eslint-disable no-await-in-loop */
import { type User } from '@elba-security/sdk';
import { NonRetriableError } from 'inngest';
import { eq } from 'drizzle-orm';
import { type MakeUser, getUsers } from '@/connectors/make/users';
import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { inngest } from '@/inngest/client';
import { createElbaClient } from '@/connectors/elba/client';
import { decrypt } from '../../../common/crypto';

const formatElbaUser = (user: MakeUser): User => ({
  id: user.id,
  displayName: user.name,
  email: user.email,
  role: 'member',
  authMethod: 'password',
  additionalEmails: [],
});

export const syncUsers = inngest.createFunction(
  {
    id: 'make-sync-users-page',
    priority: {
      run: 'event.data.isFirstSync ? 600 : 0',
    },
    concurrency: {
      key: 'event.data.organisationId',
      limit: 1,
    },
    retries: 5,
    cancelOn: [
      {
        event: 'make/elba_app.uninstalled',
        match: 'data.organisationId',
      },
    ],
  },
  { event: 'make/users.page_sync.requested' },
  async ({ event, step, logger }) => {
    const { organisationId, syncStartedAt, page } = event.data

    const organisation = await step.run('get-organisation', async () => {
      const [result] = await db
        .select({
          token: Organisation.token,
          organizationIds: Organisation.organizationIds,
          region: Organisation.region,
          zoneDomain: Organisation.zoneDomain,
        })
        .from(Organisation)
        .where(eq(Organisation.id, organisationId));
        if (!result) {
          throw new NonRetriableError(`Could not retrieve organisation with id=${organisationId}`);
        }
        return result;
    });

    const elba = createElbaClient({ organisationId, region: organisation.region });
    const token = await decrypt(organisation.token);

    let allUsers: User[] = [];
    for (const organizationId of organisation.organizationIds) {
      let nextPage: number | null = page;

      while (nextPage !== null) {
        nextPage = await step.run('list-users', async () => {
          const result = await getUsers(token, organizationId, Number(nextPage), organisation.zoneDomain);
          const users = result.users.map(formatElbaUser);
          allUsers = allUsers.concat(users);


          logger.debug('Sending batch of users to elba: ', {
            organisationId,
            users,
          });
          await elba.users.update({ users });

          if (result.pagination.next) {
            return result.pagination.next;
          }
          return null;
        });

        // if there is a next page enqueue a new sync user event
        if (nextPage) {
          await step.sendEvent('sync-users-page', {
            name: 'make/users.page_sync.requested',
            data: {
              ...event.data,
              page: nextPage,
            },
          });
          return {
            status: 'ongoing',
          };
        }
      }
    }
    await elba.users.update({ users: allUsers });

    // delete the Elba users that have been sent before this sync
    await step.run('finalize', () =>
      elba.users.delete({ syncedBefore: new Date(syncStartedAt).toISOString() })
    );

    return {
      status: 'completed',
    };
  }
);
