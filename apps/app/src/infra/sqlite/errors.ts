export class SqliteError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class SqliteDataIntegrityError extends SqliteError {}

export class RecordNotFoundError extends SqliteError {
  constructor(
    readonly resource: string,
    readonly id?: string,
  ) {
    super(id ? `${resource} not found: ${id}` : `${resource} not found`);
  }
}
