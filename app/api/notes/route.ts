import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { readJsonFile, writeJsonFile, DATA_DIR } from "@/lib/utils";
import path from "path";

const NOTES_FILE = path.join(DATA_DIR, "notes.json");

type Note = {
  userId: string;
  pokemonId: number;
  pokemonName: string;
  note: string;
  rating: number; // 1-5
  tags: string[];
  updatedAt: string;
};

async function getNotes(): Promise<Note[]> {
  try {
    return await readJsonFile<Note[]>(NOTES_FILE);
  } catch {
    return [];
  }
}

async function saveNotes(notes: Note[]) {
  await writeJsonFile(NOTES_FILE, notes);
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pokemonId = url.searchParams.get("pokemonId");

  const notes = await getNotes();
  
  if (pokemonId) {
    const note = notes.find(n => n.userId === user.id && n.pokemonId === parseInt(pokemonId));
    return NextResponse.json({ note: note || null });
  }

  const userNotes = notes.filter(n => n.userId === user.id);
  return NextResponse.json({ notes: userNotes });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { pokemonId, pokemonName, note, rating, tags } = body;

  let notes = await getNotes();
  
  const existing = notes.findIndex(n => n.userId === user.id && n.pokemonId === pokemonId);
  
  const noteData: Note = {
    userId: user.id,
    pokemonId,
    pokemonName,
    note: note || "",
    rating: rating || 0,
    tags: tags || [],
    updatedAt: new Date().toISOString()
  };

  if (existing >= 0) {
    notes[existing] = noteData;
  } else {
    notes.push(noteData);
  }

  await saveNotes(notes);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pokemonId = parseInt(url.searchParams.get("pokemonId") || "0");

  let notes = await getNotes();
  notes = notes.filter(n => !(n.userId === user.id && n.pokemonId === pokemonId));

  await saveNotes(notes);
  return NextResponse.json({ success: true });
}
