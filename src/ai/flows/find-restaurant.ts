'use server';
/**
 * @fileOverview A flow for finding nearby restaurants.
 *
 * - findRestaurant - Finds a nearby restaurant for a given dish.
 * - FindRestaurantInput - The input type for the findRestaurant function.
 * - FindRestaurantOutput - The return type for the findRestaurant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FindRestaurantInputSchema = z.object({
  dishName: z.string().describe('The name of the Nigerian dish.'),
  latitude: z.number().describe('The latitude of the user\'s location.'),
  longitude: z.number().describe('The longitude of the user\'s location.'),
});
export type FindRestaurantInput = z.infer<typeof FindRestaurantInputSchema>;

const RestaurantSchema = z.object({
  restaurantName: z.string().describe('The name of the recommended restaurant or fast food place.'),
  address: z.string().describe('The full address of the establishment.'),
  driveTime: z.string().describe("The estimated driving time from the user's location."),
  walkTime: z.string().describe("The estimated walking time from the user's location."),
  mapsUrl: z.string().url().describe('A Google Maps URL to the establishment.'),
});

const FindRestaurantOutputSchema = z.object({
  restaurants: z.array(RestaurantSchema).describe('A list of up to 7 nearby Nigerian restaurants or fast food places, sorted by proximity.'),
});
export type FindRestaurantOutput = z.infer<typeof FindRestaurantOutputSchema>;

export async function findRestaurant(input: FindRestaurantInput): Promise<FindRestaurantOutput> {
  return findRestaurantFlow(input);
}

const findRestaurantPrompt = ai.definePrompt({
  name: 'findRestaurantPrompt',
  input: { schema: FindRestaurantInputSchema },
  output: { schema: FindRestaurantOutputSchema },
  prompt: `You are a helpful assistant that finds local restaurants and fast food places. The user is looking for a place to eat the Nigerian dish "{{dishName}}".

Their current location is latitude: {{{latitude}}} and longitude: {{{longitude}}}.

Find up to 7 of the closest Nigerian restaurants or fast food places to this location that are likely to serve this dish. You must verify the establishment serves the dish. Sort the results by proximity, with the closest one first.

For each restaurant or fast food place, provide its name, full address, estimated driving time, estimated walking time, and a Google Maps URL to its location.
`,
});

const findRestaurantFlow = ai.defineFlow(
  {
    name: 'findRestaurantFlow',
    inputSchema: FindRestaurantInputSchema,
    outputSchema: FindRestaurantOutputSchema,
  },
  async input => {
    const { output } = await findRestaurantPrompt(input);
    return output!;
  }
);
