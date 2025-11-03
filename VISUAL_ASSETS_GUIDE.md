# ILS 2.0 Landing Page - Visual Assets Guide

## 🎨 Asset Requirements for Production

This guide outlines all visual assets needed to complete the best-in-class homepage transformation.

---

## 1. Hero Section - Dynamic Product Hero

### Asset: Dashboard Demo Video/GIF
**Location:** Hero section (right column)
**Dimensions:** 800x600px minimum (maintains 4:3 aspect ratio)
**Format:** 
- Primary: Auto-playing video (MP4, WebM)
- Fallback: High-quality GIF
- Duration: 15-20 seconds looping

### Content Requirements:
Show 2-3 key screens cycling smoothly:
1. **Main Dashboard** (5 seconds)
   - Clean overview with key metrics
   - Show real-time data updating
   - Highlight modern, professional UI

2. **AI Assistant in Action** (5 seconds)
   - Show the AI Assistant popup analyzing a prescription
   - Display intelligent recommendations
   - Emphasize the "smart" capabilities

3. **POS Interface** (5 seconds)
   - Show multi-payment processing
   - Quick product scanning
   - Smooth, instant interactions

### Technical Specs:
- Quality: High resolution (1080p minimum)
- File size: <5MB (optimized for web)
- Background: Subtle, non-distracting
- Frame rate: 30fps minimum
- Audio: None (silent video)

### Design Notes:
- Use actual ILS 2.0 interface (not mockups)
- Show real data (anonymized)
- Smooth transitions between screens
- Professional color grading
- Clean, modern aesthetic

---

## 2. Speed & Simplicity Section - Micro-Videos

### Asset 1: Instant Feedback GIF
**Location:** Speed & Simplicity section, column 1
**Dimensions:** 400x300px
**Format:** GIF or short video
**Duration:** 3-5 seconds looping

**Content:** Show a patient record form being filled out and saved with instant feedback (no loading spinners, optimistic updates)

### Asset 2: Command Palette GIF
**Location:** Speed & Simplicity section, column 2
**Dimensions:** 400x300px
**Format:** GIF or short video
**Duration:** 3-5 seconds looping

**Content:** Show Ctrl+K being pressed, palette opening, user typing "patient name", and quick navigation to patient record

### Technical Specs (Both):
- File size: <1MB each
- Frame rate: 24fps minimum
- Smooth, professional animations
- Clear, readable text
- High contrast for visibility

---

## 3. Tabbed Features Section - Product Screenshots

### Asset 1: Retail & POS Screenshot
**Location:** TabbedFeatures component, Tab 1
**Dimensions:** 1200x800px minimum
**Format:** PNG or WebP

**Content:**
- Full POS interface showing:
  - Product search and barcode scanning
  - Shopping cart with multiple items
  - Payment processing panel
  - Clean, modern design
  - Real data (anonymized)

### Asset 2: Lens Management Screenshot
**Location:** TabbedFeatures component, Tab 2
**Dimensions:** 1200x800px minimum
**Format:** PNG or WebP

**Content:**
- Lens order dashboard showing:
  - List of orders with status badges
  - Quality control checkpoints
  - Patient notifications panel
  - Lab integration indicators

### Asset 3: AI Assistant Screenshot
**Location:** TabbedFeatures component, Tab 3
**Dimensions:** 1200x800px minimum
**Format:** PNG or WebP

**Content:**
- AI Assistant popup overlay showing:
  - Prescription analysis
  - Smart lens recommendations
  - Context-aware suggestions
  - Clean, conversational UI

### Asset 4: Business Intelligence Screenshot
**Location:** TabbedFeatures component, Tab 4
**Dimensions:** 1200x800px minimum
**Format:** PNG or WebP

**Content:**
- Advanced Analytics dashboard showing:
  - Multiple charts and graphs
  - Sales trends visualization
  - Product performance metrics
  - KPI cards with real-time data

### Asset 5: Multi-Tenant Security Screenshot
**Location:** TabbedFeatures component, Tab 5
**Dimensions:** 1200x800px minimum
**Format:** PNG or WebP

**Content:**
- Security settings or audit log interface showing:
  - User permissions matrix
  - Role-based access controls
  - Audit trail logging
  - Data isolation visualization

