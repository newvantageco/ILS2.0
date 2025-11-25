-- Migration: Add 'whatsapp' to communication_channel enum
-- This enables WhatsApp Business API integration for order collection notifications

-- Add 'whatsapp' value to the communication_channel enum
ALTER TYPE communication_channel ADD VALUE IF NOT EXISTS 'whatsapp';

-- Note: PostgreSQL requires the enum value to be added before it can be used
-- in table inserts. This migration should be run before attempting to create
-- WhatsApp message templates or send WhatsApp messages.
