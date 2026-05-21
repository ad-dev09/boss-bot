export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (resourceName: string) =>
  new HttpError(404, `${resourceName} not found.`);

export const badRequest = (message: string) => new HttpError(400, message);

export const unauthorized = (message = "Unauthorized.") =>
  new HttpError(401, message);
