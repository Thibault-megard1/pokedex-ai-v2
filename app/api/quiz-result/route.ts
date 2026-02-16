import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DATA_DIR, readJsonFile, writeJsonFile } from "@/lib/utils";

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

const QUIZ_RESULTS_PATH = path.join(DATA_DIR, "quiz-results.json");

// GET - Recuperer le resultat du quiz pour l'utilisateur courant
// Cette fonction n'utilise pas d'intelligence artificielle.
export async function GET(req: NextRequest) {
  // Entree: requete HTTP. Sortie: resultat JSON (ou null).
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await readJsonFile<QuizResultsDB>(QUIZ_RESULTS_PATH, {});
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

// POST - Enregistrer le resultat du quiz
// Cette fonction n'utilise pas d'intelligence artificielle.
export async function POST(req: NextRequest) {
  // Entree: { result, overwrite }. Sortie: resultat stocke.
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { result, overwrite } = body;

    if (!result) {
      return NextResponse.json({ error: "Result is required" }, { status: 400 });
    }

    let db = await readJsonFile<QuizResultsDB>(QUIZ_RESULTS_PATH, {});

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

    await writeJsonFile(QUIZ_RESULTS_PATH, db);

    return NextResponse.json({ success: true, result: db[user.id] });
  } catch (error) {
    console.error("Error saving quiz result:", error);
    return NextResponse.json(
      { error: "Failed to save quiz result" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer le resultat du quiz
// Cette fonction n'utilise pas d'intelligence artificielle.
export async function DELETE(req: NextRequest) {
  // Entree: requete HTTP. Sortie: succes.
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let db = await readJsonFile<QuizResultsDB>(QUIZ_RESULTS_PATH, {});
    delete db[user.id];
    await writeJsonFile(QUIZ_RESULTS_PATH, db);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quiz result:", error);
    return NextResponse.json(
      { error: "Failed to delete quiz result" },
      { status: 500 }
    );
  }
}
