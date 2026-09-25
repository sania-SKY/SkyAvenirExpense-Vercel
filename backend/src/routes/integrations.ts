import {
    Router,
} from 'express';

import { env } from '../config/env.js';
import { pool } from '../database/pool.js';

const router =
  Router();

router.post(
  '/company/expense-status',

  async (req, res) => {
    try {
      const secret =
        req.headers[
          'x-webhook-secret'
        ];

      if (
        !env.companyApi.webhookSecret ||
        secret !==
          env.companyApi.webhookSecret
      ) {
        res.status(401).json({
          message:
            'Invalid webhook authentication.',
        });

        return;
      }

      const {
        externalReference,
        status,
        message,
      } = req.body ?? {};

      if (
        typeof externalReference !==
          'string' ||
        !externalReference
      ) {
        res.status(400).json({
          message:
            'External reference is required.',
        });

        return;
      }

      const allowedStatuses =
        [
          'PROCESSING',
          'COMPLETED',
          'REJECTED',
          'FAILED',
        ];

      if (
        !allowedStatuses.includes(
          status,
        )
      ) {
        res.status(400).json({
          message:
            'Invalid status.',
        });

        return;
      }

      const result =
        await pool.query(
          `
            UPDATE expenses

            SET
              status = $1,
              external_status = $1,
              external_error =
                CASE
                  WHEN $1 IN (
                    'REJECTED',
                    'FAILED'
                  )
                  THEN $2
                  ELSE NULL
                END,
              last_sync_at = NOW(),
              updated_at = NOW()

            WHERE
              external_reference = $3

            RETURNING id
          `,
          [
            status,
            message ?? null,
            externalReference,
          ],
        );

      if (!result.rowCount) {
        res.status(404).json({
          message:
            'Expense not found.',
        });

        return;
      }

      const expenseId =
        result.rows[0].id;

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
            'STATUS_UPDATE',
            $2,
            $3,
            $4
          )
        `,
        [
          expenseId,
          status,
          externalReference,
          message ?? null,
        ],
      );

      res.json({
        status: 'ok',
      });
    } catch (error) {
      console.error(
        'Webhook error:',
        error,
      );

      res.status(500).json({
        message:
          'Unable to process status update.',
      });
    }
  },
);

export default router;