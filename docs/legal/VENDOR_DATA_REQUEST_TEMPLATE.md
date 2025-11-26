# DATA EXPORT REQUEST LETTER TEMPLATE

**Use this template to request your practice data from your current software vendor (Optix, Occuco, Acuity, etc.)**

---

## STANDARD DATA EXPORT REQUEST

**[Date]**

**To:**
[Vendor Name]
[Vendor Address]
[City, State, ZIP]

**Attn:** Customer Support / Data Export Team

**From:**
[Your Practice Name]
[Your Address]
[City, State, ZIP]
[Phone Number]
[Email Address]

**Re: Request for Complete Practice Data Export**

---

Dear [Vendor Name] Customer Support,

This letter serves as our formal request for a complete export of all practice data currently stored in your [Product Name] system for our practice, **[Practice Name]**, Account ID: **[Your Account ID]**.

### LEGAL BASIS FOR THIS REQUEST

Under the following legal authorities, we request immediate provision of our complete practice data:

**1. HIPAA Right of Access (45 C.F.R. § 164.524)**
- Patients have the right to access their health information
- We, as the Covered Entity, are the stewards of our patients' data
- You, as our Business Associate, must provide us with access to all Protected Health Information (PHI)

**2. 21st Century Cures Act - Information Blocking Rule**
- Health IT vendors may not engage in practices that interfere with access, exchange, or use of electronic health information
- Failure to provide data export may constitute information blocking (45 C.F.R. Part 171)
- Penalties for information blocking can exceed $1,000,000 per violation

**3. Contractual Rights**
- Our service agreement grants us ownership of all practice data
- We have the right to export and port our data to other systems

### DATA REQUESTED

We require a complete export of the following data types in standard, machine-readable formats (CSV, Excel, or JSON):

**Patient Information:**
- Patient demographics (name, DOB, contact information, address)
- Medical record numbers and unique identifiers
- NHS numbers (UK practices) or insurance information
- Emergency contact information
- Medical history and current medications
- Allergies and systemic conditions

**Clinical Records:**
- Eye examination records (all fields and test results)
- Visual acuity measurements
- Refraction data
- Intraocular pressure (IOP) readings
- Slit lamp findings
- Ophthalmoscopy findings
- All clinical notes and observations

**Prescriptions:**
- Complete prescription history
- Sphere, cylinder, axis, add power for both eyes
- Pupillary distance (PD) measurements
- Prism prescriptions
- Issue and expiry dates
- Prescriber information

**Dispense Records:**
- Frame and lens specifications
- Dispensing dates
- Dispenser information
- Special instructions
- Pricing and warranty information

**Appointments:**
- Appointment history (scheduled, completed, cancelled, no-shows)
- Appointment types and durations
- Practitioner assignments
- Reminder records

**Orders:**
- Lab order history
- Order specifications
- Tracking information
- Order status history

**Financial Data:**
- Invoice history
- Payment records
- Outstanding balances
- NHS voucher claims (UK practices)
- Insurance claim submissions

**System Logs:**
- User access logs for our practice
- Data modification audit trails
- System integration logs

### DATA FORMAT REQUIREMENTS

Please provide the data in one of the following formats:

**Preferred Format:**
- CSV files (one file per data type)
- UTF-8 encoding
- Column headers included
- Date format: YYYY-MM-DD (ISO 8601)

**Alternative Formats:**
- Excel workbooks (.xlsx)
- JSON structured data
- SQL database dump (with schema documentation)
- HL7 v2 or FHIR R4 (for clinical data)

**Required Documentation:**
- Data dictionary explaining all fields and coded values
- Database schema or entity relationship diagram
- Export date and time
- Record counts for verification

### DELIVERY METHOD

Please deliver the data export via one of the following secure methods:

1. **Secure File Transfer Protocol (SFTP)**
   - Provide SFTP credentials
   - Encrypt files with AES-256
   - Provide separate password/key for decryption

2. **Encrypted Cloud Storage**
   - Upload to encrypted folder (Google Drive, OneDrive, Box)
   - Share access only with [designated email address]
   - Files must be password-protected

3. **Encrypted USB Drive**
   - Ship via tracked courier service
   - AES-256 hardware encryption
   - Provide password via separate secure channel

4. **API Access** (if available)
   - Provide API credentials and documentation
   - Must support bulk data export
   - Include rate limits and access duration

### SECURITY REQUIREMENTS

As this data contains Protected Health Information (PHI), we require:

**Encryption:**
- Data must be encrypted in transit AND at rest
- Minimum: AES-256 encryption
- TLS 1.3 for network transfers

