import { runQuery } from './schema';
import { banks, customers } from './data';

describe('Authorization', () => {
  describe('a customer', () => {
    const customer = customers[0];

    const context = {
      user: {
        id: customer.id
      }
    };

    it('can view its own account balance', async () => {
      const query = `
        query {
          account(id: "${customer.accounts[0].id}") {
            id
            balance
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeUndefined();
      expect(result.data!.account.balance).toEqual(customer.accounts[0].balance);
    });

    it("cannot view a different customer's account balance", async () => {
      const query = `
        query {
          account(id: "${customers[1].accounts[0].id}") {
            id
            balance
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeDefined();
      // expect(result.data.account.balance).toEqual(customer.accounts[0].balance);
    });

    it('can view its own customer record', async () => {
      const query = `
        query {
          customer(id: "${customers[0].id}") {
            id
            name
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeUndefined();
      expect(result.data!.customer.name).toEqual(customers[0].name);
    });

    it('cannot view a different customer', async () => {
      const query = `
        query {
          customer(id: "${customers[1].id}") {
            id
            name
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeDefined();
    });

    it('cannot view all customers', async () => {
      const query = `
        query {
          customers {
            id
            name
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeDefined();
    });

    it('can view all bank ids', async () => {
      const query = `
        query {
          banks {
            id
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeUndefined();
      expect(result.data!.banks.map((b: any) => b.id)).toEqual(banks.map(b => b.id));
    });

    it("cannot view a bank's customers", async () => {
      const query = `
        query {
          banks {
            id
            customers {
              id
              name
            }
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeDefined();
    });
  });
});
