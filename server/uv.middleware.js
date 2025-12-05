import { createBareServer } from "uvod/bare";
import { createServer } from "uvod/server";

const bare = createBareServer();

export function UVMiddleware(req, res, next) {
  if (bare.routeRequest(req, res)) return;
  next();
}
