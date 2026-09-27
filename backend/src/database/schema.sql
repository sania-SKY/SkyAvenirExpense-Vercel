BEGIN;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    auth_provider VARCHAR(20) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,

    email VARCHAR(320) NOT NULL,
    name VARCHAR(255) NOT NULL,

    password_hash TEXT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_auth_provider_check
        CHECK (
            auth_provider IN (
                'microsoft',
                'google',
                'email'
            )
        ),

    CONSTRAINT users_provider_identity_unique
        UNIQUE (
            auth_provider,
            provider_user_id
        )
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
    idx_users_email_auth_email_unique
ON users (
    LOWER(email)
)
WHERE auth_provider = 'email';


-- ============================================================
-- EXPENSES
-- ============================================================

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    category VARCHAR(255) NOT NULL,
    business_purpose VARCHAR(255) NOT NULL,

    comments TEXT NULL,

    receipt_storage_key TEXT NOT NULL,

    status VARCHAR(30)
        NOT NULL
        DEFAULT 'SUBMITTED',

    submitted_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    external_reference VARCHAR(255) NULL,
    external_status VARCHAR(100) NULL,
    external_error TEXT NULL,
    last_sync_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT expenses_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT,

    CONSTRAINT expenses_status_check
        CHECK (
            status IN (
                'SUBMITTED',
                'PROCESSING',
                'COMPLETED',
                'REJECTED',
                'FAILED'
            )
        ),

    CONSTRAINT expenses_category_not_blank
        CHECK (
            LENGTH(TRIM(category)) > 0
        ),

    CONSTRAINT expenses_business_purpose_not_blank
        CHECK (
            LENGTH(
                TRIM(business_purpose)
            ) > 0
        ),

    CONSTRAINT expenses_comments_length_check
        CHECK (
            comments IS NULL
            OR LENGTH(comments) <= 2000
        )
);


-- ============================================================
-- ATTENDEES
-- ============================================================

CREATE TABLE IF NOT EXISTS expense_attendees (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    expense_id UUID NOT NULL,

    name VARCHAR(255) NOT NULL,

    attendee_type VARCHAR(30) NULL,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT expense_attendees_expense_fk
        FOREIGN KEY (expense_id)
        REFERENCES expenses(id)
        ON DELETE CASCADE,

    CONSTRAINT expense_attendees_name_not_blank
        CHECK (
            LENGTH(TRIM(name)) > 0
        ),

    CONSTRAINT expense_attendees_type_check
        CHECK (
            attendee_type IS NULL
            OR attendee_type IN (
                'WAVETRONIX_EMPLOYEE',
                'NON_WAVETRONIX'
            )
        )
);

ALTER TABLE expense_attendees
ADD COLUMN IF NOT EXISTS attendee_type VARCHAR(30) NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'expense_attendees_type_check'
    ) THEN
        ALTER TABLE expense_attendees
        ADD CONSTRAINT expense_attendees_type_check
        CHECK (
            attendee_type IS NULL
            OR attendee_type IN (
                'WAVETRONIX_EMPLOYEE',
                'NON_WAVETRONIX'
            )
        );
    END IF;
END
$$;


-- ============================================================
-- PASSWORD RESET CODES
-- ============================================================

CREATE TABLE IF NOT EXISTS password_reset_codes (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    code_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ NULL,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT password_reset_codes_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================================
-- EXTERNAL INTEGRATION EVENT HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS expense_integration_events (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    expense_id UUID NOT NULL,

    event_type VARCHAR(100) NOT NULL,

    external_status VARCHAR(100) NULL,

    external_reference VARCHAR(255) NULL,

    message TEXT NULL,

    received_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT expense_integration_events_expense_fk
        FOREIGN KEY (expense_id)
        REFERENCES expenses(id)
        ON DELETE CASCADE
);


-- ============================================================
-- INTEGRATION JOBS
-- ============================================================

CREATE TABLE IF NOT EXISTS integration_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    expense_id UUID NOT NULL,

    status VARCHAR(20)
        NOT NULL
        DEFAULT 'PENDING',

    attempts INTEGER
        NOT NULL
        DEFAULT 0,

    max_attempts INTEGER
        NOT NULL
        DEFAULT 5,

    next_attempt_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    last_error TEXT NULL,

    created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW(),

    CONSTRAINT integration_jobs_expense_fk
        FOREIGN KEY (expense_id)
        REFERENCES expenses(id)
        ON DELETE CASCADE,

    CONSTRAINT integration_jobs_status_check
        CHECK (
            status IN (
                'PENDING',
                'PROCESSING',
                'COMPLETED',
                'RETRY',
                'FAILED'
            )
        ),

    CONSTRAINT integration_jobs_expense_unique
        UNIQUE (expense_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS
    idx_expenses_user_submitted
ON expenses (
    user_id,
    submitted_at DESC
);

CREATE INDEX IF NOT EXISTS
    idx_expenses_status
ON expenses (
    status
);

CREATE INDEX IF NOT EXISTS
    idx_expenses_external_reference
ON expenses (
    external_reference
)
WHERE external_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS
    idx_expense_attendees_expense
ON expense_attendees (
    expense_id
);

CREATE INDEX IF NOT EXISTS
    idx_password_reset_codes_user
ON password_reset_codes (
    user_id,
    created_at DESC
);

CREATE INDEX IF NOT EXISTS
    idx_password_reset_codes_expiry
ON password_reset_codes (
    expires_at
);

CREATE INDEX IF NOT EXISTS
    idx_integration_events_expense
ON expense_integration_events (
    expense_id,
    received_at DESC
);

CREATE INDEX IF NOT EXISTS
    idx_integration_jobs_ready
ON integration_jobs (
    status,
    next_attempt_at
);

COMMIT;