**Access Controls:**
- Limit access to authorized personnel only
- Provide audit trail of who accessed the export
- Multi-factor authentication for download links

**Breach Prevention:**
- Do not send unencrypted PHI via standard email
- Do not store data on unsecured cloud storage
- Provide verification of data integrity (checksums/hashes)

### TIMELINE

Under HIPAA regulations, access to PHI must be provided within **thirty (30) days** of this request.

We request the data be made available by: **[Date - 30 days from request]**

If you anticipate any delays, please notify us immediately with:
- Reason for delay
- New estimated delivery date (may not exceed 30 additional days)
- Status updates every 7 days

### COMPLETENESS VERIFICATION

Please provide:
- Record counts for each data type
- Date range of data included (earliest and latest records)
- List of any excluded data and reason for exclusion
- Certification that the export is complete and accurate

### POINT OF CONTACT

Please coordinate this data export with:

**Primary Contact:**
Name: [Your Name]
Title: [Your Title]
Email: [Your Email]
Phone: [Your Phone]

**Secondary Contact:**
Name: [Backup Contact Name]
Email: [Backup Email]
Phone: [Backup Phone]

### BUSINESS ASSOCIATE OBLIGATION

As our Business Associate under HIPAA, you are obligated to:
- Provide access to all PHI upon request (45 C.F.R. § 164.524)
- Maintain confidentiality during the export process
- Ensure data integrity and completeness
- Provide exports in a standard, readily usable format
- Comply with the 30-day timeline

### ONGOING ACCESS

Following the initial export:
- We will continue to use your system during our migration period
- We require ongoing read access to our data
- We will provide [X days] notice before ceasing use of your system
- Upon final migration, we will request deletion of all our data from your systems

### NO FEE POLICY

Under the 21st Century Cures Act, you may not:
- Charge fees that constitute information blocking
- Impose unreasonable conditions on data access
- Delay access beyond regulatory timelines

If you intend to charge a fee for this export, please provide:
- Itemized cost breakdown
- Justification under permissible cost recovery
- Alternative no-cost options

**We expect this service to be provided at no charge as part of our data ownership rights.**

### CONFIRMATION REQUESTED

Please confirm receipt of this request within **five (5) business days** and provide:
1. Estimated delivery date
2. Format of the data export
3. Delivery method
4. Contact person managing the export
5. Any clarifying questions

### LEGAL COMPLIANCE

Failure to comply with this request may constitute:
- HIPAA violation (45 C.F.R. § 164.524)
- Information blocking under the 21st Century Cures Act (penalties up to $1M+)
- Breach of our service agreement
- Grounds for regulatory complaint to OCR and ONC

We trust you will handle this request professionally and in compliance with all applicable regulations.

---

**Thank you for your prompt attention to this matter.**

Sincerely,

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_
[Your Name]
[Your Title]
[Practice Name]

**Enclosures:**
- Copy of service agreement (highlighting data ownership clauses)
- HIPAA Business Associate Agreement on file

**CC:**
- [Your Attorney/Legal Counsel] (if applicable)
- ILS 2.0 Migration Team (migration@ils2.com)

---

## FOLLOW-UP TIMELINE

**If you don't receive a response:**

| Timeframe | Action |
|-----------|--------|
| Day 5 | Send follow-up email requesting acknowledgment |
| Day 10 | Phone call to vendor support escalating to management |
| Day 15 | Formal escalation letter citing legal requirements |
| Day 20 | Contact vendor's legal/compliance department |
| Day 25 | Prepare complaint to HHS Office for Civil Rights (OCR) |
| Day 30+ | File formal complaint with OCR for HIPAA violation |

**Regulatory Complaint Contacts:**

**HHS Office for Civil Rights (HIPAA)**
- Website: https://www.hhs.gov/ocr/complaints
- Phone: 1-800-368-1019

**ONC Information Blocking Complaints**
- Website: https://www.healthit.gov/report-info-blocking
- Email: InfoBlocking@hhs.gov

---

## TIPS FOR SUCCESS

**1. Document Everything**
- Save copies of all correspondence
- Note dates and times of phone calls
- Keep records of who you spoke with

**2. Be Professional**
- Remain courteous but firm
- Reference specific regulations
- Set clear expectations

**3. Know Your Rights**
- You own your data
- Vendors cannot withhold it
- Penalties for non-compliance are severe

**4. Get Help**
- ILS 2.0 can assist with the migration process
- Consult legal counsel if vendor is uncooperative
- Join practice management forums for vendor-specific advice

---

**Document Version:** 1.0
**Last Updated:** November 2025
**For questions:** migration@ils2.com
