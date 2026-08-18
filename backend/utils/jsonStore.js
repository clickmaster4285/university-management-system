import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createJsonStore(fileName) {
  const filePath = path.join(__dirname, "..", "data", fileName);

  async function readAll() {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw);
  }

  async function writeAll(records) {
    await writeFile(filePath, JSON.stringify(records, null, 2), "utf-8");
  }

  return { readAll, writeAll };
}
