import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the self-hosted auth router.
 * Covers: register, login, logout, me, updateProfile
 */

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$10$hashedpassword"),
    compare: vi.fn(),
  },
}));

// Mock the SDK
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-jwt-token"),
    verifySession: vi.fn(),
  },
}));

// Mock the DB module
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserByOpenId: vi.fn(),
  createUserWithPassword: vi.fn(),
  getOrCreateDefaultTenant: vi.fn(),
}));

// Mock drizzle schema
vi.mock("../drizzle/schema", () => ({
  users: { id: "id", openId: "openId", email: "email", name: "name" },
}));

import bcrypt from "bcryptjs";
import { sdk } from "./_core/sdk";
import {
  getDb,
  getUserByEmail,
  createUserWithPassword,
  getOrCreateDefaultTenant,
} from "./db";

const mockedGetUserByEmail = vi.mocked(getUserByEmail);
const mockedCreateUserWithPassword = vi.mocked(createUserWithPassword);
const mockedGetOrCreateDefaultTenant = vi.mocked(getOrCreateDefaultTenant);
const mockedBcryptCompare = vi.mocked(bcrypt.compare);
const mockedGetDb = vi.mocked(getDb);

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-open-id",
      email: "leo@meridianos.ai",
      name: "Leo",
      loginMethod: "password",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Me ─────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null when not authenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user when authenticated", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result!.email).toBe("leo@meridianos.ai");
    expect(result!.name).toBe("Leo");
  });
});

// ─── Register ───────────────────────────────────────────────────────────────

describe("auth.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects registration with existing email", async () => {
    mockedGetUserByEmail.mockResolvedValue({
      id: 1,
      email: "existing@test.com",
      passwordHash: "hash",
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        email: "existing@test.com",
        password: "password123",
        name: "Test User",
      })
    ).rejects.toThrow("An account with this email already exists");
  });

  it("rejects registration with short password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        email: "new@test.com",
        password: "12345",
        name: "Test User",
      })
    ).rejects.toThrow();
  });

  it("rejects registration with invalid email", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({
        email: "not-an-email",
        password: "password123",
        name: "Test User",
      })
    ).rejects.toThrow();
  });

  it("successfully registers a new user", async () => {
    mockedGetUserByEmail.mockResolvedValue(null as any);
    mockedCreateUserWithPassword.mockResolvedValue(42);
    mockedGetOrCreateDefaultTenant.mockResolvedValue({ id: 1, name: "Test" } as any);

    // Mock getDb for fetching the newly created user
    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            {
              id: 42,
              openId: "new-open-id",
              email: "new@test.com",
              name: "Test User",
            },
          ]),
        }),
      }),
    });
    mockedGetDb.mockResolvedValue({ select: mockSelect } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.register({
      email: "new@test.com",
      password: "password123",
      name: "Test User",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("new@test.com");
    expect(result.user.name).toBe("Test User");
    expect(mockedCreateUserWithPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@test.com",
        name: "Test User",
      })
    );
    // Verify tenant was auto-created
    expect(mockedGetOrCreateDefaultTenant).toHaveBeenCalledWith(42, "Test User");
    // Verify cookie was set
    expect(ctx.res.cookie).toHaveBeenCalled();
  });
});

// ─── Login ──────────────────────────────────────────────────────────────────

describe("auth.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects login with non-existent email", async () => {
    mockedGetUserByEmail.mockResolvedValue(null as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "nobody@test.com",
        password: "password123",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects login with wrong password", async () => {
    mockedGetUserByEmail.mockResolvedValue({
      id: 1,
      openId: "test-id",
      email: "leo@meridianos.ai",
      name: "Leo",
      passwordHash: "$2a$10$hashedpassword",
    } as any);
    mockedBcryptCompare.mockResolvedValue(false as never);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "leo@meridianos.ai",
        password: "wrongpassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects login for user without password (OAuth-only user)", async () => {
    mockedGetUserByEmail.mockResolvedValue({
      id: 1,
      openId: "test-id",
      email: "oauth@test.com",
      name: "OAuth User",
      passwordHash: null,
    } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "oauth@test.com",
        password: "password123",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("successfully logs in with correct credentials", async () => {
    mockedGetUserByEmail.mockResolvedValue({
      id: 1,
      openId: "leo-open-id",
      email: "leo@meridianos.ai",
      name: "Leo",
      passwordHash: "$2a$10$hashedpassword",
    } as any);
    mockedBcryptCompare.mockResolvedValue(true as never);

    // Mock getDb for updating lastSignedIn
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    mockedGetDb.mockResolvedValue({ update: mockUpdate } as any);

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: "leo@meridianos.ai",
      password: "demo123",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("leo@meridianos.ai");
    expect(result.user.name).toBe("Leo");
    // Verify cookie was set
    expect(ctx.res.cookie).toHaveBeenCalled();
  });
});

// ─── Logout ─────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

// ─── Update Profile ─────────────────────────────────────────────────────────

describe("auth.updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates user name", async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    mockedGetDb.mockResolvedValue({ update: mockUpdate } as any);

    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.updateProfile({ name: "Leo Zhou" });

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("rejects empty name", async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.updateProfile({ name: "" })
    ).rejects.toThrow();
  });
});
