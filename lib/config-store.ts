import "server-only";
import { mkdir, readFile, rename, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { appConfigSchema, defaultConfig, type AppConfig } from "./app-config";

const dataDirectory = path.resolve(process.env.ROSHAN_DATA_DIR || path.join(process.cwd(), "data"));
const configFile = path.join(dataDirectory, "config.json");
let pendingWrite = Promise.resolve();

/** One Node process owns this file. Deploy with one worker or replace with a database. */
export async function readAppConfig(): Promise<AppConfig> {
  await pendingWrite;
  try { return appConfigSchema.parse(JSON.parse(await readFile(configFile, "utf8"))); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(defaultConfig);
    throw new Error("CONFIG_READ_FAILED");
  }
}

export async function saveAppConfig(input: unknown): Promise<AppConfig> {
  const config = appConfigSchema.parse(input);
  const write = pendingWrite.then(async () => {
    await mkdir(dataDirectory, { recursive: true, mode: 0o700 });
    const temporary = path.join(dataDirectory, `.config-${randomUUID()}.tmp`);
    try {
      await writeFile(temporary, JSON.stringify(config, null, 2) + "\n", { encoding: "utf8", mode: 0o600, flag: "wx" });
      await rename(temporary, configFile);
    } finally { await unlink(temporary).catch(() => undefined); }
  });
  pendingWrite = write.catch(() => undefined);
  await write;
  return config;
}

export function publicAppConfig(config: AppConfig): AppConfig {
  return { ...config, resources: config.resources.filter((resource) => resource.published) };
}
