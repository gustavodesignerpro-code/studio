'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate an initial playlist
 * based on a prompt describing the store. It exports the function
 * `generateInitialPlaylist` to trigger the flow.
 *
 * - generateInitialPlaylist - A function that generates an initial playlist based on the store description.
 * - GenerateInitialPlaylistInput - The input type for the generateInitialPlaylist function.
 * - GenerateInitialPlaylistOutput - The return type for the generateInitialPlaylist function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialPlaylistInputSchema = z.object({
  storeDescription: z
    .string()
    .describe('A description of the store to generate a playlist for.'),
});
export type GenerateInitialPlaylistInput = z.infer<
  typeof GenerateInitialPlaylistInputSchema
>;

const PlaylistItemSchema = z.object({
  ordem: z.number().describe('The order of the item in the playlist.'),
  tipo: z.union([
    z.literal('video'),
    z.literal('imagem'),
    z.literal('texto'),
  ]).describe('The type of the playlist item (video, imagem, texto).'),
  url: z.string().describe('The URL of the media or the text content.'),
  duracao: z
    .number()
    .describe('The duration of the item in seconds (for images and text).'),
  ativo: z.boolean().describe('Whether the item is active or not.'),
  criadoEm: z.string().optional().describe('The creation timestamp (optional).'),
});

const GenerateInitialPlaylistOutputSchema = z.array(PlaylistItemSchema).describe('An array of playlist items.');
export type GenerateInitialPlaylistOutput = z.infer<
  typeof GenerateInitialPlaylistOutputSchema
>;

export async function generateInitialPlaylist(
  input: GenerateInitialPlaylistInput
): Promise<GenerateInitialPlaylistOutput> {
  return generateInitialPlaylistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialPlaylistPrompt',
  input: {schema: GenerateInitialPlaylistInputSchema},
  output: {schema: GenerateInitialPlaylistOutputSchema},
  prompt: `You are an expert digital signage content creator.

  Based on the following store description, generate an initial playlist with a variety of media types (video, image, text) appropriate for the store. Be sure to include at least 5 items in the playlist, with reasonable durations. 

  Store Description: {{{storeDescription}}}
  `,
});

const generateInitialPlaylistFlow = ai.defineFlow(
  {
    name: 'generateInitialPlaylistFlow',
    inputSchema: GenerateInitialPlaylistInputSchema,
    outputSchema: GenerateInitialPlaylistOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
