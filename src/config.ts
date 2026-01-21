import fs from "fs";
import os from "os";
import path from "path";

type Config = {
  dbUrl: string;
  currentUserName: string;
};

const configLocation = path.join(os.homedir(), ".gatorconfig.json");

export function setUser(config: Partial<Config>) {
  const existingGatorconfig = fs.readFileSync(configLocation, {
    encoding: "utf-8",
  });

  const parsedExistingConfig = JSON.parse(existingGatorconfig);

  const jsonConfig = {
    db_url: config.dbUrl ?? parsedExistingConfig.db_url,
    current_user_name: config.currentUserName,
  };

  fs.writeFileSync(configLocation, JSON.stringify(jsonConfig));
}

export function readConfig() {
  const gatorconfig = fs.readFileSync(configLocation, {
    encoding: "utf-8",
  });

  const precessedConfig = JSON.parse(gatorconfig);

  const finalConfig: Config = {
    dbUrl: precessedConfig.db_url,
    currentUserName: precessedConfig.current_user_name,
  };

  return finalConfig;
}
