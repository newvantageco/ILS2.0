# End-to-End Testing Guide - Eye Examination System

## Overview
This guide provides step-by-step instructions for comprehensive testing of the Eye Examination workflow, including all 8 implemented tabs, save/load functionality, print features, and finalization.

## Prerequisites
- ✅ Development server running on http://localhost:5000
- ✅ Database connection established
- ✅ User authenticated with ECP/Optometrist role
- ✅ At least one patient in the system

## Test Workflow

### Phase 1: Initial Setup & Navigation

#### Step 1.1: Access Eye Examination Page
1. Open browser to: http://localhost:5000/ecp/examination/new
2. **Expected**: Page loads with 10-tab interface
3. **Verify**: 
   - Header shows "Eye Examination"
   - Persistent header with patient selection
   - Left sidebar with "Previous Examinations"
   - Tab navigation at bottom (General History → Summary)

#### Step 1.2: Select Patient
1. Click "Select Patient" dropdown in header
2. Choose a patient from the list
3. **Expected**: 
   - Patient name displays in header
   - Patient DOB displays
   - Previous examinations load in left sidebar (if any exist)
4. **Verify**: Patient ID is set in form data

---

### Phase 2: Tab-by-Tab Data Entry

#### Tab 1: General History ✅
**Fields to Test:**
1. **Schedule Section:**
   - Examination date: Select today's date
   - Seen by: Select practitioner
   - Healthcare type: Select "Private" or "NHS"
   - NHS Evidence number (if NHS): Enter test number

2. **Reason for Visit:**
   - Type: "Routine eye examination"

3. **Symptoms Section:**
   - Visual Impairment: Select "None"
   - Check 2-3 symptom checkboxes (e.g., Flashes, Floaters)

4. **Current Medications:**
   - Add medication: "Aspirin - 75mg daily"
   - Click "Add Medication"

5. **Ocular History:**
   - Previous eye conditions: "Myopia"
   - Previous eye surgery: "None"

6. **Family History:**
   - Family conditions: "Glaucoma (Mother)"

7. **Lifestyle:**
   - Occupation: "Software Developer"
   - Driving: Check "Yes"
   - VDU work: Check "Yes"
   - Hobbies: "Reading, Gaming"

**Verification:**
- All fields save correctly
- Navigate to Tab 2 and back to verify data persistence

---

#### Tab 2: Current Rx ✅
**Fields to Test:**
1. **Current Spectacles - Distance:**
   - R: Sphere: -2.00, Cylinder: -0.50, Axis: 90
   - L: Sphere: -1.75, Cylinder: -0.75, Axis: 85
   - Both VAs: 6/6

2. **Current Spectacles - Near:**
   - R: Sphere: -2.00, Cylinder: -0.50, Axis: 90
   - L: Sphere: -1.75, Cylinder: -0.75, Axis: 85

3. **Spectacle Details:**
   - Age: "2 years"
   - Condition: "Good"
   - Tint: "None"

4. **Contact Lenses (optional):**
   - Type: "Soft Daily Disposable"
   - Brand: "Acuvue"
   - Wearing schedule: "8 hours/day"

**Verification:**
- All grid values display correctly
- VA fields populate
- Navigate forward and back to check persistence

---

#### Tab 3: New Rx ✅ (CRITICAL - Legal Prescription)
**Objective Refraction:**
1. **Retinoscopy:**
   - R: Sphere: -2.25, Cylinder: -0.50, Axis: 90
   - L: Sphere: -2.00, Cylinder: -0.75, Axis: 85

2. **Auto-Refractor:**
   - R: Sphere: -2.00, Cylinder: -0.50, Axis: 92
   - L: Sphere: -1.75, Cylinder: -0.75, Axis: 87

