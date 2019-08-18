export class Account {
  public id: string;
  public balance: number;
  public bankId: string;
  public customerId: string;

  constructor({
    id,
    balance,
    bankId,
    customerId
  }: {
    id: string;
    balance: number;
    bankId: string;
    customerId: string;
  }) {
    this.id = id;
    this.balance = balance;
    this.bankId = bankId;
    this.customerId = customerId;
  }

  static find(id: string): Account {
    const result = require('./data').accounts.find((a: Account) => a.id === id);
    if (result) return result;
    throw new NotFoundError('Account', id);
  }

  get bank() {
    return Bank.find(this.bankId);
  }
}

export class Bank {
  public id: string;

  constructor({ id }: { id: string }) {
    this.id = id;
  }

  static find(id: string): Bank {
    const result = require('./data').banks.find((b: Bank) => b.id === id);
    if (result) return result;
    throw new NotFoundError('Bank', id);
  }

  get accounts(): Account[] {
    return require('./data').accounts.filter((a: Account) => a.bankId === this.id);
  }

  get customers(): Customer[] {
    return this.accounts.map((a: Account) => Customer.find(a.customerId)!).filter(el => el);
  }
}

export class Customer {
  public id: string;
  public name: string;

  constructor({ id, name }: { id: string; name: string }) {
    this.id = id;
    this.name = name;
  }

  static find(id: string): Customer {
    const result = require('./data').customers.find((c: Customer) => c.id === id);
    if (result) return result;
    throw new NotFoundError('Customer', id);
  }

  get accounts(): Account[] {
    return require('./data').accounts.filter((a: Account) => a.customerId === this.id);
  }

  hasAccountAtBank(bankId: string) {
    return Bank.find(bankId)
      .accounts.map(a => a.id)
      .some(accountId => this.accounts.map(a => a.id).includes(accountId));
  }
}

class NotFoundError extends Error {
  constructor(_type: string, id: string) {
    super(`Not found: ${_type} with id ${id}`);
  }
}
