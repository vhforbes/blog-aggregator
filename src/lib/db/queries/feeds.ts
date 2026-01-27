import { eq } from "drizzle-orm";
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
