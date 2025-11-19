'use server';

/**
 * @fileOverview A task prioritization AI agent that re-prioritizes tasks based on the expected completion time.
 *
 * - prioritizeTasksBasedOnExpectedCompletion - A function that handles the task prioritization process.
 * - PrioritizeTasksInput - The input type for the prioritizeTasksBasedOnExpectedCompletion function.
 * - PrioritizeTasksOutput - The return type for the prioritizeTasksBasedOnExpectedCompletion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string().describe('The unique identifier of the task.'),
      task: z.string().describe('The description of the task.'),
      type: z.string().describe('The category or type of the task.'),
      time: z.string().describe('The time slot for the task (e.g., 9:00-11:00).'),
      datetime: z.string().nullable().describe('The expected completion datetime of the task in ISO format, or null if not set.'),
      done: z.boolean().optional().describe('Whether the task is completed or not.')
    })
  ).describe('A list of tasks to be prioritized.'),
  currentDateTime: z.string().describe('The current date and time in ISO format.')
});

export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

const PrioritizeTasksOutputSchema = z.array(
  z.object({
    id: z.string().describe('The unique identifier of the task.'),
    task: z.string().describe('The description of the task.'),
    type: z.string().describe('The category or type of the task.'),
    time: z.string().describe('The time slot for the task (e.g., 9:00-11:00).'),
    datetime: z.string().nullable().describe('The expected completion datetime of the task in ISO format, or null if not set.'),
    done: z.boolean().optional().describe('Whether the task is completed or not.'),
    priority: z.number().describe('The priority of the task, with lower numbers indicating higher priority.'),
    reason: z.string().describe('The reason for the assigned priority.')
  })
).describe('A list of tasks with assigned priorities based on expected completion time.');

export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;

export async function prioritizeTasksBasedOnExpectedCompletion(input: PrioritizeTasksInput): Promise<PrioritizeTasksOutput> {
  return prioritizeTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {schema: PrioritizeTasksInputSchema},
  output: {schema: PrioritizeTasksOutputSchema},
  prompt: `You are a personal assistant that helps users prioritize their tasks.

Given the following list of tasks, re-prioritize them based on their expected completion time (datetime) and current time.
Tasks with earlier expected completion times should be prioritized higher. Tasks that have no expected completion time should be prioritized lower, and ordered alphabetically.
Consider tasks that are overdue as highest priority.
Include a short reason for each task's priority.

Current Date and Time: {{{currentDateTime}}}

Tasks:
{{#each tasks}}
- ID: {{id}}
  Task: {{task}}
  Type: {{type}}
  Time: {{time}}
  Expected Completion Time: {{datetime}}
  Done: {{done}}
{{/each}}

Output the re-prioritized list of tasks with a priority (lower number = higher priority) and a reason for each. If the task is overdue, make this explicit in the reason.
`
});

const prioritizeTasksFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksFlow',
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
