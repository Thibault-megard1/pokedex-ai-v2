import { NextRequest, NextResponse } from "next/server";
import { readUserFromSession } from "@/lib/auth";
import { readJSON, writeJSON } from "@/lib/db";

type QuizResultData = {
  userId: string;
  result: {
    primary: {
      id: number;
      name: string;
      name_fr?: string;
      sprite_url?: string;
      confidence: number;
      reasons: string[];
    };
    alternatives: Array<{
      id: number;
      name: string;
      name_fr?: string;
      sprite_url?: string;
      confidence: number;
      reasons: string[];
    }>;
    traits_inferred: string[];
  };
  completedAt: string;
};

type QuizResultsDB = {
  [userId: string]: QuizResultData;
};

const QUIZ_RESULTS_PATH = "data/quiz-results.json";

// GET - Retrieve user's quiz result
export async function GET(req: NextRequest) {
  const user = await readUserFromSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await readJSON<QuizResultsDB>(QUIZ_RESULTS_PATH);
    const userResult = db[user.id];

    if (!userResult) {
      return NextResponse.json({ result: null });
    }

    return NextResponse.json({ result: userResult });
  } catch (error) {
    console.error("Error reading quiz results:", error);
    return NextResponse.json({ result: null });
  }
}

// POST - Save user's quiz result
export async function POST(req: NextRequest) {
  const user = await readUserFromSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { result, overwrite } = body;

    if (!result) {
      return NextResponse.json({ error: "Result is required" }, { status: 400 });
    }

    let db = await readJSON<QuizResultsDB>(QUIZ_RESULTS_PATH);

    // Check if user already has a result
    if (db[user.id] && !overwrite) {
      return NextResponse.json({
        error: "Quiz result already exists. Set overwrite=true to replace.",
        hasExisting: true
      }, { status: 409 });
    }

    // Save the result
    db[user.id] = {
      userId: user.id,
      result,
      completedAt: new Date().toISOString()
    };

    await writeJSON(QUIZ_RESULTS_PATH, db);

    return NextResponse.json({ success: true, result: db[user.id] });
  } catch (error) {
    console.error("Error saving quiz result:", error);
    return NextResponse.json(
      { error: "Failed to save quiz result" },
      { status: 500 }
    );
  }
}

// DELETE - Remove user's quiz result
export async function DELETE(req: NextRequest) {
  const user = await readUserFromSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let db = await readJSON<QuizResultsDB>(QUIZ_RESULTS_PATH);
    delete db[user.id];
    await writeJSON(QUIZ_RESULTS_PATH, db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quiz result:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz result" },
      { status: 500 }
    );
  }
}
