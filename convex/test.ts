import { query } from './_generated/server';

export const listUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    return users;
  },
});
