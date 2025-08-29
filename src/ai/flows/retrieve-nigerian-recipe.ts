
'use server';

/**
 * @fileOverview A flow that retrieves a Nigerian recipe based on the dish name.
 *
 * - retrieveNigerianRecipe - A function that retrieves a Nigerian recipe.
 * - RetrieveNigerianRecipeInput - The input type for the retrieveNigerianRecipe function.
 * - RetrieveNigerianRecipeOutput - The return type for the retrieveNigerianRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findYoutubeVideoTool } from '@/ai/tools/youtube-tool';

const RetrieveNigerianRecipeInputSchema = z.object({
  dishName: z.string().describe('The name of the Nigerian dish to retrieve the recipe for.'),
});
export type RetrieveNigerianRecipeInput = z.infer<typeof RetrieveNigerianRecipeInputSchema>;

const RetrieveNigerianRecipeOutputSchema = z.object({
  dishName: z.string().describe('The name of the Nigerian dish.'),
  culturalOrigin: z.string().describe('The primary ethnic group(s) in Nigeria associated with the dish.'),
  ingredients: z.string().describe('A comprehensive list of all necessary ingredients with potential substitutes.'),
  recipe: z.string().describe('A clear, easy-to-follow guide for preparation.'),
  videoTutorialLink: z.string().url().describe('A link to a high-quality, publicly available YouTube video demonstrating how to cook the dish. The video must be embeddable and not be "unavailable" or private.'),
});
export type RetrieveNigerianRecipeOutput = z.infer<typeof RetrieveNigerianRecipeOutputSchema>;

export async function retrieveNigerianRecipe(input: RetrieveNigerianRecipeInput): Promise<RetrieveNigerianRecipeOutput> {
  return retrieveNigerianRecipeFlow(input);
}

const retrieveNigerianRecipePrompt = ai.definePrompt({
  name: 'retrieveNigerianRecipePrompt',
  input: {schema: RetrieveNigerianRecipeInputSchema},
  output: {schema: RetrieveNigerianRecipeOutputSchema},
  tools: [findYoutubeVideoTool],
  prompt: `You are a culinary expert on Nigerian cuisine.

A user has asked for the recipe for the following dish:
{{dishName}}

Provide the following information in English.
- dishName: The name of the dish.
- culturalOrigin: The primary ethnic group(s) in Nigeria associated with the dish.
- ingredients: A comprehensive list of all necessary ingredients with potential substitutes.
- recipe: A clear, easy-to-follow guide for preparation.
- videoTutorialLink: Use the findYoutubeVideo tool to find a cooking tutorial for "{{dishName}}". Construct a valid YouTube URL from the video ID returned by the tool.

Ensure that the information is accurate and easy to understand. The video tutorial link must be a valid, embeddable YouTube video that is not "unavailable" or private.
`,
});

const retrieveNigerianRecipeFlow = ai.defineFlow(
  {
    name: 'retrieveNigerianRecipeFlow',
    inputSchema: RetrieveNigerianRecipeInputSchema,
    outputSchema: RetrieveNigerianRecipeOutputSchema,
  },
  async input => {
    const {output} = await retrieveNigerianRecipePrompt(input);
    if (output?.videoTutorialLink) {
      if (!output.videoTutorialLink.startsWith('http')) {
        output.videoTutorialLink = `https://www.youtube.com/watch?v=${output.videoTutorialLink}`;
      }
    }
    return output!;
  }
);
