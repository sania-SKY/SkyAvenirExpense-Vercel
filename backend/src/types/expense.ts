export type ExpenseStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED';

export type AttendeeType =
  | 'WAVETRONIX_EMPLOYEE'
  | 'NON_WAVETRONIX';

export type ExpenseAttendeeInput = {
  name: string;
  attendeeType: AttendeeType;
};

export type CreateExpenseInput = {
  category: string;

  businessPurpose: string;

  comments: string | null;

  receiptStorageKey: string;

  attendees: ExpenseAttendeeInput[];

  /*
   * When true the expense is stored as FAILED
   * (Needs Review) instead of SUBMITTED, e.g. a
   * blurry receipt that must be retaken.
   */
  receiptNeedsReview?:
    boolean;

  reviewReason?:
    string | null;
};

export type ReplaceReceiptInput = {
  receiptStorageKey: string;

  /*
   * Optional edits made on the submit screen while
   * retaking. Omitted fields keep their stored
   * values.
   */
  category?: string;

  businessPurpose?: string;

  comments?: string | null;

  attendees?: ExpenseAttendeeInput[];

  /*
   * A retaken photo that is still blurry keeps the
   * expense in Needs Review; a clear one sends it
   * back to Submitted and queues the integration.
   */
  receiptNeedsReview?:
    boolean;

  reviewReason?:
    string | null;
};

export type ExpenseRecord = {
  id: string;

  userId: string;

  category: string;

  businessPurpose: string;

  comments: string | null;

  receiptStorageKey: string;

  status: ExpenseStatus;

  externalReference:
    | string
    | null;

  externalStatus:
    | string
    | null;

  externalError:
    | string
    | null;

  submittedAt: Date;

  createdAt: Date;

  updatedAt: Date;
};