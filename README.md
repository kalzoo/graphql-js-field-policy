# GraphQL-JS Field Policy

## Intuitive, policy-based, field-level authorization for GraphQL JS

### Getting Started

* Install with `npm i --save graphql-field-policy` or `yarn add graphql-field-policy`
* Import alongside your GraphQL schema:

```ts
import { fieldPolicy } from 'graphql-field-policy'

// or

const { fieldPolicy } = require('graphql-field-policy');
```

The tests, located in the `test/` directory, are written as a readable example of implementation.

### Why: Policy-Based Authorization

Previous, public attempts to introduce field-level authorization into GraphQL JS schemas involve one of two approaches:

* An extra dependency layer, such as Prisma, or
* Authorization logic within the resolver

It's best to avoid extra dependencies when we can, and including authorization logic within the resolver can become unwieldy and easily lend itself to oversight, especially with the power of GraphQL. Consider the following query:

```graphql
query GetCustomers {
  customers {
    banks {
      accounts {
        balance
      }
    }
  }
}
```

Authorization here has to happen at 6 different levels:

1. Should the user be able to query `customers` at all?
2. Should the user be able to view each customer record returned?
3. For each customer record returned, should the user be able to query `banks`?
4. Should the user be able to view each bank?
5. For each bank, should the user be able to view accounts?
6. For each account, should the user be able to view the balance?

If you leave your authorization logic to the resolver, it may be difficult to grok your overall approach to user authorization, once your schema becomes more complex.

### Policies

Those coming from the worlds of Ruby and Rails will see similarities with the excellent `pundit` gem, which was the inspiration for this policy model.

JS lacks some of the magic that Pundit relied upon, and so policy implementation here is both simpler and more limited.

A policy inherits from this library's `Policy` class. If you're using TypeScript, note the two type parameters, `ContextType` and `RecordType`.

A policy's _context_ defines the environment it operates within, and generally carries information about the authenticated user, and possibly the request itself. That's up to you.

A policy's _record type_ is simply the type of record it will be authorizing against. If you model using class `Book`, for example, that's the `RecordType`.

A policy has a set of standard methods which you can override:
* `show`
* `index`
* `create`
* `update`
* `destroy`
* `manage`: access to all methods and fields, generally reserved for admin users
* `field(fieldName)`
* `authorize(operation)`: rather than returning `false` on an unauthorized operation, will throw an `UnknownOperationError | NotAuthorizedError`
* `authorizeField(fieldName)`: similar to `authorize` but for individual fields

Only `field`, `manage`, `show`, and `authorize*` are currently integrated with GraphQL.

`Policy#field` takes a field name as its only parameter, and returns `true` if the field of the policy's guarded record may be read by its user within the given context, and `false` otherwise. For example, if a `policy` guards a `Book`, and that book may have a `published` attribute, then you may authorize access to the `price` field based on whether or not the user works for the publisher:

```ts
field(name: string) {
  switch(name) {
    case 'price': 
      return this.record.published || this.context.user.worksForPublisherId = this.record.publisherId
    default:
      return false;
  }
}

show() {
  return true
}
```

In this case, the book itself has been authorized to query fields from because `show` returns `true`. `field` returns an implicit deny with `default: return false`, and so all other fields will deny access to all users.

`Policy#show`, as shown above, guards read access to the resolved entity as a whole, which maps to a `DocumentNode` in your GraphQL Schema.

`Policy#manage` authorizes all access to the object and all fields, to prevent repetitive checks like `return user.isAdmin` on individual operations and fields.

`Policy#authorize` and `Policy#authorizeField` are similar, except that they take an operation name (like `show`) or a field name (like `price`), query it, and throw an error if the return value is false. Within GraphQL, the error will travel back up the tree and be returned to the user.

The root `Policy` class has many other methods, such as `new`, `edit`, and `create`, that you can easily use and override for use within your own models - but those operations are not yet used by the Field Policy GraphQL implementation. Before those are implemented, you can use them within your resolvers like so:

```ts
const myResolver = (object, args, context, info) => {
  new MyPolicy(context, object).authorize('update'); // Will throw an error if unauthorized
  return object.doMutatingThing(args);
}
```

### Field Policy

On their own, policies are a good and intuitive way to collect the authorization logic from across your application. Using the `fieldPolicy` resolver wrapper, we can adapt those policies to a GraphQL schema.

Two parts are necessary: 
* A `policyMap` of GraphQLTypes to Policy classes
* A `fieldPolicy` wrapper on each resolver you want to authorize

See [the test schema](test/schema.ts) for a working example of `fieldPolicy` implementation.

The `policyMap` may also have a `__default` key which provides a fallback in case no other policies are available. In most cases, this is discouraged because of the small number of policies actually required to maintain the mapping, and because a default policy may cause unintended and overlooked false positives or negatives in authorization.

### Features

There are two planned features in development:

* Authorization for mutations and subscriptions
* A single authorization wrapper around the entire GraphQL schema, to prevent having to wrap each individual resolver in a `fieldPolicy`

### Contributing

Contributions are welcome! The repo has resources to help you get started:

* The `.vscode/` directory contains the settings to hook the debugger into Jest test runs
* Jest tests can be run with `yarn test`
* If you want to develop/test this module alongside another package, you'll have to take a couple steps in order to avoid an error that looks like this:

    Cannot use GraphQLList "[Request]" from another module or realm.\n\nEnsure that there is only one instance of "graphql" in the node_modules\ndirectory. If different versions of "graphql" are the dependencies of other\nrelied on modules, use "resolutions" to ensure only one version is installed.\n\nhttps://yarnpkg.com/en/docs/selective-version-resolutions\n\nDuplicate "graphql" modules cannot be used at the same time since different\nversions may have different capabilities and behavior. The data from one\nversion used in the function from another could produce confusing and\nspurious results.

1. `rm -rf node_modules` within this package to clear those out
2. `yarn install --production` to install without the `devDependencies`
3. Within your other project, where `graphql` is installed:
  * `cd node_modules/graphql && yarn link`
  * If using typescript, then `cd ../@types/graphql && yarn link`
4. Return to *this* package and run `yarn link "graphql" && yarn link "@types/graphql"`. Now this package will build using the graphql version from your other project.