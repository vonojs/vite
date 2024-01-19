import { dirname, join } from "path";
import { Adapter } from "../index";
import { node } from "unenv";
import { fileURLToPath } from "url";

export default () =>
  Adapter({
    name: "node-server",
    runtime: join(dirname(fileURLToPath(import.meta.url)), "entry"),
    outDir: "dist/",
    serverDir: "dist",
    publicDir: "dist/public",
    entryName: "entry",
    env: node,
  });
