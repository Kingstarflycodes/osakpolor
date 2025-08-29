
'use server';
/**
 * @fileOverview An AI agent that identifies Nigerian dishes from images and provides information about them.
 *
 * - identifyNigerianDishFromImage - A function that handles the dish identification process.
 * - IdentifyNigerianDishFromImageInput - The input type for the identifyNigerianDishFromImage function.
 * - IdentifyNigerianDishFromImageOutput - The return type for the identifyNigerianDishFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findYoutubeVideoTool } from '@/ai/tools/youtube-tool';

const IdentifyNigerianDishFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a Nigerian dish, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyNigerianDishFromImageInput = z.infer<typeof IdentifyNigerianDishFromImageInputSchema>;

const IdentifyNigerianDishFromImageOutputSchema = z.object({
  dishName: z.string().describe('The name of the Nigerian dish.'),
  culturalOrigin: z.string().describe('The primary ethnic group(s) in Nigeria associated with the dish. Be specific.'),
  ingredientList: z.string().describe('A comprehensive list of all necessary ingredients with potential substitutes.'),
  stepByStepRecipe: z.string().describe('A clear, easy-to-follow guide for preparation.'),
  videoTutorialLink: z.string().describe('A curated link to a high-quality, publicly available YouTube video demonstrating how to cook the dish. The video must be embeddable and not be "unavailable" or private.'),
});
export type IdentifyNigerianDishFromImageOutput = z.infer<typeof IdentifyNigerianDishFromImageOutputSchema>;

export async function identifyNigerianDishFromImage(input: IdentifyNigerianDishFromImageInput): Promise<IdentifyNigerianDishFromImageOutput> {
  return identifyNigerianDishFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyNigerianDishFromImagePrompt',
  input: {schema: IdentifyNigerianDishFromImageInputSchema},
  output: {schema: IdentifyNigerianDishFromImageOutputSchema},
  tools: [findYoutubeVideoTool],
  prompt: `You are an expert in Nigerian cuisine. A user will upload an image of a Nigerian dish. Your primary goal is accuracy. Do not guess.

Analyze the following image of the Nigerian dish very carefully:
{{media url=photoDataUri}}

You must identify the dish, provide its cultural origin, a list of ingredients, a step-by-step recipe, and a link to a YouTube video tutorial.

When describing the cultural origin, be specific about the tribe or tribes in Nigeria that are most associated with the food.

Output all information in English.

For the video tutorial, use the findYoutubeVideoTool to find a cooking tutorial for the identified dish. Construct a valid YouTube URL from the video ID returned by the tool.

Output the dish name, cultural origin, ingredient list, step-by-step recipe, and video tutorial link in the format specified by the schema. If you are unable to confidently identify the dish, return null for all fields. The ingredient list and step-by-step recipe should be comprehensive. The video tutorial link must be a valid, embeddable YouTube video that is not "unavailable" or private.
`,
});

const identifyNigerianDishFromImageFlow = ai.defineFlow(
  {
    name: 'identifyNigerianDishFromImageFlow',
    inputSchema: IdentifyNigerianDishFromImageInputSchema,
    outputSchema: IdentifyNigerianDishFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
     if (output?.videoTutorialLink) {
      if (!output.videoTutorialLink.startsWith('http')) {
        output.videoTutorialLink = `https://www.youtube.com/watch?v=${output.videoTutorialLink}`;
      }
    }
    return output!;
  }
);
