BEGIN;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
    idx_users_email_auth_email_unique
ON users (
    LOWER(email)
)
WHERE auth_provider = 'email';

COMMIT;