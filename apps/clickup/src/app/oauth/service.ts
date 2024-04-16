import { getAccessToken } from '@/connectors/auth';
import { getTeamId } from '@/connectors/team';
import { db, Organisation } from '@/database';
import { inngest } from '@/inngest/client';
import { encrypt } from '../../common/crypto';

type SetupOrganisationParams = {
  organisationId: string;
  code: string;
  region: string;
};

export const setupOrganisation = async ({
  organisationId,
  code,
  region,
}: SetupOrganisationParams) => {
  const accessToken = await getAccessToken(code);
  const encodedToken = await encrypt(accessToken);
  const teamId = await getTeamId(accessToken);
  if (!teamId) {
    throw new Error('Could not retrieve site id');
  }
  await db
    .insert(Organisation)
    .values({
      id: organisationId,
      accessToken: encodedToken,
      teamId,
      region,
    })
    .onConflictDoUpdate({
      target: [Organisation.id],
      set: {
        id: organisationId,
        accessToken: encodedToken,
        teamId,
        region,
      },
    });

  await inngest.send({
    name: 'clickup/users.page_sync.requested',
    data: {
      isFirstSync: true,
      organisationId,
      region,
      syncStartedAt: Date.now(),
    },
  });
};