### Technical Specs (All Screenshots):
- Quality: Retina-ready (2x resolution)
- File size: <500KB each (optimized)
- Format: PNG with transparency OR WebP
- Background: Clean, professional
- UI elements: Clearly visible, high contrast

---

## 4. Testimonials Section - Customer Headshots

### Asset: Professional Headshots (3 Required)

#### Testimonial 1: Dr. Sarah Chen
**Location:** Testimonials section, card 1
**Dimensions:** 400x400px
**Format:** JPG or WebP
**Style:** Professional, friendly, approachable
**Background:** Neutral or clinical setting

#### Testimonial 2: Mark David
**Location:** Testimonials section, card 2
**Dimensions:** 400x400px
**Format:** JPG or WebP
**Style:** Professional business attire
**Background:** Office or practice setting

#### Testimonial 3: Jennifer Martinez
**Location:** Testimonials section, card 3
**Dimensions:** 400x400px
**Format:** JPG or WebP
**Style:** Professional, confident
**Background:** Office or tech setting

### Technical Specs (All Headshots):
- Quality: High resolution
- File size: <200KB each
- Aspect ratio: 1:1 (square)
- Face: Centered, smiling, professional
- Lighting: Even, professional
- Background: Slightly blurred or neutral

### Legal Requirements:
- ✅ Signed photo release forms
- ✅ Permission to use name and title
- ✅ Permission to use company name
- ✅ Permission to use testimonial quote

---

## 5. Trust Bar Section - Client Logos

### Asset: Practice Logos (6-8 Required)
**Location:** LogoWall component (Trust Bar section)
**Dimensions:** Variable, will be normalized to consistent height
**Format:** SVG (preferred) or PNG with transparency

### Logo Requirements:
- High resolution
- Transparent background
- Clean, professional
- Recognizable practices in optical industry
- Grayscale-friendly (logos will be shown in grayscale)

### Example Practices (Replace with Real Clients):
1. VisionFirst Practice
2. OptiCore Group
3. EyeCare Solutions Network
4. ClearVision Associates
5. Precision Optics Ltd
6. Modern Sight Clinic
7. Premier Eye Center
8. Advanced Optical Services

### Technical Specs:
- Format: SVG (vector) preferred
- Backup: PNG at 2x resolution (800px width minimum)
- File size: <100KB each
- Background: Transparent
- Color: Full color (will be converted to grayscale via CSS)

### Legal Requirements:
- ✅ Written permission to display logo
- ✅ Logo usage guidelines followed
- ✅ Brand guidelines respected

---

## 6. Compliance Badges - Optional Custom Graphics

### Current Implementation:
The ComplianceBadges component currently uses:
- Shield icons with text labels
- Standard design

### Enhancement Option:
Replace with official compliance badge graphics if available:

1. **HIPAA Compliant Badge**
2. **GDPR Ready Badge**
3. **SSL Secured Badge**
4. **SOC 2 Type II Badge**
5. **ISO 27001 Badge**
6. **PCI DSS Badge**

### Technical Specs (If Using Custom Badges):
- Dimensions: 200x200px minimum
- Format: PNG or SVG
- Background: Transparent
- Quality: Official, recognizable designs
- File size: <50KB each

---

## 7. Social Media Assets (Footer)

### Asset: Social Media Icons
**Location:** Footer, column 1
**Status:** ✅ Already implemented (Lucide icons)

### Optional Enhancement:
- Custom branded social media profile images
- Consistent brand presence across platforms

---

## Asset Priority Matrix

### 🔴 Critical (Required for Launch)
1. ✅ **Hero Dashboard Video/GIF** - Highest impact on conversions
2. ✅ **5 Product Screenshots** (Tabbed Features) - Essential for "show, don't tell"
3. ✅ **3 Customer Headshots** - Critical for trust and human connection

### 🟡 High Priority (Strongly Recommended)
4. ✅ **2 Micro-Videos** (Instant Feedback, Command Palette) - Enhances credibility
5. ✅ **6-8 Client Logos** - Social proof is essential for B2B

### 🟢 Medium Priority (Nice to Have)
6. ⭕ **Official Compliance Badge Graphics** - Current implementation is good, but official badges are better
7. ⭕ **Additional Feature Screenshots** - Can be added post-launch

