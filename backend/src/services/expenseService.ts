import {
    pool,
} from '../database/pool.js';

import type {
    AuthenticatedUser,
} from '../middleware/auth.js';

import type {
    CreateExpenseInput,
} from '../types/expense.js';

import {
    resolveUserId,
} from './userService.js';

/*
 * ------------------------------------------------
 * Create expense + attendees + integration job.
 *
 * All operations are committed atomically.
 * ------------------------------------------------
 */

export async function createExpense(
  authenticatedUser:
    AuthenticatedUser,

  input:
    CreateExpenseInput,
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    /*
     * Convert Google/Microsoft/etc. provider identity
     * into our internal PostgreSQL users.id UUID.
     */
    const userId =
      await resolveUserId(
        client,
        authenticatedUser,
      );

    const expenseResult =
      await client.query(
        `
          INSERT INTO expenses (
            user_id,
            category,
            business_purpose,
            comments,
            receipt_storage_key,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            'SUBMITTED'
          )
          RETURNING
            id,
            user_id,
            category,
            business_purpose,
            comments,
            receipt_storage_key,
            status,
            external_reference,
            external_status,
            external_error,
            last_sync_at,
            submitted_at,
            created_at,
            updated_at
        `,
        [
          userId,
          input.category,
          input.businessPurpose,
          input.comments,
          input.receiptStorageKey,
        ],
      );

    const expense =
      expenseResult.rows[0];

    /*
     * Insert attendees using one query.
     */
    if (
      input.attendees.length > 0
    ) {
      const values:
        string[] = [];

      const params:
        unknown[] = [];

      input.attendees.forEach(
        (name, index) => {
          const expenseParam =
            index * 2 + 1;

          const nameParam =
            index * 2 + 2;

          values.push(
            `($${expenseParam}, $${nameParam})`,
          );

          params.push(
            expense.id,
            name,
          );
        },
      );

      await client.query(
        `
          INSERT INTO expense_attendees (
            expense_id,
            name
          )
          VALUES
          ${values.join(', ')}
        `,
        params,
      );
    }

    /*
     * Queue external integration.
     *
     * COMPANY_API_ENABLED can remain false.
     * The network integration does not block
     * creation of the expense.
     */
    await client.query(
      `
        INSERT INTO integration_jobs (
          expense_id,
          status
        )
        VALUES (
          $1,
          'PENDING'
        )
        ON CONFLICT (expense_id)
        DO NOTHING
      `,
      [
        expense.id,
      ],
    );

    await client.query(
      'COMMIT',
    );

    return {
      ...expense,

      attendees:
        input.attendees,
    };
  } catch (error) {
    await client.query(
      'ROLLBACK',
    );

    throw error;
  } finally {
    client.release();
  }
}

/*
 * ------------------------------------------------
 * Return only expenses belonging to the currently
 * authenticated employee.
 * ------------------------------------------------
 */

export async function getMyExpenses(
  authenticatedUser:
    AuthenticatedUser,
) {
  const result =
    await pool.query(
      `
        SELECT
          e.id,
          e.category,
          e.business_purpose,
          e.comments,
          e.receipt_storage_key,
          e.status,

          e.external_reference,
          e.external_status,
          e.external_error,
          e.last_sync_at,

          e.submitted_at,
          e.created_at,
          e.updated_at,

          COALESCE(
            json_agg(
              ea.name
              ORDER BY ea.created_at
            )
            FILTER (
              WHERE ea.id IS NOT NULL
            ),
            '[]'::json
          ) AS attendees

        FROM expenses e

        INNER JOIN users u
          ON u.id = e.user_id

        LEFT JOIN expense_attendees ea
          ON ea.expense_id = e.id

        WHERE
          u.auth_provider = $1
          AND
          u.provider_user_id = $2

        GROUP BY e.id

        ORDER BY
          e.submitted_at DESC

        LIMIT 100
      `,
      [
        authenticatedUser.provider,
        authenticatedUser.providerUserId,
      ],
    );

  return result.rows;
}

/*
 * ------------------------------------------------
 * Return one expense only when it belongs to the
 * currently authenticated employee.
 * ------------------------------------------------
 */

export async function getExpenseById(
  authenticatedUser:
    AuthenticatedUser,

  expenseId:
    string,
) {
  const result =
    await pool.query(
      `
        SELECT
          e.id,
          e.category,
          e.business_purpose,
          e.comments,
          e.receipt_storage_key,
          e.status,

          e.external_reference,
          e.external_status,
          e.external_error,
          e.last_sync_at,

          e.submitted_at,
          e.created_at,
          e.updated_at,

          COALESCE(
            json_agg(
              ea.name
              ORDER BY ea.created_at
            )
            FILTER (
              WHERE ea.id IS NOT NULL
            ),
            '[]'::json
          ) AS attendees

        FROM expenses e

        INNER JOIN users u
          ON u.id = e.user_id

        LEFT JOIN expense_attendees ea
          ON ea.expense_id = e.id

        WHERE
          e.id = $1
          AND
          u.auth_provider = $2
          AND
          u.provider_user_id = $3

        GROUP BY e.id

        LIMIT 1
      `,
      [
        expenseId,
        authenticatedUser.provider,
        authenticatedUser.providerUserId,
      ],
    );

  return (
    result.rows[0] ??
    null
  );
}