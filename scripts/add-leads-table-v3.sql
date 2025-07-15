-- Create the 'leads' table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE, -- Email can be optional but unique if provided
    phone VARCHAR(50),
    company VARCHAR(255),
    source VARCHAR(100), -- e.g., 'website', 'referral', 'cold_call', 'event'
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- e.g., 'new', 'contacted', 'qualified', 'unqualified', 'converted'
    notes TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin/Sales person assigned to this lead
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
