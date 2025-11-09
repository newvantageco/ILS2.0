# Eye Examination Comprehensive - Testing Guide

## 🚀 Quick Start Testing

The comprehensive 10-tab eye examination system is now **live and accessible** at:

```
http://localhost:5000/ecp/examination/new
```

## ✅ What's Ready to Test (8 of 10 Tabs)

### Core Implementation Status
- **Tab 1: General History** ✅ Full implementation
- **Tab 2: Current Rx** ✅ Full implementation  
- **Tab 3: New Rx (Refraction)** ✅ Full implementation with 3 color-coded Rx grids
- **Tab 4: Ophthalmoscopy** ✅ Bilateral fundus examination
- **Tab 5: Slit Lamp** ✅ 0-4 grading system
- **Tab 6: Additional Tests** ✅ 6 test categories with instruments
- **Tab 7: Tonometry** ✅ **Auto-calculating IOP averages**
- **Tab 8: Eye Sketch** 🔲 Placeholder (Phase 2)
- **Tab 9: Image Viewer** 🔲 Placeholder (Phase 2)
- **Tab 10: Summary** ✅ Read-only Rx display + finalization

## 📋 Testing Checklist

### 1. Access & Navigation
- [ ] Navigate to `/ecp/examination/new`
- [ ] Verify persistent header displays "Eye Exam - [Patient] - [ID]"
- [ ] Check left sidebar shows Patient Details section
- [ ] Verify "Eye Exam Save" button is visible
- [ ] Confirm all 10 tabs are visible in tab bar
- [ ] Test Previous/Next navigation buttons

### 2. Tab 1: General History
- [ ] Select examination date using calendar picker
- [ ] Fill "Seen By" field
- [ ] Select NHS/Private radio option
- [ ] Enter reason for visit
- [ ] Check visual impairment symptoms (flashes, floaters, headaches)
- [ ] Test all 5 sub-tabs: Hobbies, Family History, General Health, Allergies, Medication
- [ ] Verify data persists when switching tabs

### 3. Tab 2: Current Rx
- [ ] Fill Unaided Vision grid (R/L × Distance/Binocular/Near)
- [ ] Toggle optional Contact Lens Rx section
- [ ] Enter contact lens data (brand, name, fitting)
- [ ] Fill contact lens 8-column grid
- [ ] Complete Primary Pair spectacles grid
- [ ] Test optional Secondary Pair section
- [ ] Verify overflow scrolling on mobile

### 4. Tab 3: New Rx (CRITICAL TAB) ⭐
- [ ] Fill Objective (Retinoscopy) grid (4 columns)
- [ ] Complete Subjective Distance grid (8 columns)
- [ ] **Verify THREE final Rx sections are visible:**
  - [ ] Distance Prescription (GREEN border/background)
  - [ ] Near Prescription (BLUE border/background)
  - [ ] Intermediate Prescription (PURPLE border/background)
- [ ] Fill all three Rx grids with test data
- [ ] Enter notes in "To Be Printed" section
- [ ] Enter notes in "Not Printed" section
- [ ] **Navigate to Tab 10 and verify Rx displays correctly**

### 5. Tab 4: Ophthalmoscopy
- [ ] Verify bilateral R/L layout (side-by-side)
- [ ] Confirm blue border for Right Eye
- [ ] Confirm green border for Left Eye
- [ ] Fill fundus fields: Media, Discs, C/D Ratio, Vessels, Fundus, Macula, Periphery
- [ ] Complete binocular checks: Motility, Cover Test, Stereopsis

### 6. Tab 5: Slit Lamp
- [ ] Select method: Direct/Indirect/Both
- [ ] Check Volk checkbox
- [ ] Test 0-4 grading controls (should be radio buttons)
- [ ] Grade Conjunctiva section (4 parameters × R/L)
- [ ] Grade Cornea section (4 parameters × R/L)
- [ ] Grade Lids & Lashes section (3 parameters × R/L)
- [ ] Enter "Other Findings" text

### 7. Tab 6: Additional Tests
- [ ] **Visual Fields:**
  - [ ] Select instrument (Humphrey, Octopus, etc.)
  - [ ] Fill R/L text areas
  - [ ] Check Normal/Abnormal boxes
- [ ] **Confrontation Test:**
  - [ ] Fill R/L text areas
  - [ ] Check Normal/Abnormal boxes
- [ ] **Wide-Field Imaging:**
  - [ ] Select instrument (Optos, Clarus, Eidon)
  - [ ] Enter findings
- [ ] **OCT:**
  - [ ] Select instrument
  - [ ] Enter scan results
- [ ] **Amsler Grid:**
  - [ ] Fill R/L results
  - [ ] Check Normal/Abnormal
- [ ] **Colour Vision:**
  - [ ] Select test (Ishihara, D-15, etc.)
  - [ ] Enter results

### 8. Tab 7: Tonometry (AUTO-CALCULATION TEST) ⚡
- [ ] **Enter IOP measurements for Right Eye:**
  - [ ] Value 1: 15
  - [ ] Value 2: 16
  - [ ] Value 3: 14
  - [ ] Value 4: 15
  - [ ] **Verify average auto-calculates to 15.0**
  - [ ] Confirm average field is read-only with blue background
- [ ] **Enter IOP measurements for Left Eye:**
  - [ ] Value 1: 18
  - [ ] Value 2: 19
  - [ ] Value 3: 17
  - [ ] Value 4: 20
  - [ ] **Verify average auto-calculates to 18.5**
  - [ ] Confirm average field is read-only with green background
