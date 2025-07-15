-- Seed initial data for the 'page_content' table
INSERT INTO page_content (page_name, section_name, content_html, image_url) VALUES
('homepage', 'hero_title', 'Your All-in-One CRM Solution', NULL)
ON CONFLICT (page_name, section_name) DO UPDATE SET content_html = EXCLUDED.content_html;

INSERT INTO page_content (page_name, section_name, content_html, image_url) VALUES
('homepage', 'hero_description', 'Manage quotes, invoices, receipts, and client communications seamlessly. Empower your business with AfricorexCrm.', NULL)
ON CONFLICT (page_name, section_name) DO UPDATE SET content_html = EXCLUDED.content_html;

INSERT INTO page_content (page_name, section_name, content_html, image_url) VALUES
('homepage', 'hero_image', NULL, '/placeholder.svg?height=400&width=600')
ON CONFLICT (page_name, section_name) DO UPDATE SET image_url = EXCLUDED.image_url;

INSERT INTO page_content (page_name, section_name, content_html, image_url) VALUES
('homepage', 'service_quote_invoice_title', 'Quote & Invoice Management', NULL)
ON CONFLICT (page_name, section_name) DO UPDATE SET content_html = EXCLUDED.content_html;

INSERT INTO page_content (page_name, section_name, content_html, image_url) VALUES
('homepage', 'service_quote_invoice_description', 'Create, send, and track professional quotes and invoices with ease.', NULL)
ON CONFLICT (page_name, section_name) DO UPDATE SET content_html = EXCLUDED.content_html;

INSERT INTO page_content (page_name, section_name, content_html, image_url) VALUES
('homepage', 'service_client_comm_title', 'Client Communication', NULL)
ON CONFLICT (page_name, section_name) DO UPDATE SET content_html = EXCLUDED.content_html;

INSERT INTO page_content (page_name, section_name, content_html, image_url) VALUES
('homepage', 'service_client_comm_description', 'Keep all client interactions organized and accessible in one place.', NULL)
ON CONFLICT (page_name, section_name) DO UPDATE SET content_html = EXCLUDED.content_html;

INSERT INTO page_content (page_name, section_name, content_html, image_url) VALUES
('homepage', 'service_website_editor_title', 'Website Content Editor', NULL)
ON CONFLICT (page_name, section_name) DO UPDATE SET content_html = EXCLUDED.content_html;

INSERT INTO page_content (page_name, section_name, content_html, image_url) VALUES
('homepage', 'service_website_editor_description', 'Update your homepage content directly from your admin dashboard.', NULL)
ON CONFLICT (page_name, section_name) DO UPDATE SET content_html = EXCLUDED.content_html;
