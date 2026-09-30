import {
  Router,
} from 'express';

import {
  env,
} from '../config/env.js';

import {
  randomUUID,
} from 'node:crypto';

import fs from 'node:fs';

import path from 'node:path';

import multer from 'multer';

import {
  requireAuth,
} from '../middleware/auth.js';

import {
  createExpense,
  getExpenseById,
  getMyExpenses,
} from '../services/expenseService.js';

import {
  createExpenseSchema,
} from '../validation/expense.js';

const router =
  Router();

const receiptUploadDirectory =
  env.receiptStorageDirectory
    ? path.resolve(
        env.receiptStorageDirectory,
      )
    : path.resolve(
        process.cwd(),
        'uploads',
        'receipts',
      );

fs.mkdirSync(
  receiptUploadDirectory,
  {
    recursive:
      true,
  },
);

const allowedReceiptTypes =
  new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
  ]);

function extensionForMimeType(
  mimeType:
    string,
) {
  switch (
    mimeType
  ) {
    case 'image/png':
      return '.png';

    case 'image/webp':
      return '.webp';

    case 'image/heic':
      return '.heic';

    case 'image/heif':
      return '.heif';

    case 'application/pdf':
      return '.pdf';

    case 'image/jpeg':
    default:
      return '.jpg';
  }
}

const storage =
  multer.diskStorage({
    destination:
      (
        _req,
        _file,
        callback,
      ) => {
        callback(
          null,
          receiptUploadDirectory,
        );
      },

    filename:
      (
        _req,
        file,
        callback,
      ) => {
        const extension =
          extensionForMimeType(
            file.mimetype,
          );

        callback(
          null,
          `${randomUUID()}${extension}`,
        );
      },
  });

const receiptUpload =
  multer({
    storage,

    limits: {
      fileSize:
        10 *
        1024 *
        1024,
    },

    fileFilter:
      (
        _req,
        file,
        callback,
      ) => {
        if (
          !allowedReceiptTypes.has(
            file.mimetype,
          )
        ) {
          callback(
            new Error(
              'Unsupported receipt file type.',
            ),
          );

          return;
        }

        callback(
          null,
          true,
        );
      },
  });

/*
 * ------------------------------------------------
 * POST /api/expenses/upload
 * ------------------------------------------------
 */

router.post(
  '/upload',
  requireAuth,

  (
    req,
    res,
  ) => {
    receiptUpload.single(
      'receipt',
    )(
      req,
      res,

      (error) => {
        if (error) {
          console.error(
            'Receipt upload error:',
            error,
          );

          res
            .status(400)
            .json({
              message:
                error instanceof Error
                  ? error.message
                  : 'Unable to upload receipt.',
            });

          return;
        }

        if (
          !req.file
        ) {
          res
            .status(400)
            .json({
              message:
                'Receipt file is required.',
            });

          return;
        }

        res
          .status(201)
          .json({
            storageKey:
              req.file.filename,

            originalName:
              req.file.originalname,

            mimeType:
              req.file.mimetype,

            size:
              req.file.size,
          });
      },
    );
  },
);

/*
 * ------------------------------------------------
 * POST /api/expenses
 * ------------------------------------------------
 */

router.post(
  '/',
  requireAuth,

  async (
    req,
    res,
  ) => {
    try {
      if (
        !req.user
      ) {
        res
          .status(401)
          .json({
            message:
              'Authentication required.',
          });

        return;
      }

      const parsed =
        createExpenseSchema.safeParse(
          req.body,
        );

      if (
        !parsed.success
      ) {
        res
          .status(400)
          .json({
            message:
              'Invalid expense submission.',

            errors:
              parsed.error.flatten(),
          });

        return;
      }

      const attendees =
        parsed.data.attendees
          .map(
            (
              attendee,
            ) => ({
              name:
                attendee.name.trim(),

              attendeeType:
                attendee.attendeeType,
            }),
          )
          .filter(
            (
              attendee,
            ) =>
              attendee.name.length >
              0,
          );

      const expense =
        await createExpense(
          req.user,
          {
            category:
              parsed.data.category,

            businessPurpose:
              parsed.data
                .businessPurpose,

            comments:
              parsed.data.comments ||
              null,

            receiptStorageKey:
              parsed.data
                .receiptStorageKey,

            attendees,
          },
        );

      res
        .status(201)
        .json({
          expense,
        });
    } catch (error) {
      console.error(
        'Create expense error:',
        error,
      );

      res
        .status(500)
        .json({
          message:
            'Unable to create expense.',
        });
    }
  },
);

