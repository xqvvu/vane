/**
 * Domain failures raised by console services and translated at the oRPC
 * boundary by `#/server/orpc/errors.ts`.
 *
 * Services signal *what went wrong in domain terms*; they do not know about
 * oRPC error codes. `RecordNotFoundError` stays in `#/infra/sqlite/errors.ts`
 * because repositories raise it while loading rows; this module covers the
 * validation failures services raise before persistence.
 */

/**
 * A request that is well-formed at the schema level but invalid in domain terms:
 * config rejected by an adapter, a route referencing unknown sources, an import
 * payload that cannot be parsed or that requests an unsupported operation.
 *
 * The message is written for the operator and is surfaced to the client, so it
 * must not contain secrets.
 */
export class DomainValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}
