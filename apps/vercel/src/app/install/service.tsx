import { getUsers } from '../../connectors/users';
import { db } from '../../database/client';
import { Organisation } from '../../database/schema';
import { inngest } from '@/inngest/client';

type SetupOrganisationParams = {
  organisationId: string;
  token: string;
  teamId: string;
  region: string;
};

export const registerOrganisation = async ({
  organisationId,
  token,
  teamId,
  region,
}: SetupOrganisationParams) => {
 await db
    .insert(Organisation)
    .values({ id: organisationId, teamId, region, token })
    .onConflictDoUpdate({
      target: Organisation.id,
      set: {
        region,
        token,
        teamId,
      },
    })
    .returning();

  await inngest.send({
    name: 'vercel/users.page_sync.requested',
    data: {
      isFirstSync: true,
      organisationId,
      region,
      syncStartedAt: Date.now(),
    },
  });
};
