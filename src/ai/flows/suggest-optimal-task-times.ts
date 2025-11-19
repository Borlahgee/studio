'use server';

/**
 * @fileOverview Suggests optimal times for tasks based on historical data, deadlines, and priorities.
 *
 * - suggestOptimalTaskTimes - A function that handles the suggestion of optimal task times.
 * - SuggestOptimalTaskTimesInput - The input type for the suggestOptimalTaskTimes function.
 * - SuggestOptimalTaskTimesOutput - The return type for the suggestOptimalTaskTimes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalTaskTimesInputSchema = z.object({
  tasks: z.array(
    z.object({
      id: z.string(),
      task: z.string().describe('The name of the task.'),
      type: z.string().describe('The category of the task (e.g., python, uiux, lectures).'),
      deadline: z.string().nullable().describe('The deadline for the task in ISO format, or null if there is no deadline.'),
      priority: z.number().describe('The priority of the task (e.g., 1 for high priority, 2 for medium, 3 for low).'),
      originalTime: z.string().nullable().describe('The originally scheduled time for the task, if any, in ISO format.')
    })
  ).describe('A list of tasks to be scheduled.'),
  userHistoricalData: z.string().describe('Historical data about the user, including past schedules, completion rates, and preferences.'),
});
export type SuggestOptimalTaskTimesInput = z.infer<typeof SuggestOptimalTaskTimesInputSchema>;

const SuggestOptimalTaskTimesOutputSchema = z.array(
  z.object({
    id: z.string(),
    suggestedTime: z.string().describe('The suggested time for the task in ISO format.'),
    reasoning: z.string().describe('The reasoning behind the suggested time.'),
  })
);
export type SuggestOptimalTaskTimesOutput = z.infer<typeof SuggestOptimalTaskTimesOutputSchema>;

export async function suggestOptimalTaskTimes(input: SuggestOptimalTaskTimesInput): Promise<SuggestOptimalTaskTimesOutput> {
  return suggestOptimalTaskTimesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalTaskTimesPrompt',
  input: {schema: SuggestOptimalTaskTimesInputSchema},
  output: {schema: SuggestOptimalTaskTimesOutputSchema},
  prompt: `You are an AI assistant that suggests optimal times for tasks based on the user's historical data, deadlines, and priorities.

  Analyze the following tasks and the user's historical data to suggest the best time for each task. Consider deadlines and priorities to minimize conflicts and maximize productivity.

  Tasks:
  {{#each tasks}}
  - Task ID: {{this.id}}
    Task: {{this.task}}
    Type: {{this.type}}
    Deadline: {{this.deadline}}
    Priority: {{this.priority}}
    Original Time: {{this.originalTime}}
  {{/each}}

  User Historical Data: {{{userHistoricalData}}}

  Suggest an optimal time and give a short reasoning for each task. Return the suggestions in JSON format.
  `,
});

const suggestOptimalTaskTimesFlow = ai.defineFlow(
  {
    name: 'suggestOptimalTaskTimesFlow',
    inputSchema: SuggestOptimalTaskTimesInputSchema,
    outputSchema: SuggestOptimalTaskTimesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
