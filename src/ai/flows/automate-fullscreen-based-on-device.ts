'use server';

/**
 * @fileOverview This file defines a Genkit flow to determine the best fullscreen method based on the device/browser.
 *
 * - automateFullscreenBasedOnDevice - A function that handles the fullscreen automation process.
 * - AutomateFullscreenBasedOnDeviceInput - The input type for the automateFullscreenBasedOnDevice function.
 * - AutomateFullscreenBasedOnDeviceOutput - The return type for the automateFullscreenBasedOnDevice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutomateFullscreenBasedOnDeviceInputSchema = z.object({
  userAgent: z
    .string()
    .describe('The user agent string of the browser.'),
});
export type AutomateFullscreenBasedOnDeviceInput = z.infer<typeof AutomateFullscreenBasedOnDeviceInputSchema>;

const AutomateFullscreenBasedOnDeviceOutputSchema = z.object({
  fullscreenMethod: z
    .string()
    .describe('The recommended JavaScript code to enable fullscreen mode.'),
});
export type AutomateFullscreenBasedOnDeviceOutput = z.infer<typeof AutomateFullscreenBasedOnDeviceOutputSchema>;

export async function automateFullscreenBasedOnDevice(input: AutomateFullscreenBasedOnDeviceInput): Promise<AutomateFullscreenBasedOnDeviceOutput> {
  return automateFullscreenBasedOnDeviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'automateFullscreenBasedOnDevicePrompt',
  input: {schema: AutomateFullscreenBasedOnDeviceInputSchema},
  output: {schema: AutomateFullscreenBasedOnDeviceOutputSchema},
  prompt: `Given the following user agent, recommend the best JavaScript code to enable fullscreen mode in a web browser. Return only executable Javascript code, and nothing else. User Agent: {{{userAgent}}}`,
});

const automateFullscreenBasedOnDeviceFlow = ai.defineFlow(
  {
    name: 'automateFullscreenBasedOnDeviceFlow',
    inputSchema: AutomateFullscreenBasedOnDeviceInputSchema,
    outputSchema: AutomateFullscreenBasedOnDeviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
