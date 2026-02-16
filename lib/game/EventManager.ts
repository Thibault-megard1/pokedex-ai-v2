// Simple Event System for Mini-Events
// Provides NPC item gifts, lore tips, and hidden items

import type { GameSave, InventoryItem } from './types';

export interface GameEvent {
  id: string;
  type: 'item_gift' | 'lore' | 'hidden_item';
  title: string;
  description: string;
  item?: {
    id: string;
    name: string;
    quantity: number;
    type: 'pokeball' | 'potion' | 'key';
  };
  flagRequired?: string; // Event only triggers if this flag is set
  oneTime: boolean; // If true, event can only be triggered once
}

export const GAME_EVENTS: GameEvent[] = [
  // Item Gift Events
  {
    id: 'event_npc_potion_gift',
    type: 'item_gift',
    title: 'Generous Trainer',
    description: 'A kind trainer gives you a Potion to help on your journey!',
    item: {
      id: 'potion',
      name: 'Potion',
      quantity: 2,
      type: 'potion',
    },
    oneTime: true,
  },
  {
    id: 'event_npc_pokeball_gift',
    type: 'item_gift',
    title: 'Professor\'s Assistant',
    description: 'The Professor\'s assistant gives you 3 Poké Balls!',
    item: {
      id: 'pokeball',
      name: 'Poké Ball',
      quantity: 3,
      type: 'pokeball',
    },
    oneTime: true,
  },
  {
    id: 'event_npc_starter_gift',
    type: 'item_gift',
    title: 'Helpful Neighbor',
    description: 'Your neighbor gives you 5 Poké Balls to start your adventure!',
    item: {
      id: 'pokeball',
      name: 'Poké Ball',
      quantity: 5,
      type: 'pokeball',
    },
    flagRequired: 'starterChosen',
    oneTime: true,
  },

  // Lore Events
  {
    id: 'event_lore_type_advantage',
    type: 'lore',
    title: 'Wise Old Trainer',
    description: 'Remember: Water beats Fire, Fire beats Grass, and Grass beats Water! Type advantages are key to winning battles.',
    oneTime: false, // Can be repeated
  },
  {
    id: 'event_lore_catching_tips',
    type: 'lore',
    title: 'Pokémon Researcher',
    description: 'Lower a wild Pokémon\'s HP before throwing a Poké Ball. The weaker they are, the easier to catch!',
    oneTime: false,
  },
  {
    id: 'event_lore_evolution',
    type: 'lore',
    title: 'Evolution Expert',
    description: 'Pokémon evolve when they reach certain levels! Keep training your team to unlock their full potential.',
    oneTime: false,
  },
  {
    id: 'event_lore_pokedex',
    type: 'lore',
    title: 'Pokédex Collector',
    description: 'Your Pokédex tracks all the Pokémon you\'ve seen and caught. Try to complete it by catching them all!',
    oneTime: false,
  },

  // Hidden Items
  {
    id: 'event_hidden_potion_1',
    type: 'hidden_item',
    title: 'Hidden Potion',
    description: 'You found a hidden Potion!',
    item: {
      id: 'potion',
      name: 'Potion',
      quantity: 1,
      type: 'potion',
    },
    oneTime: true,
  },
  {
    id: 'event_hidden_pokeball_1',
    type: 'hidden_item',
    title: 'Hidden Poké Ball',
    description: 'You found a hidden Poké Ball!',
    item: {
      id: 'pokeball',
      name: 'Poké Ball',
      quantity: 1,
      type: 'pokeball',
    },
    oneTime: true,
  },
  {
    id: 'event_hidden_rare_candy',
    type: 'hidden_item',
    title: 'Rare Find!',
    description: 'You found a mysterious item hidden in the grass... (Feature coming soon!)',
    oneTime: true,
  },
];

export class EventManager {
  /**
   * Check if an event has already been triggered
   */
  static hasTriggered(save: GameSave, eventId: string): boolean {
    const flagKey = `event_${eventId}`;
    return save.flags?.[flagKey] === true;
  }

  /**
   * Mark an event as triggered
   */
  static markTriggered(save: GameSave, eventId: string) {
    if (!save.flags) save.flags = {};
    const flagKey = `event_${eventId}`;
    save.flags[flagKey] = true;
  }

  /**
   * Check if an event can be triggered
   */
  static canTrigger(save: GameSave, event: GameEvent): boolean {
    // Check if it's a one-time event that was already triggered
    if (event.oneTime && this.hasTriggered(save, event.id)) {
      return false;
    }

    // Check if required flag is set
    if (event.flagRequired && !save.flags?.[event.flagRequired]) {
      return false;
    }

    return true;
  }

  /**
   * Trigger an event and apply its effects
   */
  static triggerEvent(save: GameSave, eventId: string): { success: boolean; message: string } {
    const event = GAME_EVENTS.find(e => e.id === eventId);

    if (!event) {
      return { success: false, message: 'Event not found' };
    }

    if (!this.canTrigger(save, event)) {
      return { success: false, message: 'Event already triggered or requirements not met' };
    }

    // Apply event effects
    if (event.item) {
      this.giveItem(save, event.item);
    }

    // Mark as triggered if one-time
    if (event.oneTime) {
      this.markTriggered(save, event.id);
    }

    return { success: true, message: event.description };
  }

  /**
   * Give an item to the player
   */
  static giveItem(save: GameSave, item: InventoryItem) {
    if (!save.inventory) save.inventory = [];

    const existingItem = save.inventory.find(i => i.id === item.id);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      save.inventory.push({ ...item });
    }
  }

  /**
   * Get available events for current save state
   */
  static getAvailableEvents(save: GameSave): GameEvent[] {
    return GAME_EVENTS.filter(event => this.canTrigger(save, event));
  }

  /**
   * Get random lore event
   */
  static getRandomLoreEvent(): GameEvent | null {
    const loreEvents = GAME_EVENTS.filter(e => e.type === 'lore');
    if (loreEvents.length === 0) return null;
    return loreEvents[Math.floor(Math.random() * loreEvents.length)];
  }
}
