# @mozartspa/nexus-plugin-public

A Nexus schema plugin to deny access to all queries, mutations and subscriptions except those marked as public.

## Install

```bash
# npm
npm i @mozartspa/nexus-plugin-public

# yarn
yarn add @mozartspa/nexus-plugin-public
```

> `nexus` and `graphql` are required, but if you are using Nexus then both of those should already be installed.

## Usage

Once installed you need to add the plugin to your nexus schema configuration:

```ts
import { makeSchema } from "nexus"
import { publicPlugin } from "@mozartspa/nexus-plugin-public"

const schema = makeSchema({
  // ...
  plugins: [
    // ...
    publicPlugin({
      isAuthenticated: async (root, args, ctx) => {
        // Place here your logic.
        // It should return `true` if authenticated, `false` otherwise.
        // It can be an async function.

        // In this case we simply check that a user object
        // is present in the context.
        return !!ctx.user
      },
      defaultError: new Error("Unauthorized!"),
      // ^--> Optional: errot that is thrown when not authorized.
    }),
  ],
})
```

Then mark as `public` the queries, mutations and subscriptions that don't need an authenticated user:

```ts
queryField("news", {
  type: list("News"),
  public: true, // <-- marked as public
  resolve: async (root, args, ctx) => {
    // ...
  },
})

mutationField("login", {
  type: "LoginOutput",
  public: true, // <-- marked as public
  args: {
    // ...
  },
  resolve: async (root, args, ctx) => {
    // ...
  },
})
```
