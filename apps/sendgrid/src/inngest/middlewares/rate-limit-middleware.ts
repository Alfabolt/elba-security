import { InngestMiddleware, RetryAfterError } from 'inngest';
import { SendgridError } from '@/connectors/commons/error';

export const rateLimitMiddleware = new InngestMiddleware({
  name: 'rate-limit',
  init: () => {
    return {
      onFunctionRun: ({ fn }) => {
        return {
          transformOutput: (ctx) => {
            const {
              result: { error, ...result },
              ...context
            } = ctx;

            if (
              error instanceof SendgridError &&
              error.response?.headers['x-ratelimit-remaining'] === '0' &&
              error.response.headers['x-ratelimit-reset']
            ) {
              const retryAfter = new Date(
                Number(error.response.headers['x-ratelimit-reset']) * 1000
              );

              return {
                ...context,
                result: {
                  ...result,
                  error: new RetryAfterError(
                    `SendGrid rate limit reached by '${fn.name}'`,
                    retryAfter,
                    { cause: error }
                  ),
                },
              };
            }
          },
        };
      },
    };
  },
});
