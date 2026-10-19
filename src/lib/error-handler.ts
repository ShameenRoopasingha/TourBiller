import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { NextResponse } from 'next/server';
import { type ActionResult } from '@/lib/validations';

/**
 * Extracts a user-friendly, sanitized error message from any error type
 * (Zod validation, Prisma database errors, standard Errors, or unknown throws).
 */
export function formatErrorMessage(error: unknown, fallbackMessage: string = 'An unexpected error occurred'): string {
  if (!error) {
    return fallbackMessage;
  }

  // 1. Zod Validation Errors
  if (error instanceof ZodError) {
    if (error.issues && error.issues.length > 0) {
      // Return joined clean messages or the first explicit message
      const messages = error.issues
        .map((issue) => issue.message)
        .filter((msg) => Boolean(msg) && msg !== 'Required');
      if (messages.length > 0) {
        return messages.slice(0, 3).join('. ');
      }
      const first = error.issues[0];
      const path = first.path.length > 0 ? ` (${first.path.join('.')})` : '';
      return `${first.message}${path}`;
    }
    return 'Invalid data submitted. Please check the required fields.';
  }

  // 2. Prisma Database Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = error.meta?.target;
        const targetStr = Array.isArray(target) ? target.join(', ') : String(target || '');
        if (targetStr.includes('vehicleNo')) {
          return 'A vehicle with this registration number already exists in your company fleet.';
        }
        if (targetStr.includes('billNumber')) {
          return 'A bill with this bill number already exists.';
        }
        if (targetStr.includes('quotationNumber')) {
          return 'A quotation with this number already exists.';
        }
        if (targetStr.includes('email')) {
          return 'An account with this email address already exists.';
        }
        if (targetStr.includes('name')) {
          return 'A record with this name already exists in your company.';
        }
        return 'A record with these unique details already exists.';
      }
      case 'P2003':
        return 'Cannot complete operation: this record is referenced by other active documents (e.g. bookings, bills, or quotations).';
      case 'P2025':
        return 'The requested record was not found or has already been removed.';
      case 'P2014':
        return 'The requested change violates a required relation between records.';
      case 'P2000':
        return 'One of the provided values exceeds the maximum permitted length.';
      default:
        return fallbackMessage;
    }
  }

  // 3. Database Connection / Pool / Infrastructure Errors
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return 'Database service is temporarily unavailable. Please verify your connection and try again in a moment.';
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return 'Invalid data format provided for database operation.';
  }

  // 4. Standard JavaScript Error
  if (error instanceof Error) {
    const msg = error.message;

    // Filter out internal stack traces, connection strings or raw SQL leaks
    if (
      msg.includes('prisma.') ||
      msg.includes('postgresql://') ||
      msg.includes('postgres://') ||
      msg.includes('at Object.') ||
      msg.includes('Invocation:')
    ) {
      return fallbackMessage;
    }

    // Check if the message is already a raw JSON string from Zod .parse()
    if (msg.startsWith('[\n  {\n') || (msg.startsWith('[{"') && msg.includes('"message"'))) {
      try {
        const parsed = JSON.parse(msg);
        if (Array.isArray(parsed) && parsed[0]?.message) {
          return parsed.map((p: any) => p.message).slice(0, 3).join('. ');
        }
      } catch {
        // Fallback below
      }
    }

    return msg || fallbackMessage;
  }

  // 5. String or primitives
  if (typeof error === 'string') {
    return error;
  }

  return fallbackMessage;
}

/**
 * Standard Server Action error sanitizer.
 * Logs full technical details to console.error and returns user-safe ActionResult.
 */
export function formatActionError<T = never>(
  error: unknown,
  fallbackMessage: string = 'Operation failed. Please try again.'
): ActionResult<T> {
  console.error('[Server Action Error]:', error);
  const friendlyError = formatErrorMessage(error, fallbackMessage);
  return {
    success: false,
    error: friendlyError,
  };
}

/**
 * Standard API Route error handler.
 * Returns an HTTP NextResponse with appropriate status code and sanitized error.
 */
export function formatApiErrorResponse(
  error: unknown,
  fallbackMessage: string = 'Internal server error',
  defaultStatus: number = 400
): NextResponse {
  console.error('[API Route Error]:', error);

  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, error: formatErrorMessage(error, fallbackMessage) },
      { status: 400 }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: formatErrorMessage(error, fallbackMessage) },
        { status: 404 }
      );
    }
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: formatErrorMessage(error, fallbackMessage) },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: formatErrorMessage(error, fallbackMessage) },
      { status: 400 }
    );
  }

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return NextResponse.json(
      { success: false, error: formatErrorMessage(error, fallbackMessage) },
      { status: 503 }
    );
  }

  const message = formatErrorMessage(error, fallbackMessage);
  return NextResponse.json(
    { success: false, error: message },
    { status: defaultStatus }
  );
}