---

## Asset Delivery Checklist

### For Each Asset, Provide:
- [ ] Primary file (full resolution)
- [ ] Web-optimized version (compressed)
- [ ] Alt text description (for accessibility)
- [ ] Source file (PSD, AI, or original format)
- [ ] Usage rights documentation

### File Naming Convention:
```
ils2-hero-dashboard-demo.mp4
ils2-speed-instant-feedback.gif
ils2-speed-command-palette.gif
ils2-feature-pos-screenshot.webp
ils2-feature-lens-management-screenshot.webp
ils2-feature-ai-assistant-screenshot.webp
ils2-feature-analytics-screenshot.webp
ils2-feature-security-screenshot.webp
ils2-testimonial-sarah-chen.jpg
ils2-testimonial-mark-david.jpg
ils2-testimonial-jennifer-martinez.jpg
ils2-logo-visionfirst.svg
ils2-logo-opticore.svg
[etc.]
```

---

## Integration Instructions

### 1. Hero Dashboard Video
Replace in: `/client/src/pages/Landing.tsx`
```tsx
// Current placeholder section around line 106
<div className="relative bg-gradient-to-br...">
  {/* Replace this entire div with: */}
  <video autoPlay loop muted playsInline className="w-full h-full object-cover rounded-2xl">
    <source src="/assets/ils2-hero-dashboard-demo.mp4" type="video/mp4" />
    <source src="/assets/ils2-hero-dashboard-demo.webm" type="video/webm" />
  </video>
</div>
```

### 2. Product Screenshots
Replace in: `/client/src/components/landing/TabbedFeatures.tsx`
```tsx
// For each tab's visual placeholder (around lines 100, 200, 300, etc.)
<img 
  src="/assets/ils2-feature-pos-screenshot.webp" 
  alt="ILS 2.0 Point of Sale Interface"
  className="rounded-lg border shadow-xl"
/>
```

### 3. Customer Headshots
Replace in: `/client/src/components/landing/TestimonialCard.tsx`
```tsx
// Around line 20
<img 
  src="/assets/ils2-testimonial-sarah-chen.jpg" 
  alt="Dr. Sarah Chen, Lead Optometrist at VisionFirst Practice"
  className="w-16 h-16 rounded-full object-cover"
/>
```

### 4. Client Logos
Replace in: `/client/src/components/landing/LogoWall.tsx`
```tsx
// Update the logos array around line 5
const logos = [
  { name: "VisionFirst Practice", src: "/assets/ils2-logo-visionfirst.svg" },
  { name: "OptiCore Group", src: "/assets/ils2-logo-opticore.svg" },
  // ... etc
];
```

---

## Quality Assurance Checklist

Before considering assets "production-ready", verify:

### Visual Quality
- [ ] All images are high resolution (Retina-ready)
- [ ] Colors are consistent with ILS 2.0 brand
- [ ] No pixelation or compression artifacts
- [ ] Professional, polished appearance

### Technical Quality
- [ ] File sizes optimized for web
- [ ] Correct formats used
- [ ] Images load quickly (<3 seconds)
- [ ] Responsive on all devices

### Legal & Compliance
- [ ] All permissions obtained and documented
- [ ] Photo releases signed
- [ ] Logo usage approved
- [ ] Testimonial quotes approved
- [ ] GDPR compliance for customer data

### Accessibility
- [ ] Alt text provided for all images
- [ ] Text overlays have sufficient contrast
- [ ] Decorative images marked appropriately
- [ ] No flashing animations (seizure risk)

---

## Timeline Recommendation

### Week 1: Critical Assets
- Hero dashboard video/GIF
- 5 product screenshots
- Client logo permissions

### Week 2: Human Elements
- 3 customer headshots
- Testimonial approvals
- Logo file collection

### Week 3: Polish & QA
- Micro-videos for Speed section
- Asset optimization
- Full integration testing

---

## Support & Questions

For asset-related questions:
- **Design Lead:** [Contact Information]
- **Development Team:** [Contact Information]
- **Asset Repository:** `/assets/` directory in project root

---

**Last Updated:** November 3, 2025  
**Version:** 1.0  
**Status:** Ready for Asset Production
