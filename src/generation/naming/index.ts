import { SeededRandom } from '../../utils/random';
import type { Settlement, River, SettlementSize } from '../../types';

export type NameStyle = 'fantasy' | 'nordic' | 'celtic' | 'medieval';

interface SyllableSet {
  prefixes: string[];
  middles: string[];
  suffixes: string[];
  standalone: string[];
}

// Fantasy name components
const FANTASY_SYLLABLES: SyllableSet = {
  prefixes: [
    'Aer', 'Ald', 'Ara', 'Ash', 'Bel', 'Bri', 'Cal', 'Cel', 'Dae', 'Dal',
    'Dra', 'Dun', 'Eld', 'Elm', 'Fae', 'Fen', 'Gal', 'Gil', 'Grim', 'Hal',
    'Hel', 'Ir', 'Ith', 'Kar', 'Kel', 'Kir', 'Lir', 'Lor', 'Mal', 'Mar',
    'Mel', 'Mith', 'Mor', 'Nar', 'Nel', 'Nor', 'Orn', 'Pel', 'Quel', 'Ral',
    'Rath', 'Ril', 'Riv', 'Sar', 'Sel', 'Sil', 'Sol', 'Sul', 'Tal', 'Tar',
    'Tel', 'Thal', 'Thor', 'Til', 'Tor', 'Tyr', 'Ul', 'Val', 'Var', 'Vel',
    'Vor', 'Wil', 'Wyn', 'Xan', 'Yen', 'Zar', 'Zeph',
  ],
  middles: [
    'an', 'ar', 'el', 'en', 'er', 'eth', 'ia', 'il', 'in', 'ion',
    'ir', 'is', 'ith', 'on', 'or', 'oth', 'ul', 'un', 'ur',
  ],
  suffixes: [
    'dale', 'dell', 'den', 'dor', 'fall', 'feld', 'ford', 'gate', 'glen', 'guard',
    'hall', 'haven', 'helm', 'hill', 'hold', 'hollow', 'keep', 'lake', 'land', 'leigh',
    'mere', 'moor', 'mount', 'mouth', 'peak', 'port', 'rest', 'ridge', 'shire', 'shore',
    'spire', 'stead', 'stone', 'vale', 'view', 'ville', 'wall', 'watch', 'water', 'wind',
    'wood', 'worth',
  ],
  standalone: [
    'Amber', 'Autumn', 'Azure', 'Black', 'Blue', 'Bright', 'Bronze', 'Clear',
    'Cold', 'Crystal', 'Dark', 'Dawn', 'Deep', 'Dusk', 'East', 'Ever', 'Fair',
    'Far', 'First', 'Frost', 'Gold', 'Grand', 'Great', 'Green', 'Grey', 'High',
    'Iron', 'Lake', 'Last', 'Light', 'Long', 'Lost', 'Low', 'Mid', 'Moon',
    'New', 'Night', 'North', 'Oak', 'Old', 'Pine', 'Rain', 'Red', 'River',
    'Rock', 'Rose', 'Sea', 'Shadow', 'Silver', 'Snow', 'South', 'Spring',
    'Star', 'Steel', 'Stone', 'Storm', 'Summer', 'Sun', 'Thunder', 'West',
    'White', 'Wild', 'Wind', 'Winter', 'Wolf',
  ],
};

// Nordic-style name components
const NORDIC_SYLLABLES: SyllableSet = {
  prefixes: [
    'Bjorn', 'Borg', 'Bran', 'Dra', 'Eid', 'Eir', 'Frey', 'Gar', 'Grim',
    'Haf', 'Hel', 'Hild', 'Hrun', 'Ing', 'Jar', 'Jot', 'Kald', 'Kjel',
    'Krag', 'Lod', 'Mjol', 'Nar', 'Nid', 'Rag', 'Sig', 'Skag', 'Skar',
    'Skal', 'Stor', 'Svar', 'Thor', 'Tyr', 'Ulf', 'Val', 'Vin', 'Ygg',
  ],
  middles: ['a', 'e', 'i', 'o', 'u', 'ar', 'or', 'ir', 'en', 'in'],
  suffixes: [
    'by', 'dal', 'fell', 'fjord', 'heim', 'holm', 'hus', 'land', 'mark',
    'ness', 'rike', 'stad', 'stein', 'strand', 'sund', 'vik', 'voll',
  ],
  standalone: [
    'Black', 'Cold', 'Dark', 'Deep', 'East', 'Far', 'Frost', 'Great', 'Grey',
    'High', 'Ice', 'Iron', 'Long', 'Low', 'Mid', 'North', 'Old', 'South',
    'Storm', 'Stone', 'West', 'White', 'Wolf',
  ],
};

// River name components
const RIVER_NAMES = {
  prefixes: [
    'Silver', 'Gold', 'Crystal', 'Swift', 'Slow', 'Deep', 'Winding', 'Clear',
    'Dark', 'Bright', 'Cold', 'Warm', 'Rushing', 'Gentle', 'Mighty', 'Ancient',
  ],
  roots: [
    'Ald', 'Ash', 'Bel', 'Cel', 'Dal', 'Eld', 'Fen', 'Gal', 'Hel', 'Ir',
    'Kel', 'Lor', 'Mel', 'Nar', 'Pel', 'Ral', 'Sel', 'Tal', 'Val', 'Wyr',
  ],
  suffixes: ['a', 'an', 'el', 'en', 'ia', 'in', 'on', 'or', 'un', 'yn'],
};

/**
 * Name generator class
 */
export class NameGenerator {
  private rng: SeededRandom;
  private style: NameStyle;
  private usedNames: Set<string>;

