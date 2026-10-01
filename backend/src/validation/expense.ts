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

    receiptNeedsReview:
      z
        .boolean()
        .optional()
        .default(
          false,
        ),

    reviewReason:
      z
        .string()
        .trim()
        .max(
          500,
        )
        .optional()
        .nullable(),
  });

export type CreateExpenseRequest =
  z.infer<
    typeof createExpenseSchema
  >;

/*
 * Retaking a blurry receipt replaces the image on
 * an existing expense. Everything the employee
 * already filled in stays untouched.
 */

export const replaceReceiptSchema =
  z.object({
    receiptStorageKey:
      z
        .string()
        .trim()
        .min(
          1,
          'Receipt is required.',
        ),

    category:
      z
        .string()
        .trim()
        .min(
          1,
          'Category is required.',
        )
        .max(255)
        .optional(),

    businessPurpose:
      z
        .string()
        .trim()
        .min(
          1,
          'Business purpose is required.',
        )
        .max(255)
        .optional(),

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

    attendees:
      z
        .array(
          attendeeSchema,
        )
        .max(
          100,
          'Too many attendees.',
        )
        .optional(),

    receiptNeedsReview:
      z
        .boolean()
        .optional()
        .default(
          false,
        ),

    reviewReason:
      z
        .string()
        .trim()
        .max(
          500,
        )
        .optional()
        .nullable(),
  });

export type ReplaceReceiptRequest =
  z.infer<
    typeof replaceReceiptSchema
  >;