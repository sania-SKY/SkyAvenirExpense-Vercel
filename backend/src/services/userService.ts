import type {
    PoolClient,
} from 'pg';

import type {
    AuthenticatedUser,
} from '../middleware/auth.js';

/*
 * ------------------------------------------------
 * Resolve provider identity to the internal
 * PostgreSQL users.id UUID.
 * ------------------------------------------------
 */

export async function resolveUserId(
  client: PoolClient,
  user: AuthenticatedUser,
): Promise<string> {
  const existing =
    await client.query<{
      id: string;
    }>(
      `
        SELECT id
        FROM users
        WHERE auth_provider = $1
          AND provider_user_id = $2
        LIMIT 1
      `,
      [
        user.provider,
        user.providerUserId,
      ],
    );

  if (existing.rowCount) {
    const userId =
      existing.rows[0].id;

    await client.query(
      `
        UPDATE users
        SET
          name = $1,
          email = $2,
          updated_at = NOW()
        WHERE id = $3
      `,
      [
        user.name,
        user.email,
        userId,
      ],
    );

    return userId;
  }

  const created =
    await client.query<{
      id: string;
    }>(
      `
        INSERT INTO users (
          auth_provider,
          provider_user_id,
          email,
          name
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        RETURNING id
      `,
      [
        user.provider,
        user.providerUserId,
        user.email,
        user.name,
      ],
    );

  return created.rows[0].id;
}