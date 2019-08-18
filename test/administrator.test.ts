import { runQuery } from './schema';
import { accounts, banks, customers } from './data';
import { Account, Bank } from './classes';

describe('Authorization', () => {
  describe('an administrator', () => {
    const context = {
      user: {
        isAdmin: true
      }
    };

    it('can view all account balances', async () => {
      const query = `
        query {
          accounts {
            id
            balance
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeUndefined();
      expect(result.data!.accounts.map((a: Account) => a.balance)).toEqual(accounts.map(a => a.balance));
    });

    it('can view all customer data', async () => {
      const query = `
        query {
          customers {
            id
            name
            accounts {
              id
              balance
            }
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeUndefined();
      expect(result.data!.customers.map((c: any) => c.id)).toEqual(customers.map(c => c.id));
      result.data!.customers.forEach((c: any) => {
        expect(c.accounts.map((a: any) => a.balance)).toEqual(
          accounts.filter(a => a.customerId === c.id).map(a => a.balance)
        );
      });
    });
    it('can view all bank data', async () => {
      const query = `
        query {
          banks {
            id
            accounts {
              id
              balance
            }
            customers {
              id
            }
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeUndefined();
      expect(result.data!.banks.map((b: Bank) => b.id)).toEqual(banks.map(b => b.id));
      result.data!.banks.forEach((b: Bank) => {
        const accountBalances = Bank.find(b.id)!.accounts.map(a => a.balance);
        expect(b.accounts.map(a => a.balance)).toEqual(accountBalances);
        const customerIds = Bank.find(b.id)!.customers.map(c => c.id);
        expect(b.customers.map(c => c.id)).toEqual(customerIds);
      });
    });
  });
});
