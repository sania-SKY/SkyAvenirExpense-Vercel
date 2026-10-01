import {
  pool,
} from '../database/pool.js';

import type {
  AuthenticatedUser,
} from '../middleware/auth.js';

import type {
  CreateExpenseInput,
  ReplaceReceiptInput,
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

    const userId =
      await resolveUserId(
        client,
        authenticatedUser,
      );

    const needsReview =
      Boolean(
        input.receiptNeedsReview,
      );

    const reviewReason =
      needsReview
        ? (
            input.reviewReason?.trim() ||
            'This image is blurry. Please retake a clear photo of this receipt.'
          )
        : null;

    const expenseResult =
      await client.query(
        `
          INSERT INTO expenses (
            user_id,
            category,
            business_purpose,
            comments,
            receipt_storage_key,
            status,
            external_status,
            external_error
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
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
          needsReview
            ? 'FAILED'
            : 'SUBMITTED',
          needsReview
            ? 'NEEDS_REVIEW'
            : null,
          reviewReason,
        ],
      );

    const expense =
      expenseResult.rows[0];

    /*
     * Insert attendee name + attendee type.
     */

    if (
      input.attendees.length >
      0
    ) {
      const values:
        string[] = [];

      const params:
        unknown[] = [];

      input.attendees.forEach(
        (
          attendee,
          index,
        ) => {
          const base =
            index * 3;

          values.push(
            `($${base + 1}, $${base + 2}, $${base + 3})`,
          );

          params.push(
            expense.id,
            attendee.name,
            attendee.attendeeType,
          );
        },
      );

      await client.query(
        `
          INSERT INTO expense_attendees (
            expense_id,
            name,
            attendee_type
          )
          VALUES
          ${values.join(', ')}
        `,
        params,
      );
    }

    /*
     * Queue external integration only for
     * clean submissions. Blurry / Needs Review
     * receipts stay local until the employee
     * retakes a clear image.
     */
    if (!needsReview) {
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
    }

    await client.query(
      'COMMIT',
    );

    return {
      ...expense,

      /*
       * Keep plain attendees for existing
       * mobile screens.
       */
      attendees:
        input.attendees.map(
          (attendee) =>
            attendee.name,
        ),

      /*
       * New typed attendee data.
       */
      attendee_details:
        input.attendees.map(
          (attendee) => ({
            name:
              attendee.name,

            attendeeType:
              attendee.attendeeType,
          }),
        ),
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
 * Replace the receipt on an existing expense.
 * ------------------------------------------------
 *
 * Used when an employee retakes a blurry receipt.
 * Category, business purpose, comments and
 * attendees are left exactly as they were; only
 * the image and the review state change.
 * ------------------------------------------------
 */

export async function replaceExpenseReceipt(
  authenticatedUser:
    AuthenticatedUser,

  expenseId:
    string,

  input:
    ReplaceReceiptInput,
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN',
    );

    const userId =
      await resolveUserId(
        client,
        authenticatedUser,
      );

    const ownedResult =
      await client.query(
        `
          SELECT id
          FROM expenses
          WHERE
            id = $1
            AND
            user_id = $2
          FOR UPDATE
        `,
        [
          expenseId,
          userId,
        ],
      );

    if (
      ownedResult.rowCount ===
      0
    ) {
      await client.query(
        'ROLLBACK',
      );

      return null;
    }

    const needsReview =
      Boolean(
        input.receiptNeedsReview,
      );

    const reviewReason =
      needsReview
        ? (
            input.reviewReason?.trim() ||
            'This image is blurry. Please retake a clear photo of this receipt.'
          )
        : null;

    const updateResult =
      await client.query(
        `
          UPDATE expenses
          SET
            receipt_storage_key = $1,
            status = $2,
            external_status = $3,
            external_error = $4,
            category =
              COALESCE($6, category),
            business_purpose =
              COALESCE($7, business_purpose),
            comments =
              CASE
                WHEN $8::boolean
                  THEN $9
                ELSE comments
              END,
            submitted_at = NOW(),
            updated_at = NOW()
          WHERE
            id = $5
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
          input.receiptStorageKey,
          needsReview
            ? 'FAILED'
            : 'SUBMITTED',
          needsReview
            ? 'NEEDS_REVIEW'
            : null,
          reviewReason,
          expenseId,
          input.category ?? null,
          input.businessPurpose ?? null,
          input.comments !== undefined,
          input.comments ?? null,
        ],
      );

    const expense =
      updateResult.rows[0];

    /*
     * Attendees are replaced wholesale when the
     * client sends them, so edits made during the
     * retake are kept in sync.
     */
    if (input.attendees) {
      await client.query(
        `
          DELETE FROM expense_attendees
          WHERE expense_id = $1
        `,
        [
          expenseId,
        ],
      );

      if (
        input.attendees.length >
        0
      ) {
        const values:
          string[] = [];

        const params:
          unknown[] = [];

        input.attendees.forEach(
          (
            attendee,
            index,
          ) => {
            const base =
              index * 3;

            values.push(
              `($${base + 1}, $${base + 2}, $${base + 3})`,
            );

            params.push(
              expenseId,
              attendee.name,
              attendee.attendeeType,
            );
          },
        );

        await client.query(
          `
            INSERT INTO expense_attendees (
              expense_id,
              name,
              attendee_type
            )
            VALUES
            ${values.join(', ')}
          `,
          params,
        );
      }
    }

    /*
     * A clear retake is ready for the external
     * system again, so (re)queue its job.
     */
    if (!needsReview) {
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
          DO UPDATE
          SET
            status = 'PENDING',
            attempts = 0,
            next_attempt_at = NOW(),
            last_error = NULL,
            updated_at = NOW()
        `,
        [
          expenseId,
        ],
      );
    }

    const attendeeResult =
      await client.query(
        `
          SELECT
            name,
            attendee_type
          FROM expense_attendees
          WHERE expense_id = $1
          ORDER BY created_at
        `,
        [
          expenseId,
        ],
      );

    await client.query(
      'COMMIT',
    );

    return {
      ...expense,

      attendees:
        attendeeResult.rows.map(
          (row) =>
            row.name,
        ),

      attendee_details:
        attendeeResult.rows.map(
          (row) => ({
            name:
              row.name,

            attendeeType:
              row.attendee_type,
          }),
        ),
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
 * Return expenses belonging only to authenticated
 * employee.
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
          ) AS attendees,

          COALESCE(
            json_agg(
              json_build_object(
                'name',
                ea.name,

                'attendeeType',
                ea.attendee_type
              )
              ORDER BY ea.created_at
            )
            FILTER (
              WHERE ea.id IS NOT NULL
            ),
            '[]'::json
          ) AS attendee_details

        FROM expenses e

        INNER JOIN users u
          ON u.id = e.user_id

        LEFT JOIN expense_attendees ea
          ON ea.expense_id = e.id

        WHERE
          u.auth_provider = $1
          AND
          u.provider_user_id = $2

        GROUP BY
          e.id

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
          ) AS attendees,

          COALESCE(
            json_agg(
              json_build_object(
                'name',
                ea.name,

                'attendeeType',
                ea.attendee_type
              )
              ORDER BY ea.created_at
            )
            FILTER (
              WHERE ea.id IS NOT NULL
            ),
            '[]'::json
          ) AS attendee_details

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

        GROUP BY
          e.id

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