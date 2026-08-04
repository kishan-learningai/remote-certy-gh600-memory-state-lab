/**
 * Episodic memory: a log of past agent runs ("episodes").
 *
 * GH-600 teaching point: episodic memory lets an agent recall what it did
 * before - which issue it worked on, what actions it took, and the outcome.
 * This is how an agent survives across tasks and can replay a previous run.
 */

export type RunOutcome = 'success' | 'failure' | 'partial';

export interface AgentRunRecord {
  /** Stable identifier for this run. */
  readonly runId: string;
  /** The GitHub issue number the run addressed. */
  readonly issueNumber: number;
  /** A short, human-readable label for the kind of agent. */
  readonly agent: string;
  /** Ordered list of high-level actions the agent took. */
  readonly actions: ReadonlyArray<string>;
  /** Final outcome of the run. */
  readonly outcome: RunOutcome;
  /** ISO 8601 timestamp recorded when the run was stored. */
  readonly recordedAt: string;
}

export class EpisodicMemory {
  private readonly log: AgentRunRecord[] = [];

  /**
   * Record a new run. The recordedAt timestamp may be supplied for
   * deterministic tests; otherwise the current time is used.
   */
  record(record: Omit<AgentRunRecord, 'recordedAt'> & { recordedAt?: string }): AgentRunRecord {
    const stored: AgentRunRecord = {
      runId: record.runId,
      issueNumber: record.issueNumber,
      agent: record.agent,
      actions: [...record.actions],
      outcome: record.outcome,
      recordedAt: record.recordedAt ?? new Date().toISOString(),
    };
    this.log.push(stored);
    return stored;
  }

  /** Return every recorded run, oldest first. */
  all(): ReadonlyArray<AgentRunRecord> {
    return [...this.log];
  }

  /** Return the most recent run for a given issue, or undefined if none. */
  lastForIssue(issueNumber: number): AgentRunRecord | undefined {
    for (let i = this.log.length - 1; i >= 0; i -= 1) {
      if (this.log[i].issueNumber === issueNumber) {
        return this.log[i];
      }
    }
    return undefined;
  }

  /** Number of recorded runs. */
  get size(): number {
    return this.log.length;
  }
}
