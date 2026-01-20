import { waitForDebugger } from "node:inspector";
import { db } from "../index";
import { users } from "../schema";
import { eq } from "drizzle-orm";

export async function createUser(name: string) {
  const [result] = await db.insert(users).values({ name });

  return result;
}

export async function getUserByName(name: string) {
  const [result] = await db.select().from(users).where(eq(users.name, name));

  return result;
}

export async function getAllUsers() {
  const usersList = await db.select().from(users);

  return usersList;
}

export async function resetUsersTable() {
  const [result] = await db.delete(users);

  return result;
}
