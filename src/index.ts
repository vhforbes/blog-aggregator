import { setUser, readConfig } from "./config.ts";
import {
  createUser,
  getAllUsers,
  getUserByName,
  resetUsersTable,
} from "./lib/db/queries/users.ts";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

type CommandRegistry = Record<string, CommandHandler>;

function registerCommand(
  registry: CommandRegistry,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

async function runCommand(
  registry: CommandRegistry,
  cmdName: string,
  ...args: string[]
) {
  if (cmdName in registry) {
    const handler = registry[cmdName];
    await handler(cmdName, ...args);
  } else {
    throw new Error(`${cmdName} is not a available command`);
  }
}

async function handleLogin(cmdName: string, ...args: string[]) {
  if (!args.length) throw new Error("Login handler expects username argument");

  const name = args[0];

  const user = await getUserByName(name);

  if (!user) throw new Error("User name not found");

  setUser({
    currentUserName: name,
  });

  console.log("User has been set");

  return;
}

async function registerUser(cmdName: string, ...args: string[]) {
  if (!args.length) throw new Error("Register handler expects name argument");

  const name = args[0];

  const userExists = await getUserByName(name);

  if (userExists) throw new Error("User already exists");

  await createUser(name);

  setUser({
    currentUserName: name,
  });

  console.log("User created");
}

async function getUsers(cmdName: string, ...args: string[]) {
  const users = await getAllUsers();
  const currentUser = readConfig().currentUserName;

  users.forEach((user) => {
    console.log(
      `* ${user.name} ${user.name === currentUser ? "(current)" : ""}`,
    );
  });
}

async function resetUsers(cmdName: string, ...args: string[]) {
  await resetUsersTable();
}

async function main() {
  const args = process.argv;

  let commandRegistry: CommandRegistry = {};

  registerCommand(commandRegistry, "login", handleLogin);
  registerCommand(commandRegistry, "register", registerUser);
  registerCommand(commandRegistry, "reset", resetUsers);
  registerCommand(commandRegistry, "users", getUsers);

  const commandName = args[2];
  const commandsArguments = args.slice(3);

  if (!commandName) throw new Error("No command received by user");

  await runCommand(commandRegistry, commandName, ...commandsArguments);

  process.exit(0);
}

main();
