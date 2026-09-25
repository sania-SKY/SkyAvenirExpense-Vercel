export type ExpenseStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED';

export type CreateExpenseInput = {
  category: string;
  businessPurpose: string;
  comments: string | null;
  receiptStorageKey: string;
  attendees: string[];
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