**Subjective Refraction:**
1. **Primary Pair (Distance) - GREEN BORDER:**
   - R: Sphere: -2.00, Cylinder: -0.50, Axis: 90, VA: 6/5
   - L: Sphere: -1.75, Cylinder: -0.75, Axis: 85, VA: 6/5
   - Binocular VA: 6/5

2. **Near Rx - BLUE BORDER:**
   - R: Sphere: -2.00, Cylinder: -0.50, Axis: 90
   - L: Sphere: -1.75, Cylinder: -0.75, Axis: 85
   - Binocular VA: N5

3. **Intermediate Rx - PURPLE BORDER:**
   - R: Sphere: -1.50, Cylinder: -0.50, Axis: 90
   - L: Sphere: -1.25, Cylinder: -0.75, Axis: 85
   - Binocular VA: N8

**Verification:**
- Color-coded borders display correctly
- All three final Rx sections are clearly visible
- Data will be used for prescription printing

---

#### Tab 4: Ophthalmoscopy ✅
**Fields to Test:**
1. **Fundus Examination - Right Eye:**
   - Media: "Clear"
   - Optic Disc: "Healthy, well-defined margins"
   - Cup/Disc ratio: 0.3
   - Macula: "Healthy"
   - Vessels: "Normal"
   - Periphery: "Healthy"

2. **Fundus Examination - Left Eye:**
   - Media: "Clear"
   - Optic Disc: "Healthy, well-defined margins"
   - Cup/Disc ratio: 0.3
   - Macula: "Healthy"
   - Vessels: "Normal"
   - Periphery: "Healthy"

3. **Additional Notes:**
   - "No abnormalities detected. Healthy fundus OU."

**Verification:**
- All text areas accept input
- Cup/disc ratio fields validate numeric input
- Notes save correctly

---

#### Tab 5: Slit Lamp ✅
**Fields to Test:**
1. **External Examination - Right Eye:**
   - Lids & Lashes: "Normal"
   - Conjunctiva: "Clear"
   - Cornea: "Clear"
   - Anterior Chamber: "Deep & Quiet"
   - Iris: "Normal"
   - Lens: "Clear"

2. **External Examination - Left Eye:**
   - (Same as right eye)

3. **Pupil Reactions:**
   - Right: Direct: "Brisk", Consensual: "Brisk"
   - Left: Direct: "Brisk", Consensual: "Brisk"
   - RAPD: "None"

4. **Additional Notes:**
   - "No anterior segment abnormalities. Pupils PERRLA."

**Verification:**
- All dropdowns populate
- Pupil reaction checkboxes work
- Bilateral data entry is symmetrical

---

#### Tab 6: Additional Tests ✅
**Fields to Test:**
1. **Visual Fields:**
   - Method: "Confrontation"
   - Right eye: "Full to confrontation"
   - Left eye: "Full to confrontation"
   - Notes: "No field defects detected"

2. **Color Vision:**
   - Test: "Ishihara"
   - Right: 17/17
   - Left: 17/17
   - Result: "Normal"

3. **Binocular Vision:**
   - Cover test distance: "Orthophoria"
   - Cover test near: "Orthophoria"
   - Stereopsis: "60 seconds of arc"

4. **Retinal Photography:**
   - Images captured: Check "Yes"
   - Number: "4 images (2 per eye)"
   - Notes: "Fundus photos on file"

**Verification:**
- All test sections expand/collapse
- Numeric inputs validate
- Notes save correctly

---

#### Tab 7: Tonometry ✅ (Auto-Calculating)
**Fields to Test:**
1. **IOP Measurements - Right Eye:**
   - Value 1: 15
   - Value 2: 16
   - Value 3: 15
   - Value 4: 16
   - **Expected**: Average auto-calculates to 15.5

2. **IOP Measurements - Left Eye:**
   - Value 1: 14
   - Value 2: 15
   - Value 3: 14
   - Value 4: 15
   - **Expected**: Average auto-calculates to 14.5

3. **Method:**
   - Select: "Goldmann Applanation"

4. **Time:**
   - Select current time

