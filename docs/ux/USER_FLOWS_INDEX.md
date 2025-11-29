# ILS 2.0 User Flows Documentation

**Created:** November 29, 2025  
**Status:** Active Development  
**Purpose:** Map all critical user journeys to improve UX and prevent errors

---

## What Are User Flows?

User flows are **visual diagrams** showing the precise steps users take through our application. They include:
- ✅ Decision points
- ✅ User actions
- ✅ System responses
- ✅ Error states
- ✅ Alternative paths

---

## Why We're Creating These

### Problems We're Solving:
1. **Current errors** (e.g., "Failed to fetch learning progress" - AI Assistant)
2. **Unclear user journeys** leading to support tickets
3. **Missing error states** causing 500 errors
4. **Inconsistent navigation** across dashboards
5. **Edge cases** not handled in code

### Benefits:
- ✅ **Prevent bugs** before they happen
- ✅ **Better collaboration** between design and development
- ✅ **Clearer onboarding** for new users
- ✅ **Faster feature development** with clear specs
- ✅ **Improved user satisfaction** through better UX

---

## User Flow Library

### 🔴 Critical Flows (Must Fix/Document First)
1. [AI Assistant Interaction](./flows/01_ai_assistant_interaction.md) - **BROKEN - 500 error**
2. [ECP Eye Examination](./flows/02_ecp_eye_examination.md) - **Core workflow**
3. [Order Placement & Lab Routing](./flows/03_order_placement.md) - **Revenue critical**
4. [Patient Check-in & Registration](./flows/04_patient_checkin.md) - **Entry point**

### 🟡 High Priority Flows
5. [Lab Order Processing](./flows/05_lab_order_processing.md)
6. [Contact Lens Fitting Workflow](./flows/06_contact_lens_fitting.md)
7. [Prescription Management](./flows/07_prescription_management.md)
8. [Dispenser Frame Selection](./flows/08_dispenser_frame_selection.md)

### 🟢 Standard Flows
9. [User Authentication & Login](./flows/09_user_authentication.md)
10. [Dashboard Navigation (Role-based)](./flows/10_dashboard_navigation.md)
11. [Appointment Scheduling](./flows/11_appointment_scheduling.md)
12. [Inventory Management](./flows/12_inventory_management.md)
13. [Recall & Reminder System](./flows/13_recall_reminders.md)
14. [Billing & Claims Processing](./flows/14_billing_claims.md)
15. [Supplier Order Management](./flows/15_supplier_orders.md)

---

## Flow Diagram Legend

### Shape Conventions:
```
┌─────────────┐
│   SCREEN    │  Rectangle = Screen/Page
└─────────────┘

    ◇ ACTION    Diamond = User Action/Decision

    → FLOW      Arrow = Direction of flow

┌─────────────┐
│   ERROR     │  Red Rectangle = Error State
└─────────────┘

┌─────────────┐
│  SUCCESS    │  Green Rectangle = Success State
└─────────────┘

    ((API))     Double Parentheses = External System Call

    [?]         Question = Decision Point
```

### Color Coding:
- 🔴 **Red** = Error states, blockers, critical issues
- 🟡 **Yellow** = Warnings, optional paths, edge cases
- 🟢 **Green** = Success states, happy paths
- 🔵 **Blue** = Information, loading states
- ⚫ **Black** = Standard flow, neutral actions

---

## Flow Documentation Template

Each user flow document includes:

1. **Flow Overview**
   - User role(s)
   - Entry point(s)
   - Main objective
   - Success criteria

2. **Prerequisites**
   - Required permissions
   - Required data
   - System state

3. **Main Path (Happy Path)**
   - Step-by-step flow
   - Visual diagram
   - Expected outcomes

4. **Alternative Paths**
   - Optional branches
   - Different user choices
   - Edge cases

5. **Error States**
   - What can go wrong
   - Error messages
   - Recovery paths

6. **API Calls & Database Operations**
   - External dependencies
   - Data requirements
   - Performance considerations

7. **Implementation Status**
   - ✅ Complete
   - 🚧 In Progress
   - ❌ Broken
   - 📝 Planned

---

## How to Use These Flows

### For Developers:
1. **Before coding**: Review flow to understand all states
2. **During coding**: Check off each step as implemented
3. **Testing**: Use flow as test case template
4. **Bug fixes**: Update flow if behavior changes

### For Designers:
1. **Feature planning**: Create flow before wireframes
2. **User research**: Validate flows with real users
3. **Usability testing**: Test each path
4. **Iteration**: Update flows based on feedback

### For Product/Business:
1. **Feature requests**: Start with user flow
2. **Stakeholder reviews**: Use flows to communicate features
3. **Training**: Teach staff using documented flows
4. **Support**: Reference flows for troubleshooting

---

## Maintenance

### When to Update:
- ✅ Adding new features
- ✅ Fixing bugs that change flow
- ✅ User feedback reveals confusion
- ✅ Support tickets indicate flow issues
- ✅ Analytics show drop-off points

### Review Cadence:
- **Critical flows**: Weekly during active development
- **High priority**: Bi-weekly
- **Standard flows**: Monthly
- **Full audit**: Quarterly

---

## Quick Start

1. **Choose a flow** from the library above
2. **Open the markdown file** in the `flows/` directory
3. **Review the diagram** and steps
4. **Identify gaps** or errors
5. **Update as needed** or create issue

---

## Contributing

When creating a new user flow:

1. Copy the template: `flows/_TEMPLATE.md`
2. Follow naming convention: `##_flow_name.md`
3. Update this index with link
4. Include ASCII diagram or link to Figma
5. Test the flow with real users if possible
6. Get approval from UX lead before implementing

---

## Related Documentation

- [UX Design Principles](../UX_DESIGN_PRINCIPLES.md)
- [Information Architecture](../INFORMATION_ARCHITECTURE.md)
- [API Documentation](../../API.md)
- [Database Schema](../../shared/schema.ts)
- [Component Library](../../client/src/components/README.md)

---

## Questions or Feedback?

- Create an issue with label `ux-flow`
- Tag @ux-team in Slack
- Email: ux@newvantageco.com

---

**Last Updated:** November 29, 2025  
**Next Review:** December 6, 2025
