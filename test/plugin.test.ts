import { graphql } from "graphql"
import { makeSchema, objectType } from "nexus"
import { list, mutationField, queryField, stringArg } from "nexus/dist/core"
import { publicPlugin } from "../src"

describe("publicPlugin", () => {
  const schemaTypes = [
    objectType({
      name: "User",
      definition(t) {
        t.int("id")
      },
    }),
    queryField("users", {
      type: list("User"),
      // @ts-ignore
      public: true,
      resolve: () => [{ id: 1 }],
    }),
    queryField("me", {
      type: "User",
      resolve: () => ({ id: 1 }),
    }),
    mutationField("login", {
      type: "User",
      // @ts-ignore
      public: true,
      args: {
        email: stringArg(),
        password: stringArg(),
      },
      resolve: () => ({ id: 1 }),
    }),
    mutationField("updateProfile", {
      type: "User",
      resolve: () => ({ id: 1 }),
    }),
  ]

  const testSchema = makeSchema({
    outputs: false,
    types: schemaTypes,
    nonNullDefaults: {
      output: true,
    },
    plugins: [
      publicPlugin({
        isAuthenticated: (_root, _args, ctx) => {
          return ctx.user != null
        },
      }),
    ],
  })

  const authenticatedCtx = { user: { id: 1 } }

  const testQuery = (query: string, ctx: any = {}, schema = testSchema) => {
    return graphql(
      schema,
      `
        query {
          ${query} {
            id
          }
        }
      `,
      {},
      ctx
    )
  }

  const testMutation = (
    mutation: string,
    ctx: any = {},
    schema = testSchema
  ) => {
    return graphql(
      schema,
      `
        mutation {
          ${mutation} {
            id
          }
        }
      `,
      {},
      ctx
    )
  }

  it("should forbid access to non-public query, only when unauthenticated", async () => {
    const r1 = await testQuery("me")
    expect(r1.data).toBeNull()
    expect(r1.errors.length).toEqual(1)
    expect(r1.errors[0].message).toEqual("Not authorized!")

    const r2 = await testQuery("me", authenticatedCtx)
    expect(r2.data).not.toBeNull()
    expect(r2.errors).toBe(undefined)
  })

  it("should grant access to public query", async () => {
    const r1 = await testQuery("users")
    expect(r1.errors).toBe(undefined)

    const r2 = await testQuery("users", authenticatedCtx)
    expect(r2.errors).toBe(undefined)
  })

  it("should forbid access to non-public mutation, only when unauthenticated", async () => {
    const r1 = await testMutation("updateProfile")
    expect(r1.data).toBeNull()
    expect(r1.errors.length).toEqual(1)
    expect(r1.errors[0].message).toEqual("Not authorized!")

    const r2 = await testMutation("updateProfile", authenticatedCtx)
    expect(r2.data).not.toBeNull()
    expect(r2.errors).toBe(undefined)
  })

  it("should grant access to public mutation", async () => {
    const r1 = await testMutation(`login(email: "xxx", password: "yyy")`)
    expect(r1.errors).toBe(undefined)

    const r2 = await testMutation(
      `login(email: "xxx", password: "yyy")`,
      authenticatedCtx
    )
    expect(r2.errors).toBe(undefined)
  })

  it("should use custom error", async () => {
    const schema = makeSchema({
      outputs: false,
      types: schemaTypes,
      nonNullDefaults: {
        output: true,
      },
      plugins: [
        publicPlugin({
          isAuthenticated: (_root, _args, ctx) => {
            return ctx.user != null
          },
          defaultError: new Error("Uh oh!"),
        }),
      ],
    })

    function testQuery(query: string, ctx: any = {}) {
      return graphql(
        schema,
        `
            query {
              ${query} {
                id
              }
            }
          `,
        {},
        ctx
      )
    }

    const { data, errors } = await testQuery("me")
    expect(data).toBeNull()
    expect(errors.length).toEqual(1)
    expect(errors[0].message).toEqual("Uh oh!")
  })
})
