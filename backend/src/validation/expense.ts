import {
  z,
} from 'zod';

const attendeeTypeSchema =
  z.enum([
    'WAVETRONIX_EMPLOYEE',
    'NON_WAVETRONIX',
  ]);

const attendeeSchema =
  z.object({
    name:
      z
        .string()
        .trim()
        .min(
          1,
          'Attendee name cannot be empty.',
        )
        .max(
          255,
          'Attendee name is too long.',
        ),

    attendeeType:
      attendeeTypeSchema,
  });

export const createExpenseSchema =
  z.object({
    category:
      z
        .string()
        .trim()
        .min(
          1,
          'Category is required.',
        )
        .max(255),

    businessPurpose:
      z
        .string()
        .trim()
        .min(
          1,
          'Business purpose is required.',
        )
        .max(255),

    comments:
      z
        .string()
        .trim()
        .max(
          2000,
          'Comments cannot exceed 2000 characters.',
        )
        .optional()
        .nullable(),

    receiptStorageKey:
      z
        .string()
        .trim()
        .min(
          1,
          'Receipt is required.',
        ),

    attendees:
      z
        .array(
          attendeeSchema,
        )
        .max(
          100,
          'Too many attendees.',
        )
        .optional()
        .default([]),
  });

export type CreateExpenseRequest =
  z.infer<
    typeof createExpenseSchema
  >;