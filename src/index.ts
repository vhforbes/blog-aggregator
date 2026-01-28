import { XMLParser } from "fast-xml-parser";
import { setUser, readConfig } from "./config.ts";
import {
  createUser,
  getAllUsers,
  getUserByName,
  resetUsersTable,
} from "./lib/db/queries/users.ts";
import {
  createFeed,
  getFeeds,
  getNextFeedToFetch,
  markFeedFetched,
} from "./lib/db/queries/feeds.ts";
import {
  createFeedFollow,
  deleteFeedFollow,
  getFeedFollowsForUser,
} from "./lib/db/queries/feedFollow.ts";
import { User } from "./lib/db/schema.ts";
import { createPost, getPostsForUser } from "./lib/db/queries/posts.ts";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

type CommandRegistry = Record<string, CommandHandler>;

type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

function middlewareLoggedIn(
  userCmdHandler: UserCommandHandler,
): CommandHandler {
  return async (cmdName: string, ...args: string[]) => {
    const { currentUserName } = readConfig();

    if (!currentUserName) {
      throw new Error("User not logged in");
    }

    const user = await getUserByName(currentUserName);

    if (!user) {
      throw new Error(`User ${currentUserName} not found`);
    }

    return userCmdHandler(cmdName, user, ...args);
  };
}

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

async function fetchFeed(feedURL: string) {
  try {
    const res = await fetch(feedURL, {
      headers: {
        "User-Agent": "gator",
      },
    });

    const data = await res.text();

    const xmlParser = new XMLParser();

    const parsedXML = xmlParser.parse(data) as {
      rss: RSSFeed;
    };

    // console.log(parsedXML);

    if (!parsedXML.rss.channel)
      throw new Error("XML does not contain channel property");

    const channel = parsedXML.rss.channel;

    const requiredFields = ["title", "link", "description"];

    requiredFields.forEach((field) => {
      if (field in channel) {
        return;
      } else {
        throw new Error(` Missing field ${field} in channel`);
      }
    });

    const items: RSSItem[] = [];

    const validItemObject = (item: RSSItem): boolean => {
      const requiredItemFields = ["title", "link", "description", "pubDate"];

      let validItem = false;

      requiredItemFields.forEach((requiredItem: string) => {
        if (requiredItem in item) {
          validItem = true;
        }
      });

      return validItem;
    };

    if (channel.item && Array.isArray(channel.item)) {
      console.log("Is array");

      channel.item.forEach((item: RSSItem) => {
        if (validItemObject(item)) {
          items.push(item);
        }
      });
    } else if (channel.item && typeof channel.item === "object") {
      console.log("Is Object");

      if (validItemObject(channel.item)) {
        items.push(channel.item);
      }
    } else {
      console.log("channel.item is not array or object", channel.item);
    }

    const finalFeed: RSSFeed = {
      channel: {
        title: channel.title,
        description: channel.description,
        link: channel.link,
        item: items,
      },
    };

    return finalFeed;
  } catch (error) {
    console.log("Failed to make request", error);
  }
}

async function fetchFeedHandler(cmdName: string, ...args: string[]) {
  // if (!args.length) throw new Error("Feed handler expects url argument");

  // const url = args[0];

  const feed = await fetchFeed("https://www.wagslane.dev/index.xml");

  console.log(JSON.stringify(feed));
}

async function createFeedHandler(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (!args.length)
    throw new Error("Feed handler expects name and url arguments");

  const name = args[0];
  const url = args[1];

  const createdFeed = await createFeed(name, url, user.id);
  const feedFollow = await createFeedFollow(user.id, createdFeed.url);

  console.log(feedFollow);
}

async function fetchFeedsHandler(cmdName: string, ...args: string[]) {
  const feeds = await getFeeds();

  console.log(feeds);

  return;
}

async function handleFollow(cmdName: string, user: User, ...args: string[]) {
  const url = args[0];

  const feedFollow = await createFeedFollow(user.id, url);

  console.log(feedFollow);
}

async function getUserFeeds(cmdName: string, user: User, ...args: string[]) {
  const feedFollowsForUser = await getFeedFollowsForUser(user.id);

  console.log(feedFollowsForUser);
}

async function unfollowFeed(cmdName: string, user: User, ...args: string[]) {
  const url = args[0];

  const result = await deleteFeedFollow(url, user.id);

  console.log("deleted feed result", result);
}

async function scrapeFeeds() {
  const feed = await getNextFeedToFetch();

  const feedFetched = await fetchFeed(feed.url);

  await markFeedFetched(feed.id);

  const feedItems = feedFetched?.channel.item;

  feedItems?.forEach(async (item) => {
    await createPost({
      title: item.title,
      feedId: feed.id,
      publishedAt: new Date(item.pubDate),
      url: item.link,
      description: item.description,
    });
  });
}

async function triggerScrapeFeeds(cmdName: string, ...args: string[]) {
  const timeBtwnReqs = args[0];

  console.log("Collecting feeds every ", timeBtwnReqs);

  const intervalDuration = parseDuration(timeBtwnReqs);

  await scrapeFeeds().catch(() => new Error("Failed to scrape feed"));

  const interval = setInterval(async () => {
    await scrapeFeeds().catch(() => new Error("Failed to scrape feed"));
  }, intervalDuration);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error("Duration not valid");
  }

  const time = match[2];

  switch (time) {
    case "ms":
      return parseInt(match[1]) * 1;

    case "s":
      return parseInt(match[1]) * 1000;

    case "m":
      return parseInt(match[1]) * 1000 * 60;

    case "h":
      return parseInt(match[1]) * 1000 * 60 * 60;

    default:
      throw new Error("Unknown time unit");
  }
}

async function handleBrowse(cmdName: string, user: User, ...args: string[]) {
  const limit = args[0];

  const posts = await getPostsForUser(user.id, parseInt(limit));

  console.log(posts);
}

async function main() {
  const args = process.argv;

  let commandRegistry: CommandRegistry = {};

  registerCommand(commandRegistry, "login", handleLogin);
  registerCommand(commandRegistry, "register", registerUser);
  registerCommand(commandRegistry, "reset", resetUsers);
  registerCommand(commandRegistry, "users", getUsers);
  registerCommand(commandRegistry, "agg", triggerScrapeFeeds);
  registerCommand(
    commandRegistry,
    "addfeed",
    middlewareLoggedIn(createFeedHandler),
  );
  registerCommand(commandRegistry, "feeds", fetchFeedsHandler);
  registerCommand(commandRegistry, "follow", middlewareLoggedIn(handleFollow));
  registerCommand(
    commandRegistry,
    "following",
    middlewareLoggedIn(getUserFeeds),
  );
  registerCommand(
    commandRegistry,
    "unfollow",
    middlewareLoggedIn(unfollowFeed),
  );
  registerCommand(commandRegistry, "browse", middlewareLoggedIn(handleBrowse));

  const commandName = args[2];
  const commandsArguments = args.slice(3);

  if (!commandName) throw new Error("No command received by user");

  await runCommand(commandRegistry, commandName, ...commandsArguments);

  process.exit(0);
}

main();
