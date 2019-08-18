import { Account, Bank, Customer } from './classes';

export const accounts = [
  { id: 'account1', bankId: 'bank1', customerId: 'customer1', balance: 1.0 },
  { id: 'account2', bankId: 'bank2', customerId: 'customer1', balance: 2.0 },
  { id: 'account3', bankId: 'bank2', customerId: 'customer2', balance: 3.0 }
].map(data => new Account(data));

export const banks = [{ id: 'bank1' }, { id: 'bank2' }].map(data => new Bank(data));

export const customers = [
  { id: 'customer1', name: 'Customer #1' },
  { id: 'customer2', name: 'Customer #2' },
  { id: 'customer3', name: 'Customer #3' }
].map(data => new Customer(data));
