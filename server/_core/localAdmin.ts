import { timingSafeEqual } from "node:crypto";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";

const LOCAL_ADMIN_PREFIX = "local_admin:";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isLocalAdminConfigured() {
  return Boolean(ENV.adminEmail && ENV.adminPassword);
}

export function getLocalAdminEmail() {
  return normalizeEmail(ENV.adminEmail);
}

export function getLocalAdminOpenId() {
  return `${LOCAL_ADMIN_PREFIX}${getLocalAdminEmail()}`;
}

export function getLocalAdminName() {
  return ENV.adminName || "LE BRIEF Admin";
}

export function isLocalAdminOpenId(openId: string) {
  return isLocalAdminConfigured() && openId === getLocalAdminOpenId();
}

export function verifyLocalAdminCredentials(email: string, password: string) {
  if (!isLocalAdminConfigured()) {
    return false;
  }

  return (
    safeCompare(normalizeEmail(email), getLocalAdminEmail()) &&
    safeCompare(password, ENV.adminPassword)
  );
}

export function buildLocalAdminUser(): User {
  const now = new Date();

  return {
    id: -2,
    openId: getLocalAdminOpenId(),
    name: getLocalAdminName(),
    email: getLocalAdminEmail(),
    loginMethod: "local",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}
