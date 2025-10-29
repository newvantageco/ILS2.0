export interface ExamTemplate {
  id: string;
  name: string;
  description: string;
  sections: ExamSection[];
}

export interface ExamSection {
  id: string;
  title: string;
  fields: ExamField[];
}

export interface ExamField {
  id: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  options?: string[];
  required?: boolean;
}

export const EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: "comprehensive",
    name: "Comprehensive Eye Examination",
    description: "Full eye examination with all standard tests",
    sections: [
      {
        id: "history",
        title: "Patient History",
        fields: [
          { id: "chiefComplaint", label: "Chief Complaint", type: "textarea", placeholder: "Primary reason for visit" },
          { id: "symptoms", label: "Symptoms", type: "textarea", placeholder: "Current symptoms" },
          { id: "medicalHistory", label: "Medical History", type: "textarea", placeholder: "Relevant medical conditions" },
          { id: "medications", label: "Current Medications", type: "textarea", placeholder: "List all medications" },
          { id: "allergies", label: "Allergies", type: "text", placeholder: "Known allergies" },
        ],
      },
      {
        id: "visual-acuity",
        title: "Visual Acuity",
        fields: [
          { id: "vaODUnaided", label: "VA OD Unaided", type: "text", placeholder: "6/6" },
          { id: "vaOSUnaided", label: "VA OS Unaided", type: "text", placeholder: "6/6" },
          { id: "vaODAided", label: "VA OD Aided", type: "text", placeholder: "6/6" },
          { id: "vaOSAided", label: "VA OS Aided", type: "text", placeholder: "6/6" },
          { id: "nearVision", label: "Near Vision", type: "text", placeholder: "N5" },
        ],
      },
      {
        id: "refraction",
        title: "Refraction",
        fields: [
          { id: "odSphere", label: "OD Sphere", type: "text", placeholder: "-1.25" },
          { id: "odCylinder", label: "OD Cylinder", type: "text", placeholder: "-0.50" },
          { id: "odAxis", label: "OD Axis", type: "number", placeholder: "90" },
          { id: "osSphere", label: "OS Sphere", type: "text", placeholder: "-1.25" },
          { id: "osCylinder", label: "OS Cylinder", type: "text", placeholder: "-0.50" },
          { id: "osAxis", label: "OS Axis", type: "number", placeholder: "90" },
        ],
      },
      {
        id: "eye-health",
        title: "Eye Health Assessment",
        fields: [
          { id: "pupilsOD", label: "Pupils OD", type: "text", placeholder: "PERRL" },
          { id: "pupilsOS", label: "Pupils OS", type: "text", placeholder: "PERRL" },
          { id: "iopOD", label: "IOP OD (mmHg)", type: "number", placeholder: "15" },
          { id: "iopOS", label: "IOP OS (mmHg)", type: "number", placeholder: "15" },
          { id: "anteriorSegmentOD", label: "Anterior Segment OD", type: "textarea", placeholder: "Clear cornea, deep AC, clear lens" },
          { id: "anteriorSegmentOS", label: "Anterior Segment OS", type: "textarea", placeholder: "Clear cornea, deep AC, clear lens" },
          { id: "fundusOD", label: "Fundus OD", type: "textarea", placeholder: "Healthy disc, vessels, macula" },
          { id: "fundusOS", label: "Fundus OS", type: "textarea", placeholder: "Healthy disc, vessels, macula" },
        ],
      },
      {
        id: "assessment",
        title: "Assessment & Plan",
        fields: [
          { id: "diagnosis", label: "Diagnosis", type: "textarea", placeholder: "Primary diagnosis" },
          { id: "plan", label: "Management Plan", type: "textarea", placeholder: "Treatment plan" },
          { id: "recall", label: "Recall Period", type: "select", options: ["6 months", "1 year", "2 years", "As needed"] },
        ],
      },
    ],
  },
  {
    id: "contact-lens",
    name: "Contact Lens Fitting",
    description: "Contact lens examination and fitting",
    sections: [
      {
        id: "current-wear",
        title: "Current Contact Lens Wear",
        fields: [
          { id: "currentlyWears", label: "Currently Wears CLs", type: "checkbox" },
          { id: "brandOD", label: "Brand OD", type: "text" },
          { id: "brandOS", label: "Brand OS", type: "text" },
          { id: "wearingSchedule", label: "Wearing Schedule", type: "select", options: ["Daily", "Extended", "Occasional"] },
          { id: "comfort", label: "Comfort Level", type: "select", options: ["Excellent", "Good", "Fair", "Poor"] },
        ],
      },
      {
        id: "keratometry",
        title: "Keratometry",
        fields: [
          { id: "kODFlat", label: "K OD Flat", type: "text", placeholder: "42.50" },
          { id: "kODSteep", label: "K OD Steep", type: "text", placeholder: "43.00" },
          { id: "kODAxis", label: "K OD Axis", type: "number", placeholder: "180" },
          { id: "kOSFlat", label: "K OS Flat", type: "text", placeholder: "42.50" },
          { id: "kOSSteep", label: "K OS Steep", type: "text", placeholder: "43.00" },
          { id: "kOSAxis", label: "K OS Axis", type: "number", placeholder: "180" },
        ],
      },
      {
        id: "trial-lens",
        title: "Trial Lens Assessment",
        fields: [
          { id: "trialBrandOD", label: "Trial Brand OD", type: "text" },
          { id: "trialPowerOD", label: "Trial Power OD", type: "text" },
          { id: "trialBcOD", label: "Trial BC OD", type: "text" },
          { id: "trialDiameterOD", label: "Trial Diameter OD", type: "text" },
          { id: "fitOD", label: "Fit Assessment OD", type: "textarea" },
          { id: "trialBrandOS", label: "Trial Brand OS", type: "text" },
          { id: "trialPowerOS", label: "Trial Power OS", type: "text" },
          { id: "trialBcOS", label: "Trial BC OS", type: "text" },
          { id: "trialDiameterOS", label: "Trial Diameter OS", type: "text" },
          { id: "fitOS", label: "Fit Assessment OS", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "pediatric",
    name: "Pediatric Eye Examination",
    description: "Eye examination for children",
    sections: [
      {
        id: "development",
        title: "Developmental History",
        fields: [
          { id: "age", label: "Age", type: "text" },
          { id: "birthHistory", label: "Birth History", type: "textarea" },
          { id: "developmental", label: "Developmental Milestones", type: "textarea" },
          { id: "schoolPerformance", label: "School Performance", type: "textarea" },
        ],
      },
      {
        id: "visual-function",
        title: "Visual Function",
        fields: [
          { id: "fixation", label: "Fixation", type: "text", placeholder: "Central, steady, maintained" },
          { id: "tracking", label: "Tracking", type: "text", placeholder: "Smooth pursuits" },
          { id: "stereopsis", label: "Stereopsis", type: "text", placeholder: "40 seconds of arc" },
          { id: "colorVision", label: "Color Vision", type: "text", placeholder: "Normal" },
        ],
      },
      {
        id: "binocular-vision",
        title: "Binocular Vision",
        fields: [
          { id: "coverTest", label: "Cover Test", type: "textarea" },
          { id: "nearPoint", label: "Near Point of Convergence", type: "text" },
          { id: "accommodation", label: "Accommodation", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "glaucoma-screening",
    name: "Glaucoma Screening",
    description: "Focused glaucoma assessment",
    sections: [
      {
        id: "risk-factors",
        title: "Risk Factors",
        fields: [
          { id: "familyHistory", label: "Family History", type: "checkbox" },
          { id: "age", label: "Age", type: "number" },
          { id: "ethnicity", label: "Ethnicity", type: "text" },
          { id: "myopia", label: "High Myopia", type: "checkbox" },
        ],
      },
      {
        id: "measurements",
        title: "Clinical Measurements",
        fields: [
          { id: "iopOD", label: "IOP OD (mmHg)", type: "number" },
          { id: "iopOS", label: "IOP OS (mmHg)", type: "number" },
          { id: "cctOD", label: "CCT OD (μm)", type: "number" },
          { id: "cctOS", label: "CCT OS (μm)", type: "number" },
          { id: "cdRatioOD", label: "C/D Ratio OD", type: "text", placeholder: "0.3" },
          { id: "cdRatioOS", label: "C/D Ratio OS", type: "text", placeholder: "0.3" },
        ],
      },
      {
        id: "assessment",
        title: "Assessment",
        fields: [
          { id: "visualField", label: "Visual Field Status", type: "textarea" },
          { id: "risk", label: "Risk Level", type: "select", options: ["Low", "Moderate", "High", "Glaucoma Suspect"] },
          { id: "recommendations", label: "Recommendations", type: "textarea" },
        ],
      },
    ],
  },
];
