
import { config } from 'dotenv';
config();

import '@/ai/flows/retrieve-nigerian-recipe.ts';
import '@/ai/flows/identify-nigerian-dish-from-image.ts';
import '@/ai/flows/general-chat.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/find-restaurant.ts';
import '@/ai/tools/youtube-tool.ts';
