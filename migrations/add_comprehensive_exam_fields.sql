-- Migration: Add Comprehensive Eye Examination Fields
-- Date: 2025-10-31
-- Purpose: Add JSONB columns for comprehensive 10-tab eye examination data

-- Add new JSONB columns for comprehensive examination data
ALTER TABLE eye_examinations 
ADD COLUMN IF NOT EXISTS general_history JSONB,
ADD COLUMN IF NOT EXISTS current_rx JSONB,
ADD COLUMN IF NOT EXISTS new_rx JSONB,
ADD COLUMN IF NOT EXISTS ophthalmoscopy JSONB,
ADD COLUMN IF NOT EXISTS slit_lamp JSONB,
ADD COLUMN IF NOT EXISTS additional_tests JSONB,
ADD COLUMN IF NOT EXISTS tonometry JSONB,
ADD COLUMN IF NOT EXISTS eye_sketch JSONB,
ADD COLUMN IF NOT EXISTS images JSONB,
ADD COLUMN IF NOT EXISTS summary JSONB,
ADD COLUMN IF NOT EXISTS finalized BOOLEAN DEFAULT FALSE;

-- Add indexes for JSONB columns for better query performance
CREATE INDEX IF NOT EXISTS idx_eye_examinations_general_history ON eye_examinations USING gin(general_history);
CREATE INDEX IF NOT EXISTS idx_eye_examinations_new_rx ON eye_examinations USING gin(new_rx);
CREATE INDEX IF NOT EXISTS idx_eye_examinations_summary ON eye_examinations USING gin(summary);

-- Add index for finalized status
CREATE INDEX IF NOT EXISTS idx_eye_examinations_finalized ON eye_examinations(finalized) WHERE finalized = TRUE;

-- Add index for patient_id and examination_date for faster queries
CREATE INDEX IF NOT EXISTS idx_eye_examinations_patient_date ON eye_examinations(patient_id, examination_date DESC);

-- Comment on new columns
COMMENT ON COLUMN eye_examinations.general_history IS 'Tab 1: General history including schedule, symptoms, medications, family history, lifestyle';
COMMENT ON COLUMN eye_examinations.current_rx IS 'Tab 2: Current prescription for spectacles and contact lenses';
COMMENT ON COLUMN eye_examinations.new_rx IS 'Tab 3: New prescription including objective and subjective refraction, final Rx for distance/near/intermediate';
COMMENT ON COLUMN eye_examinations.ophthalmoscopy IS 'Tab 4: Fundus examination findings for both eyes';
COMMENT ON COLUMN eye_examinations.slit_lamp IS 'Tab 5: Slit lamp examination including external examination and pupil reactions';
COMMENT ON COLUMN eye_examinations.additional_tests IS 'Tab 6: Additional clinical tests including visual fields, color vision, binocular vision';
COMMENT ON COLUMN eye_examinations.tonometry IS 'Tab 7: Intraocular pressure measurements and tonometry readings';
COMMENT ON COLUMN eye_examinations.eye_sketch IS 'Tab 8: Eye sketch drawings for anterior segment and fundus';
COMMENT ON COLUMN eye_examinations.images IS 'Tab 9: Image viewer for imported diagnostic images';
COMMENT ON COLUMN eye_examinations.summary IS 'Tab 10: Examination summary including Rx status, referrals, dispensing, recall management';
COMMENT ON COLUMN eye_examinations.finalized IS 'Indicates if the examination has been finalized and locked for editing';

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'eye_examinations' 
AND column_name IN ('general_history', 'current_rx', 'new_rx', 'ophthalmoscopy', 'slit_lamp', 'additional_tests', 'tonometry', 'eye_sketch', 'images', 'summary', 'finalized')
ORDER BY ordinal_position;