  constructor(seed: string, style: NameStyle = 'fantasy') {
    this.rng = new SeededRandom(seed + '_names');
    this.style = style;
    this.usedNames = new Set();
  }

  private getSyllables(): SyllableSet {
    switch (this.style) {
      case 'nordic':
        return NORDIC_SYLLABLES;
      default:
        return FANTASY_SYLLABLES;
    }
  }

  /**
   * Generate a unique name
   */
  private generateUniqueName(generator: () => string): string {
    let attempts = 0;
    let name: string;

    do {
      name = generator();
      attempts++;
    } while (this.usedNames.has(name) && attempts < 100);

    this.usedNames.add(name);
    return name;
  }

  /**
   * Generate a settlement name
   */
  generateSettlementName(_size: SettlementSize, _type: string): string {
    return this.generateUniqueName(() => {
      const syllables = this.getSyllables();
      const patterns = this.rng.int(0, 3);

      switch (patterns) {
        case 0:
          // Prefix + Suffix (Riverdale, Ironhold)
          return this.rng.pick(syllables.prefixes) + this.rng.pick(syllables.suffixes);

        case 1:
          // Standalone + Suffix (Northwatch, Sunspire)
          return this.rng.pick(syllables.standalone) + this.rng.pick(syllables.suffixes);

        case 2:
          // Prefix + Middle + Suffix (Silverton, Goldenmere)
          return (
            this.rng.pick(syllables.prefixes) +
            this.rng.pick(syllables.middles) +
            this.rng.pick(syllables.suffixes)
          );

        default:
          // Compound (two standalones)
          return this.rng.pick(syllables.standalone) + this.rng.pick(syllables.standalone).toLowerCase();
      }
    });
  }

  /**
   * Generate a river name
   */
  generateRiverName(): string {
    return this.generateUniqueName(() => {
      const pattern = this.rng.int(0, 2);

      switch (pattern) {
        case 0:
          // Prefix + Root + Suffix (Silveralon)
          return (
            this.rng.pick(RIVER_NAMES.prefixes) +
            this.rng.pick(RIVER_NAMES.roots).toLowerCase() +
            this.rng.pick(RIVER_NAMES.suffixes)
          );

        case 1:
          // Root + Suffix + " River" (Aldun River)
          return (
            this.rng.pick(RIVER_NAMES.roots) +
            this.rng.pick(RIVER_NAMES.suffixes) +
            ' River'
          );

        default:
          // The + Prefix + Root (The Swift Ald)
          return (
            'The ' +
            this.rng.pick(RIVER_NAMES.prefixes) +
            ' ' +
            this.rng.pick(RIVER_NAMES.roots)
          );
      }
    });
  }

  /**
   * Generate a region name
   */
  generateRegionName(): string {
    return this.generateUniqueName(() => {
      const syllables = this.getSyllables();
      const pattern = this.rng.int(0, 2);

      switch (pattern) {
        case 0:
          // The [Adj] [Noun]s
          return `The ${this.rng.pick(syllables.standalone)} ${this.rng.pick(syllables.suffixes)}s`;

        case 1:
          // [Name]land / [Name]mark
          return this.rng.pick(syllables.prefixes) + this.rng.pick(['land', 'mark', 'realm', 'domain']);

        default:
          // [Adj] [Name]
          return `${this.rng.pick(syllables.standalone)} ${this.rng.pick(syllables.prefixes)}`;
      }
    });
  }

  /**
   * Generate a mountain/peak name
   */
  generateMountainName(): string {
    return this.generateUniqueName(() => {
      const syllables = this.getSyllables();
      const pattern = this.rng.int(0, 2);

      switch (pattern) {
        case 0:
          // [Name] Peak/Mount
          return `${this.rng.pick(syllables.prefixes)}${this.rng.pick(syllables.middles)} ${this.rng.pick(['Peak', 'Mount', 'Mountain'])}`;

        case 1:
          // Mount [Name]
          return `Mount ${this.rng.pick(syllables.prefixes)}${this.rng.pick(syllables.middles)}`;

        default:
          // The [Adj] [Noun]
          return `The ${this.rng.pick(syllables.standalone)} ${this.rng.pick(['Peak', 'Spire', 'Summit', 'Crown'])}`;
      }
    });
  }

  /**
   * Generate a forest name
   */
  generateForestName(): string {
    return this.generateUniqueName(() => {
      const syllables = this.getSyllables();
      const forestWords = ['Wood', 'Woods', 'Forest', 'Grove', 'Thicket', 'Wilds'];
      const pattern = this.rng.int(0, 2);

      switch (pattern) {
        case 0:
          // [Name]wood
          return `${this.rng.pick(syllables.prefixes)}${this.rng.pick(['wood', 'grove', 'forest'])}`;

        case 1:
          // The [Adj] [Forest]
          return `The ${this.rng.pick(syllables.standalone)} ${this.rng.pick(forestWords)}`;

        default:
          // [Name] Forest
          return `${this.rng.pick(syllables.prefixes)}${this.rng.pick(syllables.middles)} ${this.rng.pick(forestWords)}`;
      }
    });
  }
}

/**
 * Apply names to all map features
 */
export function applyNames(
  seed: string,
  settlements: Settlement[],
  rivers: River[],
  style: NameStyle = 'fantasy'
): void {
  const generator = new NameGenerator(seed, style);

  // Name settlements
  for (const settlement of settlements) {
    settlement.name = generator.generateSettlementName(settlement.size, settlement.type);
  }

  // Name rivers
  for (const river of rivers) {
    river.name = generator.generateRiverName();
  }
}
