
'use server';
/**
 * @fileoverview A tool for finding relevant and available YouTube videos.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getVideoDetails } from '@/services/youtube';

export const findYoutubeVideoTool = ai.defineTool(
  {
    name: 'findYoutubeVideo',
    description: 'Finds a relevant and available YouTube video for a given query. Use this to find a video tutorial for a recipe.',
    inputSchema: z.object({
      query: z.string().describe('The search query for the YouTube video, e.g., "Jollof Rice recipe".'),
    }),
    outputSchema: z.object({
      videoId: z.string().describe('The ID of the found YouTube video.'),
      title: z.string().describe('The title of the YouTube video.'),
    }),
  },
  async (input) => {
    const videoDetails = await getVideoDetails(input.query);
    if (!videoDetails) {
      throw new Error('Could not find a suitable YouTube video.');
    }
    return {
      videoId: videoDetails.videoId,
      title: videoDetails.title,
    };
  }
);
