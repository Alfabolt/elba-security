import { db } from '@/database/client';
import { Organisation } from '@/database/schema';
import { inngest } from '@/inngest/client';
import { getUsers } from '@/connectors/users';

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
  const result = await getUsers(token, email, null);
  console.log('result is ', result);
  // await db
  //   .insert(Organisation)
  //   .values({ id: organisationId, email, region, token })
  //   .onConflictDoUpdate({
  //     target: Organisation.id,
  //     set: {
  //       region,
  //       token,
  //       email,
  //     },
  //   });

  // await inngest.send({
  //   name: 'guru/users.page_sync.requested',
  //   data: {
  //     isFirstSync: true,
  //     organisationId,
  //     region,
  //     syncStartedAt: Date.now(),
  //     page: null,
  //   },
  // });
};
