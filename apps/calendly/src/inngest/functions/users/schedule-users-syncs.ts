import { env } from '@/env';
import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { inngest } from '../../client';

export const scheduleUsersSyncs = inngest.createFunction(
  { id: 'calendly-schedule-users-syncs' },
  { cron: env.USERS_SYNC_CRON },
  async ({ step }) => {
    const organisations = await db
      .select({
        id: Organisation.id,
        accessToken: Organisation.accessToken,
        refreshToken: Organisation.refreshToken,
        organizationUri: Organisation.organizationUri,
        region: Organisation.region,
      })
      .from(Organisation);

    if (organisations.length > 0) {
      await step.sendEvent(
        'sync-organisations-users',
        organisations.map(({ id, region }) => ({
          name: 'calendly/users.page_sync.requested',
          data: {
            organisationId: id,
            region,
            syncStartedAt: Date.now(),
            isFirstSync: false,
            page: '0',
          },
        }))
      );
    }

    return { organisations };
  }
);
