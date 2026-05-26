/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_actions from "../ai/actions.js";
import type * as auth from "../auth.js";
import type * as blueprints_actions from "../blueprints/actions.js";
import type * as blueprints_mutations from "../blueprints/mutations.js";
import type * as blueprints_queries from "../blueprints/queries.js";
import type * as convex__generated_api from "../convex/_generated/api.js";
import type * as convex__generated_server from "../convex/_generated/server.js";
import type * as crons from "../crons.js";
import type * as dailyLogs_scheduled from "../dailyLogs/scheduled.js";
import type * as deliveries_mutations from "../deliveries/mutations.js";
import type * as deliveries_queries from "../deliveries/queries.js";
import type * as http from "../http.js";
import type * as inspections_mutations from "../inspections/mutations.js";
import type * as inspections_queries from "../inspections/queries.js";
import type * as kanban_mutations from "../kanban/mutations.js";
import type * as kanban_queries from "../kanban/queries.js";
import type * as middleware from "../middleware.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as permits_mutations from "../permits/mutations.js";
import type * as permits_queries from "../permits/queries.js";
import type * as permits_scheduled from "../permits/scheduled.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as seed from "../seed.js";
import type * as shared_env from "../shared/env.js";
import type * as src_index from "../src/index.js";
import type * as test from "../test.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/actions": typeof ai_actions;
  auth: typeof auth;
  "blueprints/actions": typeof blueprints_actions;
  "blueprints/mutations": typeof blueprints_mutations;
  "blueprints/queries": typeof blueprints_queries;
  "convex/_generated/api": typeof convex__generated_api;
  "convex/_generated/server": typeof convex__generated_server;
  crons: typeof crons;
  "dailyLogs/scheduled": typeof dailyLogs_scheduled;
  "deliveries/mutations": typeof deliveries_mutations;
  "deliveries/queries": typeof deliveries_queries;
  http: typeof http;
  "inspections/mutations": typeof inspections_mutations;
  "inspections/queries": typeof inspections_queries;
  "kanban/mutations": typeof kanban_mutations;
  "kanban/queries": typeof kanban_queries;
  middleware: typeof middleware;
  "notifications/mutations": typeof notifications_mutations;
  "notifications/queries": typeof notifications_queries;
  "permits/mutations": typeof permits_mutations;
  "permits/queries": typeof permits_queries;
  "permits/scheduled": typeof permits_scheduled;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  seed: typeof seed;
  "shared/env": typeof shared_env;
  "src/index": typeof src_index;
  test: typeof test;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
