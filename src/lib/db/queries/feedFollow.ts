import { and, eq } from "drizzle-orm";
import { db } from "..";
import { feedFollows, feeds, users } from "../schema";

export async function createFeedFollow(userId: string, feedUrl: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.url, feedUrl));

  const [newFeedFollow] = await db
    .insert(feedFollows)
    .values({ feed_id: feed.id, user_id: userId })
    .returning();

  const [feedsResult] = await db
    .select()
    .from(feedFollows)
    .innerJoin(feeds, eq(feeds.id, newFeedFollow.feed_id))
    .innerJoin(users, eq(users.id, newFeedFollow.user_id));

  return feedsResult;
}

export async function getFeedFollowsForUser(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));

  const feedFollowsResult = await db
    .select()
    .from(feedFollows)
    .where(eq(feedFollows.user_id, user.id))
    .innerJoin(feeds, eq(feedFollows.feed_id, feeds.id))
    .innerJoin(users, eq(feedFollows.user_id, users.id));

  return feedFollowsResult;
}

export async function deleteFeedFollow(feedUrl: string, userId: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.url, feedUrl));

  const feedFollowDeleteResult = await db
    .delete(feedFollows)
    .where(
      and(eq(feedFollows.feed_id, feed.id), eq(feedFollows.user_id, userId)),
    );

  return feedFollowDeleteResult;
}