5. **NCT Readings (optional):**
   - Right: 16, 15, 16
   - Left: 15, 14, 15

**Verification:**
- ✅ **CRITICAL**: Averages calculate automatically as values are entered
- IOP values display in both measurement grids
- Method and time selections save

---

#### Tab 8: Eye Sketch (Phase 2 - Deferred) ⏸️
**Status**: Not implemented in Phase 1
**Action**: Skip this tab for now

---

#### Tab 9: Image Viewer (Phase 2 - Deferred) ⏸️
**Status**: Not implemented in Phase 1
**Action**: Skip this tab for now

---

#### Tab 10: Summary ✅
**Fields to Test:**
1. **Rx Status:**
   - Select: "New Rx Issued"

2. **NHS Voucher:**
   - Check: "No" (or "Yes" to test voucher indicator)

3. **Handover Notes:**
   - Type: "Patient requires new spectacles for distance and near. Advised on UV protection. Next recall in 24 months."

4. **Recall Management:**
   - Select recall group: "2 Years"
   - Click "Add Recall"
   - **Expected**: Recall appears in table with due date 2 years from today
   - Adjust due date if needed
   - Click "Remove" to test removal

5. **Prescription Display:**
   - **Expected**: Three read-only Rx grids display:
     - Distance (green border)
     - Near (blue border)
     - Intermediate (purple border)
   - Verify all values match Tab 3 entries

6. **Prescription Actions Card:**
   - **Expected**: Blue card appears with two buttons
   - Print Prescription: Should be enabled
   - Email Prescription: Should be disabled (future feature)

**Verification:**
- All summary fields populate correctly
- Read-only Rx displays match Tab 3 data
- Recall management works correctly

---

### Phase 3: Save & Load Testing

#### Step 3.1: Save Examination
1. Click "Save Examination" button in header
2. **Expected**: 
   - Toast notification: "Examination saved successfully"
   - Examination ID appears in URL (if new)
3. **Verify**: 
   - No errors in console
   - Data persists in database

#### Step 3.2: Verify Previous Exams Sidebar
1. Look at left sidebar "Previous Examinations"
2. **Expected**: 
   - Saved examination appears in list (if same patient)
   - Shows date and status
3. Click on a previous examination
4. **Expected**: 
   - All tabs load with previous data
   - All fields are populated correctly

#### Step 3.3: Navigation After Save
1. Navigate away: Click browser back or go to another page
2. Return to examination: Use URL or navigate back
3. **Expected**: 
   - All data is still present
   - No data loss
   - All 8 tabs retain their values

---

### Phase 4: Print Functionality Testing 🖨️

#### Step 4.1: Access Print Feature
1. Navigate to Tab 10 (Summary)
2. Ensure "Rx Status" is set to "New Rx Issued"
3. **Expected**: 
   - "Prescription Actions" card appears (blue border)
   - "Print Prescription" button is enabled

#### Step 4.2: Test Print Button
1. Click "Print Prescription" button
2. **Expected**: 
   - New browser window opens
   - Prescription displays with professional formatting
   - Print dialog appears automatically

#### Step 4.3: Verify Prescription Content
**Check the following on printed prescription:**

✅ **Header Section:**
- Practice name
- Practice address and phone
- Examination date (formatted as dd/MM/yyyy)
- Valid until date (2 years from exam date)

✅ **Patient Details:**
- Patient full name
- Patient date of birth
- Patient address (if available)

✅ **Distance Prescription (Green Border):**
- Right eye: Sphere, Cylinder, Axis, Prism, Add
- Left eye: Sphere, Cylinder, Axis, Prism, Add
- Binocular VA
- Values match Tab 3 final Rx

✅ **Near Prescription (Blue Border):**
- Right eye: Sphere, Cylinder, Axis, Prism
- Left eye: Sphere, Cylinder, Axis, Prism
- Binocular VA
- Values match Tab 3 final Rx

