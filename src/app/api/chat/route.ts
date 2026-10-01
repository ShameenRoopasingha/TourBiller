// @ts-nocheck
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool, convertToModelMessages } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Initialize Groq API using the OpenAI provider compatibility
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || '',
});

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

    // Polyfill parts array if missing
    const sanitizedMessages = messages.map((m: any) => ({
      ...m,
      parts: m.parts || [{ type: 'text', text: m.content || '' }]
    }));

    const coreMessages = await convertToModelMessages(sanitizedMessages);

    let agentKnowledge = "";
    try {
      const fs = require('fs');
      const path = require('path');
      const knowledgePath = path.join(process.cwd(), 'src', 'agent-knowledge.md');
      agentKnowledge = fs.readFileSync(knowledgePath, 'utf8');
    } catch (e) {
      console.log('Knowledge base file not found');
    }

    const result = streamText({
      model: groq('openai/gpt-oss-120b'),
      maxSteps: 5, // IMPORTANT: Allows the agent to reply AFTER using a tool
      messages: coreMessages,
      system: `You are the VIGIL AI Assistant, a smart travel management system AI. You help administrators manage quotations, bookings, customers, and vehicles. You have the power to DIRECTLY save data to the database. Use the appropriate tools to create bookings, quotations, customers, and vehicles when requested by the user.
      
IMPORTANT BUSINESS RULES AND KNOWLEDGE:
${agentKnowledge}`,
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

        addCustomer: tool({
          description: 'Add a new customer to the database.',
          parameters: z.object({
            name: z.string().describe('Full name of the customer'),
            mobile: z.string().optional().describe('Mobile phone number of the customer'),
            email: z.string().optional().describe('Email address of the customer'),
            address: z.string().optional().describe('Physical address of the customer')
          }),
          execute: async ({ name, mobile, email, address }) => {
            const customer = await prisma.customer.create({
              data: { companyId, name, mobile, email, address }
            });
            return { success: true, message: `Customer ${name} added successfully to the database!` };
          }
        }),

        addVehicle: tool({
          description: 'Add a new vehicle to the database.',
          parameters: z.object({
            vehicleNo: z.string().optional().describe('Vehicle registration number'),
            category: z.string().optional().describe('Category (e.g. CAR, VAN, SUV, BUS)'),
            model: z.string().optional().describe('Model (e.g. Toyota KDH)'),
            seats: z.number().optional(),
            ratePerDay: z.number().optional(),
            kmPerDay: z.number().optional(),
            excessKmRate: z.number().optional(),
            extraHourRate: z.number().optional()
          }),
          execute: async (args) => {
            try {
              let { vehicleNo, category, model, seats, ratePerDay, kmPerDay, excessKmRate, extraHourRate } = args;
              
              const lastMsg = sanitizedMessages.filter((m: any) => m.role === 'user').pop()?.content || '';
              
              // Fallback for models that return empty arguments
              if (!vehicleNo || !category) {
                const noMatch = lastMsg.match(/([A-Z]{2,3}-\d{4})/i) || lastMsg.match(/([A-Z]{2,3}\s\d{4})/i);
                const catMatch = lastMsg.match(/(van|car|suv|bus|three wheeler|kdh)/i);
                
                if (noMatch) vehicleNo = noMatch[1].toUpperCase().replace(' ', '-');
                if (catMatch) category = catMatch[1].toUpperCase();
                if (category === 'KDH') category = 'VAN';
              }

              if (!vehicleNo) {
                return { success: false, error: "Missing vehicle number. Please provide a valid number like CAB-1234." };
              }

              // Extract numbers using simple regex if not provided by LLM
              const extractNum = (keyword: string) => {
                 const regex = new RegExp(`${keyword}\\s*(?:is|:)?\\s*(\\d+)`, 'i');
                 const match = lastMsg.match(regex);
                 return match ? parseInt(match[1]) : undefined;
              };

              seats = seats || extractNum('seats') || extractNum('seat') || 0;
              ratePerDay = ratePerDay || extractNum('rate') || 0;
              kmPerDay = kmPerDay || extractNum('km per day') || 0;
              excessKmRate = excessKmRate || extractNum('extra km') || 0;
              extraHourRate = extraHourRate || extractNum('extra hour') || 0;
              
              if (!model && category === 'VAN' && lastMsg.toLowerCase().includes('kdh')) model = 'Toyota KDH';

              const vehicle = await prisma.vehicle.create({
                data: { 
                  companyId, 
                  vehicleNo, 
                  category: category || 'CAR', 
                  model, 
                  seats, 
                  ratePerDay, 
                  kmPerDay, 
                  excessKmRate, 
                  extraHourRate, 
                  status: 'ACTIVE' 
                }
              });
              return { success: true, message: `Vehicle ${vehicleNo} (${category}) added successfully with all details!` };
            } catch (e: any) {
              console.error("DB Error in addVehicle:", e);
              return { success: false, error: e.message };
            }
          }
        }),

        searchTours: tool({
          description: 'Search for available tour schedules to get their IDs and base prices. Use this before creating a quotation if you need the tourScheduleId.',
          parameters: z.object({
            query: z.string().describe('The name of the tour to search for (e.g., Kandy, Galle)')
          }),
          execute: async ({ query }) => {
            const tours = await prisma.tourSchedule.findMany({
              where: { companyId, name: { contains: query, mode: 'insensitive' } },
              take: 3,
              select: { id: true, name: true, days: true, basePricePerPerson: true }
            });
            return { tours };
          }
        }),

        createBooking: tool({
          description: 'Create a new REAL booking in the database. Use this when the user asks to book a trip.',
          parameters: z.object({
            customerName: z.string().describe('Name of the customer'),
            vehicleNo: z.string().describe('Vehicle registration number (e.g. CAB-1234). Use "TBD" if not specified.'),
            startDate: z.string().describe('Start date in YYYY-MM-DD format'),
            destination: z.string().describe('Main destination of the trip'),
            notes: z.string().optional()
          }),
          execute: async ({ customerName, vehicleNo, startDate, destination, notes }) => {
            const booking = await prisma.booking.create({
              data: {
                companyId,
                customerName,
                vehicleNo,
                startDate: new Date(startDate),
                destination,
                notes,
                status: 'CONFIRMED'
              }
            });
            return { success: true, bookingId: booking.id, message: `Booking for ${customerName} to ${destination} successfully saved in the database!` };
          }
        }),

        createQuotation: tool({
          description: 'Create a new REAL quotation in the database. Call searchTours first if you do not know the tourScheduleId.',
          parameters: z.object({
            customerName: z.string().describe('Name of the customer'),
            tourScheduleId: z.string().describe('The database ID of the tour schedule'),
            numberOfPersons: z.number().describe('Number of people travelling'),
            totalAmount: z.number().describe('Calculated total amount for the quotation')
          }),
          execute: async ({ customerName, tourScheduleId, numberOfPersons, totalAmount }) => {
            const quotation = await prisma.quotation.create({
              data: {
                companyId,
                customerName,
                tourScheduleId,
                numberOfPersons,
                totalAmount,
                status: 'DRAFT'
              }
            });
            return { 
              success: true, 
              quotationNumber: quotation.quotationNumber, 
              message: `Quotation #${quotation.quotationNumber} created successfully and saved to the database!` 
            };
          }
        }),

        createBill: tool({
          description: 'Create a new REAL bill/invoice in the database after a trip is completed.',
          parameters: z.object({
            customerName: z.string().describe('Name of the customer'),
            vehicleNo: z.string().describe('Vehicle registration number'),
            route: z.string().describe('The route taken (e.g., Colombo to Kandy)'),
            startMeter: z.number().describe('Starting mileage/meter reading'),
            endMeter: z.number().describe('Ending mileage/meter reading'),
            hireRate: z.number().describe('Rate charged for the hire'),
            totalAmount: z.number().describe('Calculated total amount for the bill')
          }),
          execute: async ({ customerName, vehicleNo, route, startMeter, endMeter, hireRate, totalAmount }) => {
            const bill = await prisma.bill.create({
              data: {
                companyId,
                customerName,
                vehicleNo,
                route,
                startMeter,
                endMeter,
                hireRate,
                totalAmount,
                paymentMethod: 'CASH',
                currency: 'LKR'
              }
            });
            return {
              success: true,
              billNumber: bill.billNumber,
              message: `Bill #${bill.billNumber} created successfully for ${customerName}!`
            };
          }
        }),

        updateVehicle: tool({
          description: 'Update an existing vehicle.',
          parameters: z.object({
            vehicleNo: z.string().optional(),
            ratePerDay: z.number().optional(),
            status: z.string().optional()
          }),
          execute: async (args) => {
            try {
              let { vehicleNo, ratePerDay, status } = args;
              const lastMsg = sanitizedMessages.filter((m: any) => m.role === 'user').pop()?.content || '';
              const noMatch = lastMsg.match(/([A-Z]{2,3}-\d{4})/i) || lastMsg.match(/([A-Z]{2,3}\s\d{4})/i);
              if (noMatch) vehicleNo = noMatch[1].toUpperCase().replace(' ', '-');
              
              if (!vehicleNo) return { success: false, error: "Please specify the vehicle number to update." };

              const extractNum = (keyword: string) => {
                 const regex = new RegExp(`${keyword}\\s*(?:is|:)?\\s*(\\d+)`, 'i');
                 const match = lastMsg.match(regex);
                 return match ? parseInt(match[1]) : undefined;
              };
              ratePerDay = ratePerDay || extractNum('rate') || extractNum('price');
              if (lastMsg.toLowerCase().includes('inactive') || lastMsg.toLowerCase().includes('maintenance')) status = 'MAINTENANCE';

              await prisma.vehicle.update({
                 where: { companyId_vehicleNo: { companyId, vehicleNo } },
                 data: {
                    ...(ratePerDay && { ratePerDay }),
                    ...(status && { status })
                 }
              });
              return { success: true, message: `Vehicle ${vehicleNo} updated successfully!` };
            } catch (e: any) {
              return { success: false, error: "Vehicle not found or update failed." };
            }
          }
        }),

        getMonthlyEarnings: tool({
          description: 'Get total earnings for the current month from bills.',
          parameters: z.object({}),
          execute: async () => {
             const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
             const bills = await prisma.bill.findMany({
                where: { companyId, createdAt: { gte: startOfMonth } }
             });
             const total = bills.reduce((sum: number, bill: any) => sum + bill.totalAmount, 0);
             return { success: true, totalEarnings: total, currency: 'LKR', billsCount: bills.length };
          }
        }),

        getMostUsedVehicle: tool({
          description: 'Get the most used vehicle based on completed bills.',
          parameters: z.object({}),
          execute: async () => {
             const bills = await prisma.bill.findMany({ where: { companyId } });
             const counts = bills.reduce((acc: any, bill: any) => {
                 acc[bill.vehicleNo] = (acc[bill.vehicleNo] || 0) + 1;
                 return acc;
             }, {});
             const mostUsed = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0];
             if (!mostUsed) return { success: true, message: "No bills found yet." };
             return { success: true, vehicleNo: mostUsed[0], timesUsed: mostUsed[1] };
          }
        })
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
