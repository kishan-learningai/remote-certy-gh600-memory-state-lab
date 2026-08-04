/**
 * Semantic memory: durable facts recalled by keyword.
 *
 * GH-600 teaching point: semantic memory holds general knowledge the agent
 * has learned (conventions, facts, decisions) rather than a timeline of
 * events. Recall here is deterministic keyword matching - no embeddings,
 * no network, no model calls - so the lab stays reproducible.
 */

export interface SemanticFact {
  /** Stable key for the fact. */
  readonly key: string;
  /** The fact text. */
  readonly text: string;
  /** Lower-cased keywords used for recall. */
  readonly keywords: ReadonlyArray<string>;
}

const normalise = (term: string): string => term.trim().toLowerCase();

export class SemanticMemory {
  private readonly facts = new Map<string, SemanticFact>();

  /** Store or replace a fact. Keywords are normalised to lower case. */
  remember(key: string, text: string, keywords: ReadonlyArray<string>): void {
    this.facts.set(key, {
      key,
      text,
      keywords: keywords.map(normalise).filter((k) => k.length > 0),
    });
  }

  /**
   * Recall facts whose keywords contain the query term.
   * Matching is case-insensitive and deterministic (results follow
   * insertion order).
   */
  recall(query: string): ReadonlyArray<SemanticFact> {
    const needle = normalise(query);
    if (needle.length === 0) {
      return [];
    }
    const hits: SemanticFact[] = [];
    for (const fact of this.facts.values()) {
      if (fact.keywords.some((k) => k.includes(needle))) {
        hits.push(fact);
      }
    }
    return hits;
  }

  /** Look up a single fact by its exact key. */
  get(key: string): SemanticFact | undefined {
    return this.facts.get(key);
  }

  /** Number of stored facts. */
  get size(): number {
    return this.facts.size;
  }
}
