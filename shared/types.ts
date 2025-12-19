/**
 * Unified type exports
 * Define common types here rather than relying on Drizzle schema for the frontend.
 */

export interface User {
  id: number;
  openId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  tenantId: number;
  role: string;
  loginMethod?: string | null;
  lastSignedIn?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertUser extends Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> {
  openId: string;
  email: string;
  tenantId: number;
}

export * from "./_core/errors";
