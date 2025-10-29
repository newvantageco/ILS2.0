-- Migration: Enhanced Test Room Management & Remote Access
-- Date: 2025-10-29
-- Description: Adds scheduling, equipment tracking, and remote access features

-- =====================================================
-- 1. Enhance test_rooms table with new columns
-- =====================================================

ALTER TABLE test_rooms 
ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS floor_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS accessibility BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS current_status VARCHAR(50) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS last_maintenance_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS next_maintenance_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS equipment_details JSONB,
ADD COLUMN IF NOT EXISTS allow_remote_access BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_id VARCHAR;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_rooms_status ON test_rooms(current_status);
CREATE INDEX IF NOT EXISTS idx_test_rooms_location ON test_rooms(location_id);

-- Add check constraint for status
ALTER TABLE test_rooms 
ADD CONSTRAINT check_test_room_status 
CHECK (current_status IN ('available', 'occupied', 'maintenance', 'offline'));

-- =====================================================
-- 2. Create test_room_bookings table
-- =====================================================

CREATE TABLE IF NOT EXISTS test_room_bookings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    test_room_id VARCHAR NOT NULL REFERENCES test_rooms(id) ON DELETE CASCADE,
    patient_id VARCHAR REFERENCES patients(id) ON DELETE SET NULL,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    
    booking_date TIMESTAMP NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    
    appointment_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled',
    
    notes TEXT,
    
    -- Remote access support
    is_remote_session BOOLEAN DEFAULT false,
    remote_access_url TEXT,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_test_room ON test_room_bookings(test_room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON test_room_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON test_room_bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON test_room_bookings(user_id);

-- Add check constraint for booking status
ALTER TABLE test_room_bookings 
ADD CONSTRAINT check_booking_status 
CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled'));

-- Add check constraint for valid time range
ALTER TABLE test_room_bookings 
ADD CONSTRAINT check_booking_times 
CHECK (end_time > start_time);

-- =====================================================
-- 3. Create equipment table
-- =====================================================

CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    test_room_id VARCHAR REFERENCES test_rooms(id) ON DELETE SET NULL,
    
    name VARCHAR(200) NOT NULL,
    manufacturer VARCHAR(150),
    model VARCHAR(150),
    serial_number VARCHAR(100) NOT NULL,
    
    purchase_date TIMESTAMP,
    last_calibration_date TIMESTAMP,
    next_calibration_date TIMESTAMP,
    calibration_frequency_days INTEGER DEFAULT 365,
    
    status VARCHAR(50) DEFAULT 'operational',
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_equipment_company ON equipment(company_id);
CREATE INDEX IF NOT EXISTS idx_equipment_test_room ON equipment(test_room_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_next_calibration ON equipment(next_calibration_date);

-- Add check constraint for equipment status
ALTER TABLE equipment 
ADD CONSTRAINT check_equipment_status 
CHECK (status IN ('operational', 'maintenance', 'calibration-due', 'out-of-service'));

-- =====================================================
-- 4. Create calibration_records table
-- =====================================================

CREATE TABLE IF NOT EXISTS calibration_records (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id VARCHAR NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    
    calibration_date TIMESTAMP NOT NULL,
    performed_by VARCHAR(200) NOT NULL,
    certificate_number VARCHAR(100),
    next_due_date TIMESTAMP NOT NULL,
    
    results TEXT,
    passed BOOLEAN NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calibration_equipment ON calibration_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_calibration_date ON calibration_records(calibration_date);

-- =====================================================
-- 5. Create remote_sessions table
-- =====================================================

CREATE TABLE IF NOT EXISTS remote_sessions (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id VARCHAR NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    patient_id VARCHAR NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    examination_id VARCHAR REFERENCES examinations(id) ON DELETE CASCADE,
    prescription_id VARCHAR REFERENCES prescriptions(id) ON DELETE CASCADE,
    
    access_token VARCHAR(255) UNIQUE NOT NULL,
    access_url TEXT NOT NULL,
    
    created_by VARCHAR NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    
    status VARCHAR(50) DEFAULT 'active',
    
    viewed_by VARCHAR,
    viewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_remote_sessions_company ON remote_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_remote_sessions_patient ON remote_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_remote_sessions_token ON remote_sessions(access_token);
CREATE INDEX IF NOT EXISTS idx_remote_sessions_status ON remote_sessions(status);
CREATE INDEX IF NOT EXISTS idx_remote_sessions_expires ON remote_sessions(expires_at);

-- Add check constraint for session status
ALTER TABLE remote_sessions 
ADD CONSTRAINT check_remote_session_status 
CHECK (status IN ('active', 'expired', 'revoked'));

-- =====================================================
-- 6. Update existing tables
-- =====================================================

-- Add test_room_id to examinations if not exists
ALTER TABLE examinations 
ADD COLUMN IF NOT EXISTS test_room_id VARCHAR REFERENCES test_rooms(id);

-- Add approval workflow to prescriptions
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by VARCHAR REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- =====================================================
-- 7. Create functions for automatic updates
-- =====================================================

-- Function to update test room status based on bookings
CREATE OR REPLACE FUNCTION update_test_room_status()
RETURNS TRIGGER AS $$
BEGIN
    -- If booking is active (in-progress), mark room as occupied
    IF NEW.status = 'in-progress' THEN
        UPDATE test_rooms 
        SET current_status = 'occupied' 
        WHERE id = NEW.test_room_id;
    END IF;
    
    -- If booking is completed or cancelled, check if room should be available
    IF NEW.status IN ('completed', 'cancelled') THEN
        -- Check if there are any other active bookings for this room
        IF NOT EXISTS (
            SELECT 1 FROM test_room_bookings 
            WHERE test_room_id = NEW.test_room_id 
            AND status = 'in-progress' 
            AND id != NEW.id
        ) THEN
            UPDATE test_rooms 
            SET current_status = 'available' 
            WHERE id = NEW.test_room_id 
            AND current_status = 'occupied';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_test_room_status ON test_room_bookings;
CREATE TRIGGER trigger_update_test_room_status
    AFTER INSERT OR UPDATE ON test_room_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_test_room_status();

-- Function to update equipment calibration status
CREATE OR REPLACE FUNCTION update_equipment_calibration_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the equipment's last and next calibration dates
    UPDATE equipment
    SET 
        last_calibration_date = NEW.calibration_date,
        next_calibration_date = NEW.next_due_date,
        status = CASE 
            WHEN NEW.passed THEN 'operational'
            ELSE 'calibration-due'
        END
    WHERE id = NEW.equipment_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_equipment_calibration ON calibration_records;
CREATE TRIGGER trigger_update_equipment_calibration
    AFTER INSERT ON calibration_records
    FOR EACH ROW
    EXECUTE FUNCTION update_equipment_calibration_status();

-- Function to auto-expire remote sessions
CREATE OR REPLACE FUNCTION expire_remote_sessions()
RETURNS void AS $$
BEGIN
    UPDATE remote_sessions
    SET status = 'expired'
    WHERE status = 'active'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. Insert sample data (for testing)
-- =====================================================

-- Sample test rooms (adjust company_id as needed)
-- INSERT INTO test_rooms (company_id, room_name, room_code, capacity, floor_level, accessibility, current_status, location_id)
-- VALUES 
--     ((SELECT id FROM companies LIMIT 1), 'Test Room 1', 'TR1', 1, 'Ground Floor', true, 'available', 'main'),
--     ((SELECT id FROM companies LIMIT 1), 'Test Room 2', 'TR2', 1, 'Ground Floor', true, 'available', 'main'),
--     ((SELECT id FROM companies LIMIT 1), 'Test Room 3', 'TR3', 1, 'First Floor', true, 'available', 'main'),
--     ((SELECT id FROM companies LIMIT 1), 'Contact Lens Room', 'CLR1', 1, 'Ground Floor', true, 'available', 'main');

-- =====================================================
-- 9. Create views for analytics
-- =====================================================

-- View for room utilization
CREATE OR REPLACE VIEW v_room_utilization AS
SELECT 
    tr.id AS room_id,
    tr.room_name,
    tr.location_id,
    COUNT(trb.id) FILTER (WHERE trb.booking_date >= CURRENT_DATE - INTERVAL '30 days') AS bookings_last_30_days,
    COUNT(trb.id) FILTER (WHERE DATE(trb.booking_date) = CURRENT_DATE) AS bookings_today,
    tr.current_status,
    tr.allow_remote_access
FROM test_rooms tr
LEFT JOIN test_room_bookings trb ON tr.id = trb.test_room_id
GROUP BY tr.id, tr.room_name, tr.location_id, tr.current_status, tr.allow_remote_access;

-- View for equipment due for calibration
CREATE OR REPLACE VIEW v_equipment_calibration_due AS
SELECT 
    e.id,
    e.name,
    e.serial_number,
    e.test_room_id,
    tr.room_name,
    e.last_calibration_date,
    e.next_calibration_date,
    CASE 
        WHEN e.next_calibration_date < CURRENT_DATE THEN 'overdue'
        WHEN e.next_calibration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due-soon'
        WHEN e.next_calibration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'upcoming'
        ELSE 'ok'
    END AS urgency,
    e.status
FROM equipment e
LEFT JOIN test_rooms tr ON e.test_room_id = tr.id
WHERE e.next_calibration_date IS NOT NULL
ORDER BY e.next_calibration_date ASC;

-- =====================================================
-- 10. Grant permissions (adjust as needed)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON test_room_bookings TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON equipment TO your_app_user;
-- GRANT SELECT, INSERT ON calibration_records TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE ON remote_sessions TO your_app_user;

-- =====================================================
-- Migration complete!
-- =====================================================

-- Verify tables created
SELECT 
    'test_rooms' as table_name, 
    COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'test_rooms'
UNION ALL
SELECT 'test_room_bookings', COUNT(*) FROM information_schema.columns WHERE table_name = 'test_room_bookings'
UNION ALL
SELECT 'equipment', COUNT(*) FROM information_schema.columns WHERE table_name = 'equipment'
UNION ALL
SELECT 'calibration_records', COUNT(*) FROM information_schema.columns WHERE table_name = 'calibration_records'
UNION ALL
SELECT 'remote_sessions', COUNT(*) FROM information_schema.columns WHERE table_name = 'remote_sessions';
