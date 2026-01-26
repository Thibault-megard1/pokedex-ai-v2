import path from "path";
import crypto from "crypto";
import { readJsonFile, writeJsonFile, DATA_DIR, ensureDir } from "@/lib/utils";
import type { User, Session, TeamSlot } from "@/lib/types";

const USERS_PATH = path.join(DATA_DIR, "users.json");
const SESSIONS_PATH = path.join(DATA_DIR, "sessions.json");
const TEAMS_PATH = path.join(DATA_DIR, "teams.json"); // { [userId]: TeamSlot[] }

type TeamsDb = Record<string, TeamSlot[]>;

// Cache en mémoire pour éviter les lectures répétées
let _initialized = false;
let _sessionsCache: Session[] | null = null;
let _sessionsCacheTime = 0;
const SESSION_CACHE_TTL = 5000; // 5 secondes

export async function initDb() {
  if (_initialized) return; // Skip si déjà initialisé
  
  await ensureDir(DATA_DIR);
  await writeJsonFile<User[]>(USERS_PATH, await readJsonFile(USERS_PATH, []));
  await writeJsonFile<Session[]>(SESSIONS_PATH, await readJsonFile(SESSIONS_PATH, []));
  await writeJsonFile<TeamsDb>(TEAMS_PATH, await readJsonFile(TEAMS_PATH, {}));
  
  _initialized = true;
}

export function newId() {
  return crypto.randomUUID();
}

export async function getUsers(): Promise<User[]> {
  await initDb();
  return readJsonFile<User[]>(USERS_PATH, []);
}

export async function saveUsers(users: User[]) {
  await writeJsonFile(USERS_PATH, users);
}

export async function getSessions(): Promise<Session[]> {
  await initDb();
  
  // Utiliser le cache si valide
  const now = Date.now();
  if (_sessionsCache && (now - _sessionsCacheTime) < SESSION_CACHE_TTL) {
    return _sessionsCache;
  }
  
  // Sinon, lire le fichier et mettre en cache
  const sessions = await readJsonFile<Session[]>(SESSIONS_PATH, []);
  _sessionsCache = sessions;
  _sessionsCacheTime = now;
  return sessions;
}

export async function saveSessions(sessions: Session[]) {
  await writeJsonFile(SESSIONS_PATH, sessions);
  // Invalider le cache
  _sessionsCache = sessions;
  _sessionsCacheTime = Date.now();
}

export async function getTeamsDb(): Promise<TeamsDb> {
  await initDb();
  return readJsonFile<TeamsDb>(TEAMS_PATH, {});
}

export async function saveTeamsDb(db: TeamsDb) {
  await writeJsonFile(TEAMS_PATH, db);
}

export async function getTeam(userId: string): Promise<TeamSlot[]> {
  const db = await getTeamsDb();
  return db[userId] ?? [];
}

export async function setTeam(userId: string, team: TeamSlot[]): Promise<void> {
  const db = await getTeamsDb();
  db[userId] = team;
  await saveTeamsDb(db);
}
