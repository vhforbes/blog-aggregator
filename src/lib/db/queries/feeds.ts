import { eq } from "drizzle-orm";
import { db } from "..";
import { feeds, users } from "../schema";
import { getUserByName } from "./users";

export async function createFeed(name: string, url: string, userName: string) {
  const user = await getUserByName(userName);

  if (!user) throw new Error(`User with name ${userName} not found`);

  const [result] = await db
    .insert(feeds)
    .values({ name, url, user_id: user.id });

  return result;
}

export async function getFeeds() {
  const result = await db
    .select()
    .from(feeds)
    .leftJoin(users, eq(users.id, feeds.user_id));

  return result;
}
