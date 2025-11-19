export type CategoryType = 'python' | 'uiux' | 'lectures' | 'break' | 'misc';

export interface Task {
  id: string;
  time: string;
  task: string;
  type: CategoryType;
  done?: boolean;
  datetime?: string | null;
  notified?: boolean;
  priority?: number;
  reason?: string;
}

export interface Day {
  day: string;
  items: Omit<Task, 'done' | 'datetime' | 'notified' | 'priority' | 'reason'>[];
}
