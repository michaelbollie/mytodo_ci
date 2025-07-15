CREATE TABLE IF NOT EXISTS flutterwave_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id TEXT UNIQUE, -- Flutterwave's transaction ID (e.g., tx_ref)
    flw_transaction_id TEXT, -- Flutterwave's internal ID (e.g., flw_ref)
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'KES',
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- e.g., pending, successful, failed, cancelled
    payment_gateway VARCHAR(50) NOT NULL DEFAULT 'Flutterwave',
    metadata JSONB, -- Store full Flutterwave response or webhook payload
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by transaction_id and invoice_id
CREATE INDEX IF NOT EXISTS idx_flutterwave_transaction_id ON flutterwave_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_flutterwave_invoice_id ON flutterwave_transactions(invoice_id);

-- Add a function to update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the flutterwave_transactions table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_flutterwave_transactions_updated_at') THEN
        CREATE TRIGGER update_flutterwave_transactions_updated_at
        BEFORE UPDATE ON flutterwave_transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
