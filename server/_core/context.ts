import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Parse session cookie
    const cookieHeader = opts.req.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookieHeader(cookieHeader);
      const sessionCookie = cookies[COOKIE_NAME];

      if (sessionCookie) {
        // Verify JWT session token
        const session = await sdk.verifySession(sessionCookie);
        if (session?.openId) {
          // Look up user by openId
          const dbUser = await db.getUserByOpenId(session.openId);
          if (dbUser) {
            user = dbUser;
            // Update last signed in (non-blocking)
            db.upsertUser({
              openId: dbUser.openId,
              lastSignedIn: new Date(),
            }).catch(() => {});
          }
        }
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
