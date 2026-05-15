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
