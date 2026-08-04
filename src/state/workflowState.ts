/**
 * Workflow state: a small status machine for an agent run.
 *
 * GH-600 teaching point: an agent's progress through a task is explicit
 * state, not a guess. A status machine makes the legal transitions clear
 * (you cannot complete a run that never started) and gives you a single
 * value to serialise, checkpoint and resume.
 */

export type WorkflowStatus =
  | 'idle'
  | 'planning'
  | 'running'
  | 'blocked'
  | 'completed'
  | 'failed';

/** Allowed transitions for each status. */
const TRANSITIONS: Readonly<Record<WorkflowStatus, ReadonlyArray<WorkflowStatus>>> = {
  idle: ['planning'],
  planning: ['running', 'failed'],
  running: ['blocked', 'completed', 'failed'],
  blocked: ['running', 'failed'],
  completed: [],
  failed: [],
};

export interface WorkflowSnapshot {
  readonly status: WorkflowStatus;
  /** Ordered history of statuses the run has held. */
  readonly history: ReadonlyArray<WorkflowStatus>;
}

export class WorkflowState {
  private current: WorkflowStatus;
  private readonly trail: WorkflowStatus[];

  constructor(initial: WorkflowStatus = 'idle') {
    this.current = initial;
    this.trail = [initial];
  }

  /** The current status. */
  get status(): WorkflowStatus {
    return this.current;
  }

  /** True when the run can no longer change status. */
  get isTerminal(): boolean {
    return TRANSITIONS[this.current].length === 0;
  }

  /** True when moving to the target status is permitted. */
  canTransitionTo(target: WorkflowStatus): boolean {
    return TRANSITIONS[this.current].includes(target);
  }

  /**
   * Move to a new status, throwing if the transition is illegal.
   * Returns the new status.
   */
  transitionTo(target: WorkflowStatus): WorkflowStatus {
    if (!this.canTransitionTo(target)) {
      throw new Error(
        `Illegal workflow transition from "${this.current}" to "${target}".`,
      );
    }
    this.current = target;
    this.trail.push(target);
    return this.current;
  }

  /** A plain snapshot suitable for serialisation. */
  snapshot(): WorkflowSnapshot {
    return { status: this.current, history: [...this.trail] };
  }

  /** Rebuild a state from a previously taken snapshot. */
  static fromSnapshot(snapshot: WorkflowSnapshot): WorkflowState {
    const state = new WorkflowState(snapshot.status);
    state.trail.length = 0;
    state.trail.push(...snapshot.history);
    return state;
  }
}
