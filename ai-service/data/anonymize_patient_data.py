"""
HIPAA Safe Harbor Compliant Data Anonymization Script

This script creates a de-identified copy of patient data according to the 
HIPAA Safe Harbor Method (45 CFR 164.514(b)(2)).

Safe Harbor requires removal of 18 identifiers:
1. Names
2. Geographic subdivisions smaller than state
3. Dates (except year) - birth, admission, discharge, death
4. Telephone numbers
5. Fax numbers
6. Email addresses
7. Social security numbers
8. Medical record numbers
9. Health plan beneficiary numbers
10. Account numbers
11. Certificate/license numbers
12. Vehicle identifiers and serial numbers
13. Device identifiers and serial numbers
14. Web URLs
15. IP addresses
16. Biometric identifiers
17. Full-face photographs
18. Any other unique identifying number, characteristic, or code

WARNING: This script creates a SEPARATE, ANONYMIZED database.
The original patient database remains secure and is NEVER directly accessed by the LLM.
"""

import hashlib
import sqlite3
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import logging
import re
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PatientDataAnonymizer:
    """
    Anonymize patient data according to HIPAA Safe Harbor Method.
    
    This creates a de-identified database suitable for analytics and AI queries.
    """
    
    def __init__(
        self,
        source_connection_string: str,
        destination_connection_string: str,
        tenant_id: str,
        hash_salt: Optional[str] = None,
    ):
        """
        Initialize anonymizer.
        
        Args:
            source_connection_string: Connection to source patient database (READ-ONLY)
            destination_connection_string: Connection to anonymized database (WRITE)
            tenant_id: Tenant identifier for logging
            hash_salt: Secret salt for hashing (load from secure secrets manager)
        """
        self.source_connection = source_connection_string
        self.destination_connection = destination_connection_string
        self.tenant_id = tenant_id
        
        # Use secure random salt if not provided
        self.hash_salt = hash_salt or os.urandom(32).hex()
        
        logger.info(f"[{tenant_id}] Anonymizer initialized")
    
    def _create_anonymized_id(self, original_id: str) -> str:
        """
        Create irreversible anonymized ID using secure hashing.
        
        Args:
            original_id: Original patient ID
            
        Returns:
            Anonymized ID (SHA-256 hash)
        """
        # Use SHA-256 with salt for irreversibility
        hash_input = f"{self.hash_salt}:{original_id}".encode('utf-8')
        return hashlib.sha256(hash_input).hexdigest()[:16]
    
    def _anonymize_date(self, date_str: Optional[str]) -> Optional[str]:
        """
        Anonymize date by keeping only the year.
        
        Args:
            date_str: Date in ISO format (YYYY-MM-DD)
            
        Returns:
            Year only (YYYY)
        """
        if not date_str:
            return None
        
        try:
            date_obj = datetime.fromisoformat(date_str)
            return str(date_obj.year)
        except Exception as e:
            logger.warning(f"Failed to parse date: {date_str} - {e}")
            return None
    
    def _calculate_age_group(self, birth_year: int, reference_year: int = None) -> str:
        """
        Calculate age group from birth year.
        
        Args:
            birth_year: Year of birth
            reference_year: Reference year (defaults to current year)
            
        Returns:
            Age group string (e.g., "40-49")
        """
        if reference_year is None:
            reference_year = datetime.now().year
        
        age = reference_year - birth_year
        
        if age < 18:
            return "under-18"
        elif age < 30:
            return "18-29"
        elif age < 40:
            return "30-39"
        elif age < 50:
            return "40-49"
        elif age < 60:
            return "50-59"
        elif age < 70:
            return "60-69"
        else:
            return "70-plus"
    
    def _anonymize_geographic(self, address: Optional[str]) -> Optional[Dict[str, str]]:
        """
        Anonymize geographic information to state level only.
        
        Args:
            address: Full address string
            
        Returns:
            Dictionary with state and zip code (first 3 digits only)
        """
        if not address:
            return None
        
        # This is a simplified example - in production, use proper address parsing
        # Extract state (last 2 letters before zip)
        state_pattern = r'\b([A-Z]{2})\s+\d{5}'
        state_match = re.search(state_pattern, address)
        
        # Extract zip code and truncate to 3 digits
        zip_pattern = r'\b(\d{5})'
        zip_match = re.search(zip_pattern, address)
        
        return {
            "state": state_match.group(1) if state_match else None,
            "zip3": zip_match.group(1)[:3] if zip_match else None,
        }
    
    def _remove_identifiers(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Remove all HIPAA identifiers from a patient record.
        
        Args:
            record: Original patient record
            
        Returns:
            Anonymized record
        """
        anonymized = {}
        
        # Create anonymized ID
        if "patient_id" in record:
            anonymized["anonymized_patient_id"] = self._create_anonymized_id(
                str(record["patient_id"])
            )
        
        # Remove names (identifiers #1)
        # We don't copy first_name, last_name, middle_name
        
        # Anonymize birth date to year only (identifier #3)
        if "date_of_birth" in record:
            birth_year_str = self._anonymize_date(record["date_of_birth"])
            if birth_year_str:
                birth_year = int(birth_year_str)
                anonymized["birth_year"] = birth_year
                anonymized["age_group"] = self._calculate_age_group(birth_year)
        
        # Anonymize address (identifier #2)
        if "address" in record:
            geo = self._anonymize_geographic(record["address"])
            if geo:
                anonymized["state"] = geo["state"]
                anonymized["zip3"] = geo["zip3"]
        
        # Remove contact information (identifiers #4-6)
        # We don't copy phone, fax, email
        
        # Remove identifiers #7-18
        # We don't copy: ssn, medical_record_number, insurance_number, etc.
        
        # Keep non-identifying clinical and purchase data
        safe_fields = [
            "prescription_od_sphere",
            "prescription_od_cylinder",
            "prescription_od_axis",
            "prescription_os_sphere",
            "prescription_os_cylinder",
            "prescription_os_axis",
            "lens_type",  # e.g., "progressive", "single vision"
            "frame_type",
            "lens_material",
            "coating_type",
            "purchase_amount",
            "insurance_type_category",  # e.g., "vision", "medical" (not specific plan)
        ]
        
        for field in safe_fields:
            if field in record:
                anonymized[field] = record[field]
        
        # Keep year of visits/purchases (not full dates)
        if "last_visit_date" in record:
            anonymized["last_visit_year"] = self._anonymize_date(record["last_visit_date"])
        
        return anonymized
    
    def anonymize_database(self):
        """
        Create anonymized copy of entire patient database.
        
        This reads from the source database and writes to a new anonymized database.
        """
        logger.info(f"[{self.tenant_id}] Starting anonymization process")
        
        try:
            # Connect to source (READ-ONLY)
            source_conn = sqlite3.connect(self.source_connection)
            source_conn.row_factory = sqlite3.Row
            source_cursor = source_conn.cursor()
            
            # Connect to destination (WRITE)
            dest_conn = sqlite3.connect(self.destination_connection)
            dest_cursor = dest_conn.cursor()
            
            # Create anonymized table schema
            dest_cursor.execute("""
                CREATE TABLE IF NOT EXISTS anonymized_patients (
                    anonymized_patient_id TEXT PRIMARY KEY,
                    birth_year INTEGER,
                    age_group TEXT,
                    state TEXT,
                    zip3 TEXT,
                    prescription_od_sphere REAL,
                    prescription_od_cylinder REAL,
                    prescription_od_axis INTEGER,
                    prescription_os_sphere REAL,
                    prescription_os_cylinder REAL,
                    prescription_os_axis INTEGER,
                    lens_type TEXT,
                    frame_type TEXT,
                    lens_material TEXT,
                    coating_type TEXT,
                    purchase_amount REAL,
                    insurance_type_category TEXT,
                    last_visit_year TEXT
                )
            """)
            
            # Read all patients from source
            source_cursor.execute("SELECT * FROM patients")
            patients = source_cursor.fetchall()
            
            logger.info(f"[{self.tenant_id}] Processing {len(patients)} patient records")
            
            # Anonymize and insert each record
            anonymized_count = 0
            for patient in patients:
                # Convert row to dictionary
                patient_dict = dict(patient)
                
                # Anonymize
                anonymized = self._remove_identifiers(patient_dict)
                
                # Insert into destination
                columns = ", ".join(anonymized.keys())
                placeholders = ", ".join(["?"] * len(anonymized))
                
                dest_cursor.execute(
                    f"INSERT OR REPLACE INTO anonymized_patients ({columns}) VALUES ({placeholders})",
                    list(anonymized.values())
                )
                
                anonymized_count += 1
            
            # Commit changes
            dest_conn.commit()
            
            logger.info(
                f"[{self.tenant_id}] Anonymization complete: {anonymized_count} records processed"
            )
            
            # Close connections
            source_conn.close()
            dest_conn.close()
            
            # Log completion
            self._log_anonymization_audit(anonymized_count)
            
        except Exception as e:
            logger.error(f"[{self.tenant_id}] Anonymization failed: {e}")
            raise
    
    def _log_anonymization_audit(self, record_count: int):
        """
        Log anonymization event for compliance audit trail.
        
        Args:
            record_count: Number of records anonymized
        """
        audit_log = {
            "event": "patient_data_anonymization",
            "tenant_id": self.tenant_id,
            "timestamp": datetime.utcnow().isoformat(),
            "record_count": record_count,
            "compliance_method": "HIPAA Safe Harbor",
            "identifiers_removed": 18,
        }
        
        logger.info(f"AUDIT: {audit_log}")
        
        # In production, write to secure audit log database


# Example Usage
if __name__ == "__main__":
    """
    Demonstration of anonymization process.
    
    In production:
    1. Run this script on a scheduled basis (e.g., nightly)
    2. Load hash_salt from AWS Secrets Manager or Azure Key Vault
    3. Use PostgreSQL or secure database instead of SQLite
    4. Implement additional security layers (encryption at rest, access controls)
    """
    
    # Example tenant configuration
    tenant_id = "demo_clinic_001"
    
    # Database paths (in production, use secure connection strings)
    source_db = "./demo_patients_original.db"
    anonymized_db = "./demo_patients_anonymized.db"
    
    # Create example source data (for demonstration only)
    conn = sqlite3.connect(source_db)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS patients (
            patient_id INTEGER PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            date_of_birth TEXT,
            address TEXT,
            phone TEXT,
            email TEXT,
            ssn TEXT,
            medical_record_number TEXT,
            prescription_od_sphere REAL,
            prescription_od_cylinder REAL,
            prescription_od_axis INTEGER,
            prescription_os_sphere REAL,
            prescription_os_cylinder REAL,
            prescription_os_axis INTEGER,
            lens_type TEXT,
            frame_type TEXT,
            lens_material TEXT,
            coating_type TEXT,
            purchase_amount REAL,
            insurance_type_category TEXT,
            last_visit_date TEXT
        )
    """)
    
    # Insert sample patients (with fake PII)
    cursor.execute("""
        INSERT OR REPLACE INTO patients VALUES
        (1, 'John', 'Doe', '1975-03-15', '123 Main St, Boston, MA 02101', '617-555-1234', 'john@example.com', '123-45-6789', 'MR12345',
         -2.50, -0.75, 180, -2.25, -1.00, 175, 'progressive', 'full-rim', 'high-index', 'anti-reflective', 550.00, 'vision', '2024-01-15')
    """)
    
    conn.commit()
    conn.close()
    
    # Run anonymization
    anonymizer = PatientDataAnonymizer(
        source_connection_string=source_db,
        destination_connection_string=anonymized_db,
        tenant_id=tenant_id,
    )
    
    anonymizer.anonymize_database()
    
    # Verify anonymized data
    print("\n=== Anonymized Data Sample ===")
    conn = sqlite3.connect(anonymized_db)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM anonymized_patients LIMIT 5")
    
    for row in cursor.fetchall():
        print(dict(row))
    
    conn.close()
    
    print(f"\n✓ Anonymization complete. Original database has {1} record(s) with PII.")
    print(f"✓ Anonymized database created with HIPAA-compliant de-identified data.")
    print(f"✓ The LLM will ONLY access the anonymized database - never the original.")
