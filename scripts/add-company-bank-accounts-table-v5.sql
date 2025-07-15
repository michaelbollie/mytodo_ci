-- Create the 'company_bank_accounts' table
CREATE TABLE IF NOT EXISTS company_bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) UNIQUE NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    branch_name VARCHAR(255),
    swift_code VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_company_bank_accounts_account_number ON company_bank_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_company_bank_accounts_bank_name ON company_bank_accounts(bank_name);
