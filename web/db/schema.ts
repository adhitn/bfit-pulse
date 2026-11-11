import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  area: text('area').notNull(),
  level: integer('level').notNull(),
  source: text('source').notNull(),
  createdAt: integer('created_at').notNull(),
}, table => [index('reports_time_idx').on(table.createdAt), index('reports_user_idx').on(table.userId)]);

// One shared, last-successful snapshot avoids polling the public provider per visitor.
export const officialSnapshots = sqliteTable('official_snapshots', {
  id: text('id').primaryKey(),
  payload: text('payload').notNull(),
  fetchedAt: integer('fetched_at').notNull(),
});
