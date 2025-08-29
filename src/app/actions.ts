'use server';

import {
  identifyNigerianDishFromImage,
  type IdentifyNigerianDishFromImageInput,
  type IdentifyNigerianDishFromImageOutput,
} from '@/ai/flows/identify-nigerian-dish-from-image';
import {
  retrieveNigerianRecipe,
  type RetrieveNigerianRecipeInput,
  type RetrieveNigerianRecipeOutput,
} from '@/ai/flows/retrieve-nigerian-recipe';
import {
  generalChat,
  type GeneralChatOutput,
} from '@/ai/flows/general-chat';
import {
    textToSpeech,
    type TextToSpeechInput,
    type TextToSpeechOutput
} from '@/ai/flows/text-to-speech'
import {
    findRestaurant,
    type FindRestaurantInput,
    type FindRestaurantOutput
} from '@/ai/flows/find-restaurant'

import type { Recipe } from '@/lib/types';

type ActionResult =
  | {
      type: 'recipe';
      data: Recipe;
    }
  | { type: 'text'; data: { response: string } }
  | { type: 'error'; message: string };

export async function processUserMessage({
  textQuery,
  imageDataUri,
}: {
  textQuery: string | null;
  imageDataUri: string | null;
}): Promise<ActionResult> {
  try {
    if (imageDataUri) {
      const result = await identifyNigerianDishFromImage({
        photoDataUri: imageDataUri,
      });

      if (!result.dishName) {
        return {
          type: 'text',
          data: { response: "I'm sorry, I couldn't recognize that dish. Can you try a different picture?" },
        };
      }
      
      const recipeData: Recipe = {
        dishName: result.dishName,
        culturalOrigin: result.culturalOrigin,
        ingredients: result.ingredientList,
        recipe: result.stepByStepRecipe,
        videoTutorialLink: result.videoTutorialLink,
      };
      
      return { type: 'recipe', data: recipeData };
    }

    if (textQuery) {
      const recipeKeywords = ['recipe', 'make', 'cook', 'prepare', 'how to'];
      const isRecipeQuery = recipeKeywords.some((keyword) =>
        textQuery.toLowerCase().includes(keyword)
      );

      if (isRecipeQuery) {
        const result = await retrieveNigerianRecipe({ dishName: textQuery });
        if (result && result.dishName) {
           const recipeData: Recipe = {
            dishName: result.dishName,
            culturalOrigin: result.culturalOrigin,
            ingredients: result.ingredients,
            recipe: result.recipe,
            videoTutorialLink: result.videoTutorialLink,
          };
          return { type: 'recipe', data: recipeData };
        }
      }
      
      const result = await generalChat({ query: textQuery });
      return { type: 'text', data: result };
    }

    return { type: 'error', message: 'Empty message submitted.' };
  } catch (e: any) {
    console.error(e);
    return {
      type: 'error',
      message: e.message || 'An error occurred while processing your request.',
    };
  }
}

export async function getSpeech(input: TextToSpeechInput): Promise<TextToSpeechOutput> {
    return await textToSpeech(input);
}

export async function findNearbyRestaurant(input: FindRestaurantInput): Promise<FindRestaurantOutput> {
    return await findRestaurant(input);
}
