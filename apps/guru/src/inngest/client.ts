import { EventSchemas, Inngest } from 'inngest';
import { sentryMiddleware } from '@elba-security/inngest';
import { logger } from '@elba-security/logger';

export const inngest = new Inngest({
  id: 'guru',
  schemas: new EventSchemas().fromRecord<{
    'guru/users.page_sync.requested': {
      data: {
        organisationId: string;
        region: string;
        isFirstSync: boolean;
        syncStartedAt: number;
        page: string | null;
      };
    };
    'guru/elba_app.uninstalled': {
      data: {
        organisationId: string;
      };
    };
  }>(),
  logger,
});
