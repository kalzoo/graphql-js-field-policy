import {
  graphql,
  GraphQLObjectType,
  GraphQLList,
  GraphQLSchema,
  GraphQLString,
  GraphQLFloat,
  GraphQLID,
  Source
} from 'graphql';

import { fieldPolicy } from '../src';

import { accounts, banks, customers } from './data';
import { Account, Bank, Customer } from './classes';
import { AccountPolicy, BankPolicy, CustomerPolicy } from './policies';

const fieldPolicyOptions = {
  policyMap: {
    Account: AccountPolicy,
    Bank: BankPolicy,
    Customer: CustomerPolicy
  }
};

const AccountType = new GraphQLObjectType({
  name: 'Account',
  fields: () => ({
    id: {
      type: GraphQLID
    },
    balance: {
      type: GraphQLFloat,
      resolve: fieldPolicy((parent: any) => parent.balance, fieldPolicyOptions)
    }
  })
});

const BankType = new GraphQLObjectType({
  name: 'Bank',
  fields: () => ({
    id: {
      type: GraphQLID
    },
    accounts: {
      type: GraphQLList(AccountType),
      resolve: fieldPolicy((parent: any) => parent.accounts, fieldPolicyOptions)
    },
    customers: {
      type: GraphQLList(CustomerType),
      resolve: fieldPolicy((parent: any) => parent.customers, fieldPolicyOptions)
    }
  })
});

const CustomerType = new GraphQLObjectType({
  name: 'Customer',
  fields: () => ({
    id: {
      type: GraphQLID
    },
    name: {
      type: GraphQLString
    },
    phoneNumber: {
      type: GraphQLString
    },
    accounts: {
      type: GraphQLList(AccountType),
      resolve: fieldPolicy((parent: any) => parent.accounts, fieldPolicyOptions)
    }
  })
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    accounts: {
      type: GraphQLList(AccountType),
      resolve: fieldPolicy(() => accounts, fieldPolicyOptions)
    },
    account: {
      type: AccountType,
      args: {
        id: { type: GraphQLID }
      },
      resolve: fieldPolicy((_: any, { id }: { id: string }) => Account.find(id), fieldPolicyOptions)
    },
    bank: {
      type: BankType,
      args: {
        id: { type: GraphQLID }
      },
      resolve: fieldPolicy((_: any, { id }: { id: string }) => Bank.find(id), fieldPolicyOptions)
    },
    banks: {
      type: GraphQLList(BankType),
      resolve: fieldPolicy(() => banks, fieldPolicyOptions)
    },
    customers: {
      type: GraphQLList(CustomerType),
      resolve: fieldPolicy(() => customers, fieldPolicyOptions)
    },
    customer: {
      type: CustomerType,
      args: {
        id: { type: GraphQLID }
      },
      resolve: fieldPolicy((_: any, { id }: { id: string }) => Customer.find(id), fieldPolicyOptions)
    }
  }
});

const schema = new GraphQLSchema({
  types: [AccountType, BankType, CustomerType],
  query: QueryType
});

export default schema;

export const runQuery = (query: Source | string, variables: any, context = {}) => {
  return graphql(schema, query, null, context, variables);
};