- [ ] Fill corrected IOP and corneal thickness
- [ ] Select instrument for each eye
- [ ] Enter examination time
- [ ] Complete anaesthetics section:
  - [ ] Select Info Given Y/N
  - [ ] Select number of drops per eye (1/2/3 radio)
  - [ ] Enter date/time, batch, expiry
  - [ ] Add notes

### 9. Tab 10: Summary (FINALIZATION) ✨
- [ ] **Verify Final Prescription Summary displays:**
  - [ ] Distance Rx (green) auto-populated from Tab 3
  - [ ] Near Rx (blue) auto-populated from Tab 3
  - [ ] Intermediate Rx (purple) auto-populated from Tab 3
  - [ ] All values match what you entered in Tab 3
- [ ] Select Prescription Status (New Rx/No Change/Updated/Not Issued)
- [ ] Check NHS Voucher checkbox
- [ ] Select referral types (Hospital/GP/Urgent/Routine)
- [ ] Check dispensing requirements (GOS/Distance Only/Varifocals/etc.)
- [ ] Enter handover notes for dispensing optician
- [ ] **Test Recall Management:**
  - [ ] Select "1 Year" from dropdown
  - [ ] Click "Add Recall"
  - [ ] Verify recall appears in Assigned Recalls table
  - [ ] Check due date is 12 months from today
  - [ ] Edit due date manually
  - [ ] Add second recall ("3 Months")
  - [ ] Remove one recall
- [ ] **Click "Finalize Examination" button**
  - [ ] Verify confirmation/success message

### 10. Data Persistence & State Management
- [ ] Fill data in Tab 1
- [ ] Navigate to Tab 5
- [ ] Return to Tab 1
- [ ] Verify data is retained
- [ ] Test with multiple tabs
- [ ] Clear browser and test form reset

## 🐛 Known Issues to Watch For

### Expected Behavior
- ✅ Auto-calculation in Tab 7 should update immediately on value change
- ✅ Summary tab should show "No prescription data" if Tab 3 is empty
- ✅ Color coding should be consistent (Blue=Right, Green=Left, colored Rx grids)
- ✅ Navigation buttons should disable at first/last tab
- ✅ All dropdowns should have placeholder text
- ✅ Read-only fields should have distinct background (lighter)

### Potential Issues
- ⚠️ Backend API not connected yet - data won't persist on page reload
- ⚠️ Patient selection from real database not implemented
- ⚠️ "Previous Exams" sidebar is empty (placeholder)
- ⚠️ Print functionality not implemented
- ⚠️ Tab 8 and 9 are placeholders only

## 🔧 If Something Doesn't Work

### Check Browser Console
```javascript
// Open DevTools (F12) and check for:
- TypeScript compilation errors
- React component errors
- Network errors (API calls)
- State management issues
```

### Common Fixes
1. **Tab not rendering:** Check browser console for import errors
2. **Auto-calculation not working:** Verify values are numeric (not empty strings)
3. **Navigation stuck:** Check if activeTab state is updating
4. **Data not persisting:** Expected - backend not connected yet
5. **Styling issues:** Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

## 📊 Performance Benchmarks

### Expected Load Times
- Initial page load: < 2 seconds
- Tab switching: < 100ms
- Auto-calculation update: Instant (< 16ms)
- Form input responsiveness: Instant

### Memory Usage
- Expected: ~50-80MB for entire application
- Warning if: > 200MB (possible memory leak)

## 📝 Test Report Template

```markdown
## Eye Examination Test Report
**Date:** [Date]
**Tester:** [Name]
**Browser:** [Chrome/Safari/Firefox + Version]
**Device:** [Desktop/Laptop/Tablet + OS]

### Tabs Tested
- [ ] Tab 1: General History - PASS/FAIL - Notes:
- [ ] Tab 2: Current Rx - PASS/FAIL - Notes:
- [ ] Tab 3: New Rx - PASS/FAIL - Notes:
- [ ] Tab 4: Ophthalmoscopy - PASS/FAIL - Notes:
- [ ] Tab 5: Slit Lamp - PASS/FAIL - Notes:
- [ ] Tab 6: Additional Tests - PASS/FAIL - Notes:
- [ ] Tab 7: Tonometry - PASS/FAIL - Notes:
- [ ] Tab 10: Summary - PASS/FAIL - Notes:

### Critical Features
- [ ] IOP auto-calculation works correctly
- [ ] Rx displays in Summary from Tab 3
- [ ] Color coding visible and correct
- [ ] Navigation Previous/Next works
- [ ] Recall management functional

### Issues Found
1. [Description] - Severity: High/Medium/Low
2. [Description] - Severity: High/Medium/Low

### Overall Assessment
- [ ] Ready for production
- [ ] Needs minor fixes
- [ ] Needs major work
```

## 🎯 Success Criteria

The implementation is considered successful if:
1. ✅ All 8 implemented tabs load without errors
2. ✅ IOP auto-calculation works in Tab 7
3. ✅ Rx data flows from Tab 3 to Tab 10 Summary
4. ✅ Navigation between tabs is smooth
5. ✅ Data persists during session (not between sessions yet)
6. ✅ Read-only mode works for non-optometrists
7. ✅ Color coding is visible and correct
8. ✅ Recall management adds/removes recalls

## 🚀 Next Steps After Testing

1. **Document bugs** found during testing
2. **Prioritize fixes** (Critical → High → Medium → Low)
3. **Connect backend API** for data persistence
4. **Implement Previous Exams** sidebar
5. **Add print/PDF** functionality
6. **Phase 2:** Implement Tab 8 (Eye Sketch) and Tab 9 (Image Viewer)

---

**Test Environment:** Development Server (localhost:5000)  
**Status:** Ready for Manual Testing  
**Last Updated:** October 31, 2025  
**Components:** 8 of 10 tabs fully functional
