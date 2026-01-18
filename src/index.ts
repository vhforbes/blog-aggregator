import { setUser, readConfig } from "./config.ts";

function main() {
  setUser({
    currentUserName: "Forbes",
  });

  const config = readConfig();

  console.log(config);
}

main();
