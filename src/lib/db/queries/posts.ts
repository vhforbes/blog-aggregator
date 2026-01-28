import { desc, eq } from "drizzle-orm";
import { db } from "..";
import { feedFollows, feeds, posts } from "../schema";
import { getFeedFollowsForUser } from "./feedFollow";

export async function createPost({
  title,
  url,
  description,
  publishedAt,
  feedId,
}: {
  title: string;
  url: string;
  description: string;
  publishedAt: Date;
  feedId: string;
}) {
  const [created] = await db
    .insert(posts)
    .values({
      title,
      url,
      description,
      feed_id: feedId,
      publishedAt,
    })
    .onConflictDoNothing({ target: posts.url })
    .returning();

  console.log("Created post, ", created);

  return created;
}

export async function getPostsForUser(userId: string, limit: number) {
  const result = await db
    .select()
    .from(posts)
    .innerJoin(feedFollows, eq(posts.feed_id, feedFollows.feed_id))
    .innerJoin(feeds, eq(posts.feed_id, feeds.id))
    .where(eq(feedFollows.user_id, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  return result;
}
