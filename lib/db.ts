import path from "path";
import crypto from "crypto";
import { readJsonFile, writeJsonFile, DATA_DIR, ensureDir } from "@/lib/utils";
import type { User, Session, TeamSlot } from "@/lib/types";

const USERS_PATH = path.join(DATA_DIR, "users.json");
const SESSIONS_PATH = path.join(DATA_DIR, "sessions.json");
const TEAMS_PATH = path.join(DATA_DIR, "teams.json"); // { [userId]: TeamSlot[] }

type TeamsDb = Record<string, TeamSlot[]>;

export async function initDb() {
  await ensureDir(DATA_DIR);
  await writeJsonFile<User[]>(USERS_PATH, await readJsonFile(USERS_PATH, []));
  await writeJsonFile<Session[]>(SESSIONS_PATH, await readJsonFile(SESSIONS_PATH, []));
  await writeJsonFile<TeamsDb>(TEAMS_PATH, await readJsonFile(TEAMS_PATH, {}));
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
  return readJsonFile<Session[]>(SESSIONS_PATH, []);
}

export async function saveSessions(sessions: Session[]) {
  await writeJsonFile(SESSIONS_PATH, sessions);
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
