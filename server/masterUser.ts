import { storage } from "./storage";
import { hashPassword } from "./localAuth";
import { roleEnum, type UpsertUser } from "@shared/schema";
import { normalizeEmail } from "./utils/normalizeEmail";
import logger from './utils/logger';


const MASTER_ROLES = [...roleEnum.enumValues];

function readEnv(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export async function ensureMasterUser(): Promise<void> {
  const emailEnv = readEnv("MASTER_USER_EMAIL");
  const password = readEnv("MASTER_USER_PASSWORD");

  if (!emailEnv || !password) {
    return;
  }

  const email = normalizeEmail(emailEnv);

  if (password.length < 12) {
    logger.warn("[master-user] MASTER_USER_PASSWORD must be at least 12 characters; skipping master user bootstrap.");
    return;
  }

  try {
    const firstName = readEnv("MASTER_USER_FIRST_NAME") ?? "Master";
    const lastName = readEnv("MASTER_USER_LAST_NAME") ?? "Admin";
    const organizationName = readEnv("MASTER_USER_ORGANIZATION") ?? "Platform Control";

    const hashedPassword = await hashPassword(password);

    const payload: UpsertUser = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      organizationName,
      role: "admin",
      accountStatus: "active",
      subscriptionPlan: "full",
      isActive: true,
      isVerified: true,
    };

    const user = await storage.upsertUser(payload);

    await Promise.all(
      MASTER_ROLES.map(async (role) => {
        await storage.addUserRole(user.id, role);
      }),
    );

    logger.info(`[master-user] Bootstrap user ensured for ${email}`);
  } catch (error) {
    logger.error("[master-user] Failed to bootstrap master user", error);
  }
}
