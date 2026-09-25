import { PrismaClient } from '@prisma/client';
import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

const prisma = new PrismaClient();
const companyId = 'test-company';

async function testApi() {
  const result = streamText({
    model: google('gemini-flash-latest'),
    messages: [{ role: 'user', content: 'How many active vehicles do we have?' }],
    maxSteps: 5,
    system: "Use the tools.",
    tools: {
      getVehicleStats: tool({
        description: 'Get the count of active vehicles.',
        parameters: z.object({ query: z.string().optional() }),
        execute: async () => {
          return { totalVehicles: 5, activeVehicles: 4 };
        },
      }),
    },
  });

  const response = result.toUIMessageStreamResponse();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (value) {
      console.log(decoder.decode(value, { stream: true }));
    }
    done = readerDone;
  }
}

testApi().catch(console.error);
