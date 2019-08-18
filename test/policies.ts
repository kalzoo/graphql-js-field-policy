import { Policy } from '../src';
import { Account, Bank, Customer } from './classes';

import { Context } from './types';

class ApplicationPolicy<RecordType> extends Policy<Context, RecordType> {
  manage() {
    return this.context.user.isAdmin;
  }
}

export class AccountPolicy extends ApplicationPolicy<Account> {
  field() {
    return true;
  }

  show() {
    return this.context.user.id === this.record.customerId || this.record.bankId === this.context.user.worksForBankId;
  }
}

export class BankPolicy extends ApplicationPolicy<Bank> {
  field(name: string) {
    switch (name) {
      case 'id':
        return true;
      default:
        return this.context.user.worksForBankId === this.record.id;
    }
  }

  show() {
    return true;
  }
}

export class CustomerPolicy extends ApplicationPolicy<Customer> {
  // field(parent, args, context, info) {
  //   if (context.user.isAdmin) return true;
  // }

  show() {
    return this.context.user.id === this.record.id || this.record.hasAccountAtBank(this.context.user.worksForBankId);
  }
}
