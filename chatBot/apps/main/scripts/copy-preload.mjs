import fs from "node:fs/promises";
import path from "node:path";

const sourcePath = path.resolve("src/preload.cjs");
const targetPath = path.resolve("dist/preload.cjs");

await fs.mkdir(path.dirname(targetPath), { recursive: true });
await fs.copyFile(sourcePath, targetPath);
