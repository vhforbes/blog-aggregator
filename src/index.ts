import { setUser, readConfig } from "./config.ts";

type CommandHandler = (cmdName: string, ...args: string[]) => void;

type CommandRegistry = Record<string, CommandHandler>;

function handleLogin(cmdName: string, ...args: string[]) {
  if (!args.length) throw new Error("Login handler expects username argument");

  setUser({
    currentUserName: args[0],
  });

  console.log("User has been set");

  return;
}

function registerCommand(
  registry: CommandRegistry,
  cmdName: string,
  handler: CommandHandler,
) {
  registry[cmdName] = handler;
}

function runCommand(
  registry: CommandRegistry,
  cmdName: string,
  ...args: string[]
) {
  if (cmdName in registry) {
    const handler = registry[cmdName];
    handler(cmdName, ...args);
  } else {
    throw new Error(`${cmdName} is not a available command`);
  }
}

function main() {
  const args = process.argv;

  let commandRegistry: CommandRegistry = {};

  registerCommand(commandRegistry, "login", handleLogin);

  const commandName = args[2];
  const commandsArguments = args.slice(3);

  if (!commandName) throw new Error("No command received by user");

  runCommand(commandRegistry, commandName, ...commandsArguments);

  readConfig();
}

main();