✅ **Intermediate Prescription (Purple Border):**
- Right eye: Sphere, Cylinder, Axis, Prism
- Left eye: Sphere, Cylinder, Axis, Prism
- Binocular VA
- Values match Tab 3 final Rx

✅ **Additional Information:**
- Handover notes from Summary tab
- NHS voucher indicator (if eligible)

✅ **Practitioner Signature:**
- Examined by: Practitioner name
- GOC Registration number
- Signature line

✅ **Footer:**
- Important notes about prescription validity
- Contact information

#### Step 4.4: Test Print Actions
1. **Print Preview**: 
   - Verify layout fits A4 page
   - Check margins and spacing
   - Verify all text is readable

2. **Save as PDF** (if available in browser):
   - Click "Save as PDF" in print dialog
   - Save to desktop
   - Open PDF and verify content

3. **Cancel Print**:
   - Click "Cancel" in print dialog
   - **Expected**: Print window closes

4. **Actual Print** (optional):
   - Print to physical printer
   - Verify paper output is legible and professional

#### Step 4.5: Test Edge Cases
1. **Print with only Distance Rx:**
   - Go to Tab 3, clear Near and Intermediate Rx
   - Save
   - Go to Tab 10, print
   - **Expected**: Only Distance Rx section appears

2. **Print with missing GOC number:**
   - If practitioner has no GOC number
   - **Expected**: Prescription still prints, GOC section omitted

3. **Print with NHS voucher:**
   - Set voucher to "Yes" in Summary
   - Print
   - **Expected**: NHS voucher indicator appears

4. **Print with additional notes:**
   - Add lengthy notes in Summary
   - Print
   - **Expected**: Notes appear in "Additional Notes" section

---

### Phase 5: Finalization Testing

#### Step 5.1: Finalize Examination
1. Navigate to Tab 10 (Summary)
2. Scroll to bottom
3. **Expected**: 
   - "Ready to Finalize Examination?" card appears (green border)
   - "Finalize Examination" button is enabled

#### Step 5.2: Complete Finalization
1. Click "Finalize Examination" button
2. **Expected**: 
   - Toast notification: "Examination finalized successfully"
   - Examination status changes to "Finalized"
   - Form becomes read-only

#### Step 5.3: Verify Read-Only State
1. Try to edit any field in any tab
2. **Expected**: 
   - All input fields are disabled
   - All dropdowns are disabled
   - All checkboxes are disabled
   - "Save" button may be hidden or disabled

#### Step 5.4: Verify Finalized Status
1. Check Previous Exams sidebar
2. **Expected**: 
   - Examination shows "Finalized" status
   - Status badge appears (green)

---

### Phase 6: Data Persistence Verification

