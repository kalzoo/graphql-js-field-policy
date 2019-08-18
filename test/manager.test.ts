import { runQuery } from './schema';
import { banks } from './data';
import { Bank } from './classes';

describe('Authorization', () => {
  describe('a bank manager', () => {
    const bank = Bank.find('bank1');

    const context = {
      user: {
        worksForBankId: bank.id
      }
    };

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

    it('can view its own bank accounts', async () => {
      const query = `
        query {
          bank(id: "${bank.id}") {
            id
            accounts {
              balance
            }
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeUndefined();
    });

    it("cannot view a different bank's accounts", async () => {
      const query = `
        query {
          banks {
            id
            accounts {
              balance
            }
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBe(1);
      expect(result.errors![0].message).toMatch('not authorized to view field accounts per BankPolicy');
    });

    it('can view its own nested customer records', async () => {
      const query = `
        query {
          bank(id: "${bank.id}") {
            customers {
              id
              name
            }
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeUndefined();
      expect(result.data!.bank.customers.map((c: any) => c.id)).toEqual(bank.customers.map(c => c.id));
    });

    it('can view its customers directly', async () => {
      const query = `
        query {
          customer(id: "${bank.customers[0].id}") {
            id
            name
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeUndefined();
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
      expect(result.errors!.length).toBe(1);
      expect(result.errors![0].message).toMatch('not authorized to show per CustomerPolicy');
    });

    it("cannot view its customers' accounts at other banks", async () => {
      const query = `
        query {
          bank(id: "${bank.id}") {
            id
            customers {
              id
              name
              accounts {
                balance
              }
            }
          }
        }
      `;
      const result = await runQuery(query, null, context);

      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBe(1);
      expect(result.errors![0].message).toMatch('not authorized to show per AccountPolicy');
    });
  });
});
