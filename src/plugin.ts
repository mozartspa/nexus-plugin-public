import { GraphQLResolveInfo } from "graphql"
import { plugin } from "nexus"
import { GetGen, MaybePromise } from "nexus/dist/typegenTypeHelpers"
import { printedGenTyping } from "nexus/dist/utils"

const fieldDefTypes = printedGenTyping({
  optional: true,
  name: "public",
  description: `Is it publicly accessible? If not, the user must be logged in or it will throw an error`,
  type: "boolean",
})

const rootNames = ["Query", "Mutation", "Subscription"]

export type PublicPluginOptions = {
  isAuthenticated: (
    root: any,
    args: any,
    ctx: GetGen<"context">,
    info: GraphQLResolveInfo
  ) => MaybePromise<boolean>
  defaultError?: Error
}

export const publicPlugin = (options: PublicPluginOptions) => {
  const { isAuthenticated, defaultError = new Error("Not authorized!") } =
    options

  return plugin({
    name: "PublicPlugin",
    fieldDefTypes,
    onCreateFieldResolver(config) {
      const isConnectedToRoot = rootNames.includes(config.parentTypeConfig.name)
      const isPublic = !!config.fieldConfig.extensions?.nexus?.config.public

      if (!isConnectedToRoot || isPublic) {
        return undefined
      }

      return async (root, args, ctx, info, next) => {
        const isAuth = await isAuthenticated(root, args, ctx, info)
        if (isAuth) {
          return next(root, args, ctx, info)
        } else {
          throw defaultError
        }
      }
    },
  })
}
