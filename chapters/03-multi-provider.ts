import { generateText } from "../src/core/generate-text";
import { createGoogle } from "../src/providers/google";
import { createOpenAI } from "../src/providers/openai";
import type { Message } from '../src/types';

const messages: Message[] = [
  { role: "user", content: "AIエージェントとは何ですか？" }
];

// OpenAI
const openai = createOpenAI()
const result1 = await generateText({ model: openai('gpt-5-mini'), messages })
console.log('OpenAI:', result1.text)

// Google
const google = createGoogle()
const result2 = await generateText({model: google('gemini-2.5-flash'), messages})
console.log('Google:', result2.text)
