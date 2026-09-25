import { env } from '../config/env.js';
import { pool } from '../database/pool.js';

import {
    sendExpenseToCompanyApi,
} from './companyApiService.js';

let workerRunning =
  false;

export async function processIntegrationJobs() {
  if (
    workerRunning ||
    !env.companyApi.enabled
  ) {
    return;
  }

  workerRunning = true;

  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    const jobResult =
      await client.query(
        `
          SELECT
            j.id,
            j.expense_id,
            j.attempts

          FROM integration_jobs j

          WHERE
            j.status IN (
              'PENDING',
              'RETRY'
            )

            AND
            j.next_attempt_at <= NOW()

          ORDER BY
            j.created_at

          FOR UPDATE
          SKIP LOCKED

          LIMIT 1
        `,
      );

    if (!jobResult.rowCount) {
      await client.query(
        'COMMIT',
      );

      return;
    }

    const job =
      jobResult.rows[0];

    await client.query(
      `
        UPDATE integration_jobs

        SET
          status = 'PROCESSING',
          attempts = attempts + 1,
          updated_at = NOW()

        WHERE id = $1
      `,
      [job.id],
    );

    const expenseResult =
      await client.query(
        `
          SELECT
            e.id,
            e.category,
            e.business_purpose,
            e.comments,
            e.receipt_storage_key,
            e.submitted_at,

            u.name,
            u.email

          FROM expenses e

          INNER JOIN users u
            ON u.id = e.user_id

          WHERE e.id = $1
        `,
        [job.expense_id],
      );

    const expense =
      expenseResult.rows[0];

    if (!expense) {
      throw new Error(
        'Expense not found.',
      );
    }

    const attendeeResult =
      await client.query(
        `
          SELECT name

          FROM expense_attendees

          WHERE expense_id = $1

          ORDER BY created_at
        `,
        [expense.id],
      );

    /*
     * Release DB transaction before
     * making external network request.
     */
    await client.query(
      'COMMIT',
    );

    const result =
      await sendExpenseToCompanyApi({
        expenseId:
          expense.id,

        employee: {
          name:
            expense.name,

          email:
            expense.email,
        },

        category:
          expense.category,

        businessPurpose:
          expense.business_purpose,

        comments:
          expense.comments,

        attendees:
          attendeeResult.rows.map(
            (row) => row.name,
          ),

        receiptStorageKey:
          expense.receipt_storage_key,

        submittedAt:
          expense.submitted_at
            .toISOString(),
      });

    await pool.query(
      `
        UPDATE expenses

        SET
          status = $1,
          external_status = $1,
          external_reference = $2,
          external_error = NULL,
          last_sync_at = NOW(),
          updated_at = NOW()

        WHERE id = $3
      `,
      [
        result.status,
        result.externalReference,
        expense.id,
      ],
    );

    await pool.query(
      `
        UPDATE integration_jobs

        SET
          status = 'COMPLETED',
          last_error = NULL,
          updated_at = NOW()

        WHERE id = $1
      `,
      [job.id],
    );

    await pool.query(
      `
        INSERT INTO
          expense_integration_events (
            expense_id,
            event_type,
            external_status,
            external_reference,
            message
          )

        VALUES (
          $1,
          'SUBMISSION_ACCEPTED',
          $2,
          $3,
          NULL
        )
      `,
      [
        expense.id,
        result.status,
        result.externalReference,
      ],
    );
  } catch (error) {
    try {
      await client.query(
        'ROLLBACK',
      );
    } catch {
      // Transaction may already be committed.
    }

    console.error(
      'Integration worker error:',
      error,
    );
  } finally {
    client.release();

    workerRunning = false;
  }
}