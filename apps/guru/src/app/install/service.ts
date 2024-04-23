import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { inngest } from '@/inngest/client';
import { getUsers } from '@/connectors/users';
import { encrypt } from '@/common/crypto';
type SetupOrganisationParams = {
  organisationId: string;
  token: string;
  email: string;
  region: string;
};

export const registerOrganisation = async ({
  organisationId,
  token,
  email,
  region,
}: SetupOrganisationParams) => {
  await getUsers(token, email, null);
  const encryptedToken = await encrypt(token);
  await db
    .insert(Organisation)
    .values({ id: organisationId, email, region, token: encryptedToken })
    .onConflictDoUpdate({
      target: Organisation.id,
      set: {
        region,
        token: encryptedToken,
        email,
      },
    });

  await inngest.send({
    name: 'guru/users.page_sync.requested',
    data: {
      isFirstSync: true,
      organisationId,
      region,
      syncStartedAt: Date.now(),
      page: null,
    },
  });
};
