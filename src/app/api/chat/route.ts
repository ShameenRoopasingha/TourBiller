// @ts-nocheck
import { google } from '@ai-sdk/google';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }
    const companyId = (session.user as any).companyId;

    if (!companyId) {
      return new Response('Company ID not found', { status: 400 });
    }

    const body = await req.json();
    console.log('API RECEIVED BODY:', typeof body, JSON.stringify(body));
    
    const messages = Array.isArray(body) ? body : body.messages;

    if (!messages) {
      throw new Error('Messages not found in request body');
    }

    // Polyfill parts array if missing, to prevent convertToModelMessages crash
    const sanitizedMessages = messages.map((m: any) => ({
      ...m,
      parts: m.parts || [{ type: 'text', text: m.content || '' }]
    }));

    const coreMessages = await convertToModelMessages(sanitizedMessages);

    const result = streamText({
      model: google('gemini-flash-lite-latest'),
      messages: coreMessages,
      system: "You are the VIGIL AI Assistant, a smart travel management system AI. You help administrators analyze bookings, vehicles, and business operations. Use the provided tools to query the database when asked about specific data. Always answer in a professional yet helpful tone. If a user asks a general question, answer it. If they ask about data, use tools.",
      tools: {
        getVehicleStats: tool({
          description: 'Get the count of active vehicles and total vehicles in the company.',
          parameters: z.object({
            query: z.string().optional().describe('Optional query string')
          }),
          execute: async () => {
            const total = await prisma.vehicle.count({ where: { companyId } });
            const active = await prisma.vehicle.count({ where: { companyId, status: 'ACTIVE' } });
            return { totalVehicles: total, activeVehicles: active };
          },
        }),
        getBookingStats: tool({
          description: 'Get statistics about bookings (e.g. pending, confirmed, cancelled).',
          parameters: z.object({
            query: z.string().optional()
          }),
          execute: async () => {
            const pending = await prisma.booking.count({ where: { companyId, status: 'PENDING' } });
            const confirmed = await prisma.booking.count({ where: { companyId, status: 'CONFIRMED' } });
            const cancelled = await prisma.booking.count({ where: { companyId, status: 'CANCELLED' } });
            return { pending, confirmed, cancelled };
          },
        }),
        searchCustomers: tool({
          description: 'Search for customers by name to get their details.',
          parameters: z.object({
            nameQuery: z.string().describe('The name or partial name of the customer to search for'),
          }),
          execute: async ({ nameQuery }: { nameQuery: string }) => {
            const customers = await prisma.customer.findMany({
              where: { companyId, name: { contains: nameQuery, mode: 'insensitive' } },
              take: 5,
              select: { name: true, mobile: true, email: true }
            });
            return { customers };
          },
        }),
      },
    });

    return result.toDataStreamResponse({
      getErrorMessage: (error: any) => {
        console.error("AI Error:", error);
        if (error && typeof error.message === 'string') {
          return error.message;
        }
        return String(error);
      }
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(error.message || String(error) || 'VIGIL_SERVER_ERROR', { status: 500 });
  }
}
