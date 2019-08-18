import { ExecutionContext } from 'graphql/execution/execute';

export interface Context extends ExecutionContext {
  user: User;
}

export interface User {
  isAdmin: boolean;
  worksForBankId: string;
  id: string;
}
