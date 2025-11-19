'use server';

import { prioritizeTasksBasedOnExpectedCompletion, type PrioritizeTasksInput } from '@/ai/flows/prioritize-tasks-based-on-expected-completion';
import { suggestOptimalTaskTimes, type SuggestOptimalTaskTimesInput } from '@/ai/flows/suggest-optimal-task-times';
import type { Task } from '@/lib/types';
import { days } from '@/lib/data';

export async function getPrioritizedTasks(tasks: Task[]): Promise<Task[]> {
  const allKnownTasks = new Map(days.flatMap(d => d.items).map(t => [t.id, t]));

  const input: PrioritizeTasksInput = {
    tasks: tasks.map(t => ({
      id: t.id,
      task: t.task,
      type: t.type,
      time: t.time,
      datetime: t.datetime || null,
      done: t.done || false
    })),
    currentDateTime: new Date().toISOString(),
  };

  try {
    const prioritized = await prioritizeTasksBasedOnExpectedCompletion(input);
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    
    prioritized.forEach(p => {
      if (taskMap.has(p.id)) {
        const existingTask = taskMap.get(p.id)!;
        taskMap.set(p.id, {
          ...existingTask,
          id: p.id,
          task: p.task,
          type: p.type,
          time: p.time,
          datetime: p.datetime,
          done: p.done,
          priority: p.priority,
          reason: p.reason
        });
      }
    });

    return Array.from(taskMap.values());
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    throw new Error("Failed to prioritize tasks with AI.");
  }
}

export async function getSuggestedTimes(tasks: Task[]): Promise<Task[]> {
    const userHistoricalData = 'User is a student who prefers to do focused work like Python coding in the morning and creative tasks like UI/UX design in the afternoon. Lectures are usually in the afternoon. User is most productive on Mondays and Fridays and takes breaks around lunchtime.';
    
    const input: SuggestOptimalTaskTimesInput = {
        tasks: tasks.map(t => ({
            id: t.id,
            task: t.task,
            type: t.type,
            deadline: null, 
            priority: t.priority || 3,
            originalTime: t.datetime || null,
        })),
        userHistoricalData,
    };

    try {
        const suggestions = await suggestOptimalTaskTimes(input);
        const taskMap = new Map(tasks.map(t => [t.id, t]));

        suggestions.forEach(s => {
            if (taskMap.has(s.id)) {
                const existingTask = taskMap.get(s.id)!;
                 taskMap.set(s.id, {
                  ...existingTask,
                  datetime: s.suggestedTime,
                  reason: s.reasoning,
                });
            }
        });

        return Array.from(taskMap.values());

    } catch (error) {
        console.error("Error suggesting task times:", error);
        throw new Error("Failed to suggest task times with AI.");
    }
}
