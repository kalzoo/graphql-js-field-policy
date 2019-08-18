import { ExecutionContext } from 'graphql/execution/execute';
import { GraphQLResolveInfo, isLeafType, isListType, GraphQLFieldResolver } from 'graphql';

type PolicyClass<T> = {
  new (...args: any[]): T;
};

interface PolicyMap {
  [typename: string]: PolicyClass<any>;
}

interface FieldAuthorizerOptions {
  policyMap: PolicyMap;
}

const fieldPolicy = (
  resolver: Function,
  options: FieldAuthorizerOptions
): GraphQLFieldResolver<any, any, { [key: string]: any }> => async (
  object: any,
  args: object,
  context: ExecutionContext,
  info: GraphQLResolveInfo
): Promise<any> => {
  const { policyMap } = options;
  const policyClass = selectPolicyClass(policyMap, info);
  const result = await resolver(object, args, context, info);

  if (!result) return result;

  if (isListType(info.returnType)) {
    // TODO: Should I catch errors so they're not unhandled? -> only if 'omit' on unauthorized
    return await Promise.all(
      result.map(async (record: any) => {
        const policy = new policyClass(context, record);
        await policy.authorize('show');
        return authorizationProxy(record, policy);
      })
    );
  } else {
    const policy = new policyClass(context, result);
    await policy.authorize('show');
    if (isLeafType(info.returnType)) {
      return result;
    } else {
      return authorizationProxy(result, policy);
    }
  }
};

export default fieldPolicy;

const selectPolicyClass = (policyMap: PolicyMap, info: GraphQLResolveInfo): PolicyClass<any> => {
  // Strip off [brackets] because these indicate a list return type
  const typeName = info.returnType.toString().replace(/(\[|\])/g, '');
  const policyClass = policyMap[typeName] || policyMap.__default;
  if (policyClass) return policyClass;
  throw new NoDefinedPolicyError(`[FieldAuthorizer] No mapped policy found for ${typeName}`);
};

const SPECIAL_FIELDS = new Set(['then', 'length']);

const authorizationProxy = (result: object, policy: any): object =>
  new Proxy(result, {
    get: async function(source, field): Promise<any> {
      const fieldName = field.toString();

      if (!SPECIAL_FIELDS.has(fieldName) || result.hasOwnProperty(fieldName)) {
        await policy.authorizeField(fieldName);
      }
      return retrieveValue({ source, fieldName });
    }
  });

const retrieveValue = ({ source, fieldName }: { source: any; fieldName: string }): any => {
  const value = source[fieldName];
  if (typeof value === 'function') {
    return value.bind(source);
  } else {
    return value;
  }
};

class NoDefinedPolicyError extends Error {}
