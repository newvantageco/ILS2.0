# Integrated Lens System (ILS) Design Guidelines

## Design Approach
**System:** Material Design with enterprise data focus
**Rationale:** This is a utility-focused, information-dense enterprise platform requiring clarity, efficiency, and professional presentation. Material Design provides robust patterns for forms, tables, and dashboards while maintaining modern aesthetics.

## Typography System

**Font Family:** Inter (via Google Fonts) for all UI elements
- Primary: Inter (400, 500, 600, 700 weights)
- Monospace: JetBrains Mono for technical data (Rx values, measurements)

**Type Scale:**
- Page Titles: 2xl (24px), font-semibold
- Section Headers: xl (20px), font-semibold
- Card/Panel Titles: lg (18px), font-medium
- Body Text: base (16px), font-normal
- Labels/Metadata: sm (14px), font-medium
- Technical Data: sm (14px), font-mono
- Helper Text: xs (12px), font-normal

## Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card margins: m-4
- Form field gaps: gap-4
- Grid gaps: gap-6

**Container Strategy:**
- Application shell: Full-width with fixed sidebar (w-64)
- Content area: max-w-7xl with px-6 to px-8
- Forms: max-w-4xl for optimal field width
- Data tables: Full-width within content area
- Modals: max-w-2xl to max-w-4xl based on complexity

## Core Component Library

### Navigation
**Sidebar Navigation (Primary):**
- Fixed left sidebar, full-height, w-64
- Logo/branding at top with p-6
- Role indicator badge below logo
- Navigation sections with dividers
- Active state: Full-width highlight with left border accent
- Icons from Heroicons (outline for inactive, solid for active)
- Collapsible sections for complex hierarchies

**Top Bar:**
- Fixed across top, h-16
- Right-aligned utilities: notifications bell, user profile dropdown, quick actions
- Breadcrumb navigation for deep pages (left-aligned)
- Role switcher if applicable

### Dashboard Components
**Stat Cards:**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Each card: Rounded-lg with subtle shadow, p-6
- Structure: Large number (text-3xl, font-bold), label below (text-sm), optional icon
- Trend indicators with directional arrows

**Data Tables:**
- Full-width within container, rounded-lg container with shadow
- Sticky header row with font-medium labels
- Alternating row treatment for readability
- Row hover state for interactivity
- Action column (right-aligned) with icon buttons
- Pagination controls at bottom-right
- Search/filter bar above table with gap-4 between controls

**Order Queue Workbench:**
- Split view: Filterable list (left 40%) + Detail panel (right 60%)
- List items: Compact cards with key info (order #, ECP, status badge, timestamp)
- Detail panel: Tabbed interface (Overview, Prescription, Frame Data, Production Log)
- Status workflow visualizer: Horizontal stepper component showing order progress

### Forms & Input
**Order Entry Form:**
- Multi-step wizard layout with progress indicator at top
- Steps: Patient Info → Prescription → Frame & Lens → Coating & Options → Review
- Each step: max-w-3xl, generous spacing (space-y-6)
- Field groups with clear section headers (text-lg, font-semibold, mb-4)
- Label above input pattern, required indicators with asterisk
- Inline validation messages below fields
- Navigation: Back/Next buttons at bottom-right, Save Draft at bottom-left

**Input Fields:**
- Standard height: h-10 for text inputs
- Rounded-md borders
- Focus rings for accessibility
- Prescription inputs: Grid layout (OD/OS rows, SPH/CYL/AXIS/ADD columns)
- Dropdowns: Full-width with chevron icon
- Radio/Checkbox groups: Vertical stack with gap-3

**Search & Filters:**
- Toolbar layout: Flex row with gap-4
- Search input with magnifying glass icon (left-aligned, flex-1)
- Filter dropdowns (fixed widths w-48 to w-64)
- Clear all filters button (text-sm, font-medium)

### Data Display
**Order Cards (ECP Portal):**
- Rounded-lg with shadow, p-6
- Header: Order number + status badge (right-aligned)
- Grid layout for key details (2-column on desktop)
- Timeline component showing order milestones
- Action buttons at bottom

**Prescription Display:**
- Table format with clear OD/OS row labels
- Monospace font for numerical values
- Add emphasis to non-zero values
- Frame measurements in separate section below

**Supplier Technical Data:**
- Accordion layout for material specs
- Document list with download icons
- Batch/lot tracking table with search

### Status & Feedback
**Status Badges:**
- Rounded-full, px-3, py-1, text-xs, font-semibold
- Visual distinction through styling patterns
- Position: Inline with headers or right-aligned in lists

**Notifications:**
- Toast style: Fixed top-right, slide-in animation
- Icon + message + close button layout
- Auto-dismiss after 5 seconds with progress bar

**Loading States:**
- Skeleton loaders for tables and cards
- Spinner for form submissions
- Progress bars for multi-step processes

### Modals & Overlays
**Confirmation Dialogs:**
- Centered overlay with backdrop blur
- max-w-md, rounded-lg, p-6
- Icon at top (centered), title, description, action buttons
- Primary action right-aligned, cancel left-aligned

**Detail Drawers:**
- Slide-in from right, w-96 to w-1/2
- Close button top-right
- Scrollable content area
- Fixed action footer if needed

## Images

**Dashboard Illustrations:**
- Empty state graphics for zero-order queue (centered, max-w-sm)
- No results found illustrations for filtered views
- Success confirmation graphics in modals

**User Avatars:**
- Circle format, w-10 h-10 for top bar, w-8 h-8 for lists
- Initials fallback for users without photos

**Technical Documentation:**
- Placeholder areas in supplier portal for spec sheet thumbnails
- PDF preview icons with document type indicators

## Animations
Use sparingly - only for essential feedback:
- Page transitions: Subtle fade-in
- Modal/drawer: Slide and fade
- Toast notifications: Slide from top
- Loading spinners: Rotation only
- No decorative animations