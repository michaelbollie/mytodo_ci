-- Create the 'zip_backups' table for site backups and versioning
CREATE TABLE IF NOT EXISTS zip_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path TEXT NOT NULL, -- Placeholder for actual storage URL/path (e.g., Vercel Blob URL)
    version VARCHAR(100) NOT NULL, -- A version string, e.g., 'v1.0.0' or '20240715-1430'
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who initiated the backup
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_zip_backups_version ON zip_backups(version);
CREATE INDEX IF NOT EXISTS idx_zip_backups_uploaded_by ON zip_backups(uploaded_by);
