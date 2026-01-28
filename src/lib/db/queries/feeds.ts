import { desc, eq } from "drizzle-orm";
import { db } from "..";
import { feeds, users } from "../schema";
import { getUserByName } from "./users";

export async function createFeed(name: string, url: string, userId: string) {
  const [result] = await db
    .insert(feeds)
    .values({ name, url, user_id: userId })
    .returning();

  return result;
}

export async function getFeeds() {
  const result = await db
    .select()
    .from(feeds)
    .leftJoin(users, eq(users.id, feeds.user_id));

  return result;
}

export async function getFeed(feedId: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.id, feedId));

  return feed;
}

export async function markFeedFetched(feedId: string) {
  await db
    .update(feeds)
    .set({ updatedAt: new Date(), lastFetchedAt: new Date() })
    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
  const [feed] = await db
    .select()
    .from(feeds)
    .orderBy(desc(feeds.lastFetchedAt));

  return feed;
}
