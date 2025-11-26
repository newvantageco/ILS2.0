-- Migration: Add enhanced eye examination workflow fields
-- Date: 2025-11-26
-- Description: Adds pre-screening, retinoscopy, section notes, and grading system fields

-- Add new JSONB fields for enhanced examination workflow
ALTER TABLE eye_examinations
ADD COLUMN IF NOT EXISTS pre_screening JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS retinoscopy JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS section_notes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS grading_system VARCHAR(20) DEFAULT NULL;

-- Add comments to document the purpose of each field
COMMENT ON COLUMN eye_examinations.pre_screening IS 'Pre-screening tests: AVMS, Focimetry, Phorias/Phorology measurements';
COMMENT ON COLUMN eye_examinations.retinoscopy IS 'Retinoscopy findings: working distance, neutralization, sphere/cylinder/axis for each eye';
COMMENT ON COLUMN eye_examinations.section_notes IS 'Section-specific notes with 500 character limit per section';
COMMENT ON COLUMN eye_examinations.grading_system IS 'Selected grading system for slit lamp examination: EFRON, CLRU, or other';

-- Create index for grading_system to optimize queries
CREATE INDEX IF NOT EXISTS idx_eye_examinations_grading_system ON eye_examinations(grading_system);
