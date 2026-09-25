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
      model: google('gemini-1.5-flash'),
      messages: coreMessages,
      system: "You are the VIGIL AI Assistant, a smart travel management system AI. You help administrators manage quotations, bookings, and vehicles. When a user provides details for a trip, ALWAYS use the generateDraftQuotation tool and meticulously extract all the relevant details (like destination, days, persons, vehicle type) into the tool's parameters. NEVER leave the parameters empty if the user provided the details. If they ask about data, use the relevant database tools.",
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
        generateDraftQuotation: tool({
          description: "Extract quotation details from the user's prompt to auto-fill the quotation form. Always call this tool when the user asks to generate or draft a quotation.",
          parameters: z.object({
            customerName: z.string().describe('Name of the customer').optional(),
            vehicleType: z.string().describe('Type or category of the vehicle (e.g. KDH, Car, Van)').optional(),
            numberOfPersons: z.number().describe('Number of people travelling'),
            days: z.number().describe('Duration of the trip in days'),
            pickupLocation: z.string().optional(),
            dropLocation: z.string().optional(),
            destination: z.string().describe('Main destination of the trip'),
            hireRatePerDay: z.number().describe('Estimated hire rate per day').optional(),
            driverCostPerDay: z.number().describe('Estimated driver cost per day').optional(),
            notes: z.string().describe('Any other special requirements or notes').optional()
          }),
          execute: async (args) => {
            return { success: true, draft: args };
          }
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

    return result.toUIMessageStreamResponse({
      onError: (error: any) => {
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


