type GuruErrorOptions = { response?: Response };

export class GuruError extends Error {
  response?: Response;

  constructor(message: string, { response }: GuruErrorOptions = {}) {
    super(message);
    this.response = response;
  }
}
