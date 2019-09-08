class Policy<ContextType, RecordType> {
  public context: ContextType;
  public record: RecordType;

  constructor(context: ContextType, record: RecordType) {
    this.context = context;
    this.record = record;
  }

  // Whether a specific field may be queried, once the entire record has been authorized with `show`
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  field(name: string): boolean {
    return true;
  }

  // Manage is a rollup of all other operations. If you can manage, you can do anything
  manage(): boolean {
    return false;
  }

  async authorize(operation: string): Promise<void> {
    if (!(operation in this)) {
      throw new UnknownAuthorizationError(`Authorization: Operation "${operation}" unknown`);
    }
    // @ts-ignore
    if (!(await this.manage()) && !(await this[operation]())) {
      throw new NotAuthorizedError(this.context, operation, this.constructor.name);
    }
  }

  async authorizeField(fieldName: string): Promise<void> {
    if (!(fieldName in this.record)) {
      throw new UnknownAuthorizationError(`Authorization: Field "${fieldName}" unknown`);
    }

    if (!(await this.manage()) && !(await this.field(fieldName))) {
      throw new NotAuthorizedError(this.context, `view field ${fieldName}`, this.constructor.name);
    }
  }

  create(): boolean {
    return false;
  }

  destroy(): boolean {
    return false;
  }

  edit(): boolean {
    return false;
  }

  new(): boolean {
    return false;
  }

  index(): boolean {
    return false;
  }

  show(): boolean {
    return false;
  }

  update(): boolean {
    return false;
  }
}

export default Policy;

export class NotAuthorizedError<ContextType> extends Error {
  constructor(context: ContextType, operation: string, policyName: string) {
    const errorMessage = `User is not authorized to ${operation} per ${policyName}`;
    super(errorMessage);
  }
}

export class UnknownAuthorizationError extends Error {}
