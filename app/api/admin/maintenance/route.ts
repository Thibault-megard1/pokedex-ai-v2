import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    
    const body = await req.json();
    const { action } = body;
    
    if (action === "clear-cache") {
      const cacheDir = path.join(process.cwd(), "data", "pokemon-cache");
      
      try {
        const files = await fs.readdir(cacheDir);
        let deletedCount = 0;
        
        for (const file of files) {
          if (file.endsWith(".json")) {
            await fs.unlink(path.join(cacheDir, file));
            deletedCount++;
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          message: `${deletedCount} fichiers de cache supprimés` 
        });
      } catch (err: any) {
        return NextResponse.json({ 
          success: false, 
          message: "Erreur lors du nettoyage du cache" 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: "Action non reconnue" 
    }, { status: 400 });
    
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: err.message?.includes("administrateur") ? 403 : 401 }
    );
  }
}
