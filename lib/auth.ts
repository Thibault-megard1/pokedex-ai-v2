import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import type { User, Session } from "@/lib/types";
import { getUsers, saveUsers, getSessions, saveSessions, newId } from "@/lib/db";

const COOKIE_NAME = "pokedex_session";

export async function registerUser(username: string, password: string): Promise<User> {
  const users = await getUsers();
  const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) throw new Error("Ce pseudo est déjà utilisé.");

  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = {
    id: newId(),
    username,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await saveUsers(users);
  return user;
}

export async function verifyLogin(username: string, password: string): Promise<User> {
  const users = await getUsers();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!user) throw new Error("Identifiants invalides.");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new Error("Identifiants invalides.");

  return user;
}

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(user: User): Promise<Session> {
  const sessions = await getSessions();
  const session: Session = {
    token: makeToken(),
    userId: user.id,
    username: user.username,
    createdAt: new Date().toISOString()
  };
  sessions.push(session);
  await saveSessions(sessions);

  cookies().set(COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false
  });

  return session;
}

export async function destroySession(): Promise<void> {
  const token = cookies().get(COOKIE_NAME)?.value;
  cookies().delete(COOKIE_NAME);
  if (!token) return;

  const sessions = await getSessions();
  const filtered = sessions.filter(s => s.token !== token);
  await saveSessions(filtered);
}

export async function getCurrentSession(): Promise<Session | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;

  const sessions = await getSessions();
  return sessions.find(s => s.token === token) ?? null;
}

/**
 * Get current user from session (for API routes)
 */
export async function getUserFromRequest(): Promise<User | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  const users = await getUsers();
  return users.find(u => u.id === session.userId) ?? null;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUserFromRequest();
  return user?.isAdmin === true;
}

/**
 * Require admin access (throws if not admin)
 */
export async function requireAdmin(): Promise<User> {
  const user = await getUserFromRequest();
  if (!user) {
    throw new Error("Non authentifié");
  }
  if (user.isAdmin !== true) {
    throw new Error("Accès réservé aux administrateurs");
  }
  return user;
}
