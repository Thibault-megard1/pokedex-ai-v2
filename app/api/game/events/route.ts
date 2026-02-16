import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import { EventManager, GAME_EVENTS } from '@/lib/game/EventManager';

/**
 * GET /api/game/events
 * Returns available events for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load game save
    const savePath = path.join(
      process.cwd(),
      'data',
      'game-saves',
      `${session.username}.json`
    );

    let save: any = null;

    try {
      const saveData = await fs.readFile(savePath, 'utf-8');
      save = JSON.parse(saveData);
    } catch (err) {
      return NextResponse.json({ events: [] });
    }

    const availableEvents = EventManager.getAvailableEvents(save);

    return NextResponse.json({
      events: availableEvents.map(e => ({
        id: e.id,
        type: e.type,
        title: e.title,
        description: e.description,
        hasItem: !!e.item,
      })),
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/game/events
 * Triggers an event
 * Body: { eventId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { eventId } = body;

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    // Validate event exists
    const event = GAME_EVENTS.find(e => e.id === eventId);
    if (!event) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    // Load game save
    const savePath = path.join(
      process.cwd(),
      'data',
      'game-saves',
      `${session.username}.json`
    );

    let save: any = null;

    try {
      const saveData = await fs.readFile(savePath, 'utf-8');
      save = JSON.parse(saveData);
    } catch (err) {
      return NextResponse.json({ error: 'No save file found' }, { status: 404 });
    }

    // Trigger event
    const result = EventManager.triggerEvent(save, eventId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Save the updated game state
    await fs.writeFile(savePath, JSON.stringify(save, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: result.message,
      event: {
        id: event.id,
        type: event.type,
        title: event.title,
        item: event.item,
      },
    });
  } catch (error) {
    console.error('Error triggering event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
