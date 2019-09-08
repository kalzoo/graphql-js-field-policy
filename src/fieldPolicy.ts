import { GraphQLOutputType, GraphQLResolveInfo, isLeafType, isListType } from 'graphql';

type PolicyClass<T> = {
  new (...args: any[]): T;
};

interface PolicyMap {
  [typename: string]: PolicyClass<any>;
}

interface FieldPolicyOptions {
  policyMap: PolicyMap;
}

class NoDefinedPolicyError extends Error {}

const getPolicyClass = (policyMap: PolicyMap, graphqlType: GraphQLOutputType): PolicyClass<any> => {
  let innerType = graphqlType;

  // Recursively strip off non-null and list type wrappers to find the inner type
  while ('ofType' in innerType) {
    innerType = innerType.ofType;
  }

  const policyClass = policyMap[innerType.toString()];
  if (policyClass) return policyClass;

  throw new NoDefinedPolicyError(`[FieldAuthorizer] No mapped policy found for ${innerType}`);
};

const authorizeShow = (resolver: Function, fieldPolicyOptions: FieldPolicyOptions) => async (
  parent: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo
): Promise<any> => {
  const result = await resolver(parent, args, context, info);

  if (isLeafType(info.returnType)) {
    return result;
  }

  const { policyMap } = fieldPolicyOptions;
  const policyClass = getPolicyClass(policyMap, info.returnType);
  if (policyClass) {
    if (isListType(info.returnType)) {
      await Promise.all(
        result.map(async (item: any) => {
          await new policyClass(context, item).authorize('show');
        })
      );
    } else {
      await new policyClass(context, result).authorize('show');
    }
  }
  return result;
};

const authorizeFieldOnParent = (options: FieldPolicyOptions) => async (
  parent: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo
): Promise<void> => {
  const { policyMap } = options;
  const parentPolicyClass = getPolicyClass(policyMap, info.parentType);
  const parentPolicy = new parentPolicyClass(context, parent);
  return await parentPolicy.authorizeField(info.fieldName);
};

const fieldPolicy = (resolver: Function, options: FieldPolicyOptions): any => async (
  parent: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo
): Promise<any> => {
  if (parent) await authorizeFieldOnParent(options)(parent, args, context, info);
  return await authorizeShow(resolver, options)(parent, args, context, info);
};

export default fieldPolicy;
