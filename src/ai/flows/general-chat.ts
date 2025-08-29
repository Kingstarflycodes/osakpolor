'use server';
/**
 * @fileOverview A general conversational AI agent for handling greetings and small talk.
 *
 * - generalChat - A function that provides conversational responses.
 * - GeneralChatInput - The input type for the generalChat function.
 * - GeneralChatOutput - The return type for the generalChat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneralChatInputSchema = z.object({
  query: z.string().describe('The user\'s conversational input, like a greeting.'),
});
export type GeneralChatInput = z.infer<typeof GeneralChatInputSchema>;

const GeneralChatOutputSchema = z.object({
  response: z.string().describe('A friendly, conversational response.'),
});
export type GeneralChatOutput = z.infer<typeof GeneralChatOutputSchema>;

export async function generalChat(input: GeneralChatInput): Promise<GeneralChatOutput> {
  return generalChatFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generalChatPrompt',
  input: {schema: GeneralChatInputSchema},
  output: {schema: GeneralChatOutputSchema},
  prompt: `You are Osakpolor, the Naija Chef, a friendly and warm Nigerian chef chatbot. Your personality is welcoming and you sometimes use Nigerian Pidgin English phrases.

A user has said the following to you:
"{{{query}}}"

Respond in a friendly, conversational manner in English. If the user greets you, greet them back warmly. Keep your responses brief and engaging.
`,
});

const generalChatFlow = ai.defineFlow(
  {
    name: 'generalChatFlow',
    inputSchema: GeneralChatInputSchema,
    outputSchema: GeneralChatOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
