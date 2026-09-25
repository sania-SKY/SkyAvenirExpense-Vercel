import { env } from '../config/env.js';

export type CompanyExpensePayload = {
  expenseId: string;

  employee: {
    name: string;
    email: string;
  };

  category: string;

  businessPurpose: string;

  comments: string | null;

  attendees: string[];

  receiptStorageKey: string;

  submittedAt: string;
};

export type CompanyExpenseResponse = {
  externalReference: string;

  status:
    | 'PROCESSING'
    | 'COMPLETED'
    | 'REJECTED';
};

export async function sendExpenseToCompanyApi(
  payload:
    CompanyExpensePayload,
): Promise<CompanyExpenseResponse> {
  if (!env.companyApi.enabled) {
    throw new Error(
      'Company API integration is disabled.',
    );
  }

  if (
    !env.companyApi.baseUrl
  ) {
    throw new Error(
      'Company API URL is not configured.',
    );
  }

  const response =
    await fetch(
      `${env.companyApi.baseUrl}/expenses`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          /*
           * Replace this authentication
           * header only when we receive the
           * real external API specification.
           */
          'X-Client-Id':
            env.companyApi.clientId,

          'X-Client-Secret':
            env.companyApi.secret,
        },

        body:
          JSON.stringify(payload),

        signal:
          AbortSignal.timeout(
            15_000,
          ),
      },
    );

  if (!response.ok) {
    const message =
      await response.text();

    throw new Error(
      `Company API returned ${response.status}: ${message}`,
    );
  }

  return response.json();
}