/*
 * ------------------------------------------------
 * GET /api/expenses/my
 * ------------------------------------------------
 */

router.get(
  '/my',
  requireAuth,

  async (
    req,
    res,
  ) => {
    try {
      if (
        !req.user
      ) {
        res
          .status(401)
          .json({
            message:
              'Authentication required.',
          });

        return;
      }

      const expenses =
        await getMyExpenses(
          req.user,
        );

      res.json({
        expenses,
      });
    } catch (error) {
      console.error(
        'Get expenses error:',
        error,
      );

      res
        .status(500)
        .json({
          message:
            'Unable to retrieve expenses.',
        });
    }
  },
);

/*
 * ------------------------------------------------
 * GET /api/expenses/:id/receipt
 * ------------------------------------------------
 */

router.get(
  '/:id/receipt',
  requireAuth,

  async (
    req,
    res,
  ) => {
    try {
      if (
        !req.user
      ) {
        res
          .status(401)
          .json({
            message:
              'Authentication required.',
          });

        return;
      }

      const expenseId =
        Array.isArray(
          req.params.id,
        )
          ? req.params.id[0]
          : req.params.id;

      if (
        !expenseId
      ) {
        res
          .status(400)
          .json({
            message:
              'Invalid expense ID.',
          });

        return;
      }

      const expense =
        await getExpenseById(
          req.user,
          expenseId,
        );

      if (
        !expense
      ) {
        res
          .status(404)
          .json({
            message:
              'Expense not found.',
          });

        return;
      }

      const storageKey =
        expense.receipt_storage_key;

      if (
        !storageKey
      ) {
        res
          .status(404)
          .json({
            message:
              'Receipt is not available.',
          });

        return;
      }

      if (
        storageKey.startsWith(
          'file:',
        ) ||
        storageKey.includes(
          '://',
        )
      ) {
        res
          .status(404)
          .json({
            message:
              'This expense was created before server receipt storage was enabled.',
          });

        return;
      }

      const safeFilename =
        path.basename(
          storageKey,
        );

      const absolutePath =
        path.join(
          receiptUploadDirectory,
          safeFilename,
        );

      if (
        !fs.existsSync(
          absolutePath,
        )
      ) {
        res
          .status(404)
          .json({
            message:
              'Receipt file was not found.',
          });

        return;
      }

      res.sendFile(
        absolutePath,
      );
    } catch (error) {
      console.error(
        'Get receipt error:',
        error,
      );

      res
        .status(500)
        .json({
          message:
            'Unable to retrieve receipt.',
        });
    }
  },
);

/*
 * ------------------------------------------------
 * GET /api/expenses/:id
 * ------------------------------------------------
 */

router.get(
  '/:id',
  requireAuth,

  async (
    req,
    res,
  ) => {
    try {
      if (
        !req.user
      ) {
        res
          .status(401)
          .json({
            message:
              'Authentication required.',
          });

        return;
      }

      const expenseId =
        Array.isArray(
          req.params.id,
        )
          ? req.params.id[0]
          : req.params.id;

      if (
        !expenseId
      ) {
        res
          .status(400)
          .json({
            message:
              'Invalid expense ID.',
          });

        return;
      }

      const expense =
        await getExpenseById(
          req.user,
          expenseId,
        );

      if (
        !expense
      ) {
        res
          .status(404)
          .json({
            message:
              'Expense not found.',
          });

        return;
      }

      res.json({
        expense,
      });
    } catch (error) {
      console.error(
        'Get expense error:',
        error,
      );

      res
        .status(500)
        .json({
          message:
            'Unable to retrieve expense.',
        });
    }
  },
);

export default router;