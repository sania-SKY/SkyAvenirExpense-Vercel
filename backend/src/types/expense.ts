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