#### Step 6.1: Database Check
1. Open database client or SQL terminal
2. Run query:
   ```sql
   SELECT id, patient_id, examination_date, status, finalized, 
          general_history, current_rx, new_rx, ophthalmoscopy, 
          slit_lamp, additional_tests, tonometry, summary
   FROM eye_examinations 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

3. **Verify**:
   - Record exists with correct patient_id
   - Status is "finalized" (if finalized)
   - All JSONB fields contain data:
     - general_history
     - current_rx
     - new_rx
     - ophthalmoscopy
     - slit_lamp
     - additional_tests
     - tonometry
     - summary

#### Step 6.2: Reload from Database
1. Refresh browser completely (Cmd+Shift+R / Ctrl+F5)
2. Navigate to examination using URL with ID
3. **Expected**: 
   - All tabs load with correct data
   - All values are exactly as entered
   - No data loss or corruption

#### Step 6.3: Cross-Session Test
1. Logout from application
2. Login again
3. Navigate to patient records
4. Open the finalized examination
5. **Expected**: 
   - All data loads correctly
   - Examination is read-only (finalized)
   - Print functionality still works

---

## Test Results Checklist

### Navigation & UI ✅
- [ ] Page loads without errors
- [ ] All 10 tabs are visible
- [ ] Tab navigation works (previous/next)
- [ ] Patient selection works
- [ ] Previous exams sidebar loads
- [ ] Header displays patient info correctly

### Data Entry ✅
- [ ] Tab 1 (General History): All fields save
- [ ] Tab 2 (Current Rx): Grid values save
- [ ] Tab 3 (New Rx): All three Rx types save
- [ ] Tab 4 (Ophthalmoscopy): Text areas save
- [ ] Tab 5 (Slit Lamp): Dropdowns save
- [ ] Tab 6 (Additional Tests): All sections save
- [ ] Tab 7 (Tonometry): Auto-calculation works ✨
- [ ] Tab 10 (Summary): All fields and recalls save

### Save & Load ✅
- [ ] Save button works
- [ ] Toast notification appears
- [ ] Data persists after save
- [ ] Previous exams appear in sidebar
- [ ] Can load previous examination
- [ ] All data loads correctly from database

### Print Functionality 🖨️
- [ ] Print button appears when Rx issued
- [ ] Print window opens
- [ ] All prescription data displays
- [ ] Distance Rx appears (if filled)
- [ ] Near Rx appears (if filled)
- [ ] Intermediate Rx appears (if filled)
- [ ] Patient details correct
- [ ] Practitioner details correct
- [ ] Practice details correct
- [ ] Dates formatted correctly (dd/MM/yyyy)
- [ ] 2-year expiry calculated correctly
- [ ] Print dialog triggers automatically
- [ ] Can save as PDF
- [ ] Can print to printer
- [ ] Can cancel print
- [ ] Edge cases handled correctly

### Finalization ✅
- [ ] Finalize button appears
- [ ] Finalization succeeds
- [ ] Status changes to "Finalized"
- [ ] Form becomes read-only
- [ ] Finalized status persists

### Data Persistence ✅
- [ ] Database record created
- [ ] All JSONB fields populated
- [ ] Data reloads correctly
- [ ] Cross-session persistence works
- [ ] No data corruption

---

## Known Issues / Limitations

### Phase 1 Scope:
- ❌ Tab 8 (Eye Sketch): Not implemented - Deferred to Phase 2
- ❌ Tab 9 (Image Viewer): Not implemented - Deferred to Phase 2
- ❌ Email Prescription: Button disabled - Future feature

### Expected Behavior:
- ⚠️ Auto-calculation in Tab 7 (Tonometry) requires entering all 4 values
- ⚠️ Print requires popup permission in browser
- ⚠️ Read-only Rx grids in Summary tab rely on Tab 3 data

---

## Bug Reporting Template

If you encounter issues during testing, use this template:

```
### Bug Report

**Tab/Feature:** [Which tab or feature]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happened]

**Screenshots:**
[Attach screenshots if applicable]

**Browser:**
[Chrome/Firefox/Safari + version]

**Console Errors:**
[Any errors in browser console]
```

---

## Performance Testing

### Response Times:
- [ ] Page load: < 2 seconds
- [ ] Tab navigation: < 500ms
- [ ] Save operation: < 3 seconds
- [ ] Load previous exam: < 2 seconds
- [ ] Print generation: < 1 second

### Browser Compatibility:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Success Criteria

✅ **All tests pass in checklist above**
✅ **No console errors during workflow**
✅ **Data persists correctly in database**
✅ **Print functionality works as expected**
✅ **Finalization prevents further edits**
✅ **Professional prescription output**

---

## Next Steps After Testing

1. ✅ Complete all checklist items
2. 📝 Document any bugs found
3. 🎯 User acceptance testing
4. 🚀 Production deployment planning
5. 📚 User training documentation

---

**Test Date:** [To be completed]
**Tester:** [Your name]
**Environment:** Development (localhost:5000)
**Status:** Ready for Testing ✅
