"""
Knowledge Base Seeder
Seeds the database with ophthalmic and dispensing domain knowledge
"""

import asyncio
import sys
from typing import List, Dict
import uuid

from services.database import get_db, AIKnowledgeBase
from services.llm_service import llm_service
from utils.logger import logger
from config import settings


# ================================
# Ophthalmic Knowledge Base
# ================================

OPHTHALMIC_KNOWLEDGE = [
    # Lens Types
    {
        "category": "ophthalmic",
        "tags": ["lens-types", "single-vision"],
        "content": """Single Vision Lenses: Correct vision at one distance (near or far). Most common type of lens.

Key Features:
- Corrects myopia (nearsightedness) or hyperopia (farsightedness)
- Can also correct astigmatism when combined with cylinder power
- Simplest lens design with consistent power across entire lens
- Available in all lens materials and coatings
- Most affordable option

Best For:
- Patients with only distance or near vision correction needs
- Reading glasses for presbyopia
- Computer glasses for specific working distances
- Sports and safety glasses

Fitting Guidelines:
- Standard fitting measurements required: PD (pupillary distance)
- Frame selection relatively flexible
- Consider patient's primary usage when determining lens material""",
    },
    {
        "category": "ophthalmic",
        "tags": ["lens-types", "progressive"],
        "content": """Progressive Lenses: Multifocal lenses with gradual power change from distance to near vision without visible lines.

Key Features:
- Seamless transition between distance, intermediate, and near zones
- No visible bifocal lines - cosmetically appealing
- Wide intermediate zone for computer work
- Modern designs minimize peripheral distortion
- Adaptation period of 1-2 weeks typical

Zones:
- Distance zone (top): For far vision, driving
- Intermediate zone (middle): Computer work, dashboard
- Near zone (bottom): Reading, phone use
- Peripheral zones: Some distortion, not for critical viewing

Best For:
- Presbyopic patients (typically 40+)
- Patients wanting single pair for all distances
- Professional environments where appearance matters
- Active lifestyles requiring multiple vision zones

Fitting Guidelines:
- Precise measurements critical: seg height, PD, vertex distance, pantoscopic tilt
- Frame selection important: minimum B measurement of 30mm recommended
- Patient counseling on adaptation essential
- Follow-up appointments recommended""",
    },
    {
        "category": "ophthalmic",
        "tags": ["lens-types", "bifocal"],
        "content": """Bifocal Lenses: Two distinct optical powers - distance on top, near on bottom, separated by visible line.

Key Features:
- Clear separation between distance and near zones
- Visible segment line
- Quick adaptation - usually immediate
- No intermediate zone (unlike progressives)
- More affordable than progressives

Common Segment Types:
- Flat-top 28 (FT-28): Most popular, 28mm wide reading area
- Flat-top 35 (FT-35): Wider reading area for extensive near work
- Round segment: Traditional design, less common today
- Executive: Full width reading segment, line across entire lens

Best For:
- Patients who primarily need distance and near vision only
- Those who tried progressives and couldn't adapt
- Budget-conscious patients
- Occupations with minimal intermediate work

Fitting Guidelines:
- Segment height: typically at lower lid or slightly above
- PD measurement required
- Consider occupational needs when choosing segment style
- Less critical frame requirements than progressives""",
    },
    {
        "category": "ophthalmic",
        "tags": ["lens-materials", "polycarbonate"],
        "content": """Polycarbonate Lenses: Impact-resistant, lightweight lens material. Industry standard for safety and children's eyewear.

Key Properties:
- Impact resistance: 10x more than standard plastic
- UV protection: 100% UVA and UVB built-in
- Thin and light: Index of refraction 1.586
- Abbe value: 30 (some chromatic aberration)
- Soft material: Requires scratch-resistant coating

Advantages:
- Excellent safety protection
- Lightweight comfort
- Built-in UV protection
- Thinner than standard plastic (CR-39)
- Ideal for rimless and semi-rimless frames

Best For:
- Children's eyewear (recommended or required)
- Safety glasses and sports eyewear
- High-activity lifestyles
- Rimless and semi-rimless frames
- Strong prescriptions where weight is concern

Not Ideal For:
- Patients very sensitive to chromatic aberration
- Situations requiring absolute optical clarity (consider hi-index instead)

Fitting Guidelines:
- Always include scratch-resistant coating
- Anti-reflective coating highly recommended
- Good choice for most prescriptions
- Explain UV protection benefit to patients""",
    },
    {
        "category": "ophthalmic",
        "tags": ["lens-materials", "high-index"],
        "content": """High-Index Lenses: Thinner, lighter lenses for stronger prescriptions. Higher refractive index means less material needed.

Index Options:
- 1.67 Index: 20-30% thinner than standard plastic
- 1.74 Index: Thinnest available, 35-40% thinner than standard
- 1.60 Index: Entry-level high-index, moderate thinning

Key Properties:
- Higher refractive index = thinner lenses
- Lighter weight for comfort
- Built-in UV protection
- Better abbe values than polycarbonate (less aberration)
- More expensive than standard materials

Advantages:
- Significantly thinner edges (minus prescriptions) or centers (plus prescriptions)
- Reduced "coke bottle" appearance
- Lighter weight reduces nose pad pressure
- Better cosmetics in any frame
- Excellent optical clarity

Best For:
- Strong prescriptions (over ±3.00)
- Fashion frames where lens thickness would be visible
- Patients wanting thinnest possible lenses
- Reducing weight for comfort
- Professional appearance

Recommendations by Prescription:
- ±3.00 to ±4.00: Consider 1.67 index
- ±4.00 to ±6.00: Recommend 1.67 index
- Over ±6.00: Strongly recommend 1.74 index

Fitting Guidelines:
- Anti-reflective coating essential (more back-surface reflections)
- Frame selection important: smaller frames = thinner lenses
- Educate on cost-benefit for strong prescriptions
- Measure PD accurately to center lenses properly""",
    },
    {
        "category": "ophthalmic",
        "tags": ["coatings", "anti-reflective"],
        "content": """Anti-Reflective (AR) Coating: Eliminates reflections from lens surfaces, improving vision quality and appearance.

Key Benefits:
- Reduces glare from lights, especially at night
- Improves light transmission (up to 99.5% vs 92% uncoated)
- Eliminates distracting reflections on lens surface
- Better appearance (eyes visible in photos, video calls)
- Reduces eye strain, especially for computer use

How It Works:
- Multi-layer coating (typically 5-9 layers)
- Creates destructive interference with reflected light
- Applied to both front and back lens surfaces
- Often includes scratch-resistant and hydrophobic layers

Premium AR Features:
- Oleophobic (lipophobic): Repels skin oils and fingerprints
- Hydrophobic: Water beads up and rolls off
- Easier cleaning and maintenance
- Superior durability
- Reduced dust attraction

Best For:
- Night driving (reduces headlight glare)
- Computer users (reduces screen glare)
- High-index lenses (more reflections without AR)
- Professional environments
- Anyone wanting best visual clarity

Essential For:
- Progressive lenses
- High-index lenses
- Aspheric lens designs
- Digital device users

Care Instructions:
- Clean with microfiber cloth and lens cleaner
- Avoid paper towels or clothing
- Rinse with water before wiping
- Don't use household cleaners
- Store in protective case""",
    },
    {
        "category": "ophthalmic",
        "tags": ["coatings", "blue-light"],
        "content": """Blue Light Blocking Coatings: Filter high-energy visible (HEV) blue light from digital devices and LED lighting.

What is Blue Light:
- Wavelength: 380-500nm (violet to blue)
- Sources: Digital screens, LED lights, sunlight
- Concerns: Eye strain, sleep disruption, potential retinal damage
- Natural exposure vs. digital device exposure

Coating Features:
- Filters 20-50% of blue light depending on product
- Selective filtering: Blocks harmful blue, allows beneficial wavelengths
- May have slight yellow tint (minimal in premium coatings)
- Often combined with anti-reflective coating

Benefits:
- Reduced digital eye strain
- Less disruption to sleep patterns (especially evening use)
- Decreased glare from digital screens
- Potential long-term retinal protection
- Relief from symptoms: dry eyes, headaches, eye fatigue

Best For:
- Heavy digital device users (6+ hours/day)
- Evening computer or phone use
- Gaming enthusiasts
- Office workers
- Students with extensive screen time

Considerations:
- Not a substitute for proper ergonomics and breaks
- Follow 20-20-20 rule: Every 20 min, look 20 ft away for 20 sec
- May have slight color tint (cosmetic consideration)
- More beneficial than blue light filtering alone

Patient Education:
- Set realistic expectations
- Emphasize as part of overall digital wellness
- Recommend proper screen habits
- Consider for children and teens (growing eyes)""",
    },
    {
        "category": "ophthalmic",
        "tags": ["coatings", "photochromic"],
        "content": """Photochromic Lenses (Transitions): Automatically darken in sunlight, clear indoors. Adaptive lenses for convenience.

How They Work:
- UV light activates photochromic molecules in lens
- Darken in 30-60 seconds when exposed to UV
- Fade back to clear in 2-5 minutes indoors
- Temperature dependent: Darker in cold, lighter in heat
- Available in multiple colors

Popular Brands:
- Transitions Signature: Most popular, moderate activation
- Transitions XTRActive: Darkest option, activates behind windshield
- Transitions Vantage: Variable polarization feature
- PhotoFusion (Zeiss): Fast activation and fade-back

Color Options:
- Gray: Neutral, true color perception
- Brown: Enhances contrast, warmer tone
- Green: Good for golf, outdoor activities
- Other colors: Fashion and lifestyle options

Advantages:
- Convenience: No need to switch between glasses and sunglasses
- 100% UV protection always
- Reduced squinting and eye strain outdoors
- Cost-effective vs. buying separate sunglasses
- Continuous eye protection

Limitations:
- Don't darken well in car (windshield blocks UV)
- Temperature affects performance
- Not as dark as dedicated sunglasses
- Take time to fade back indoors
- Won't activate under artificial light

Best For:
- Patients frequently moving between indoor/outdoor
- Those who forget or lose sunglasses
- Outdoor enthusiasts
- Light-sensitive patients
- Convenience-focused lifestyles

Not Ideal For:
- Professional drivers (consider XTRActive)
- Patients wanting very dark sunglasses
- Those needing instant clear-to-dark transition

Patient Counseling:
- Explain activation/fade times
- Discuss temperature effects
- Set expectations for in-car performance
- Recommend keeping dedicated sunglasses for driving
- Emphasize UV protection benefit""",
    },
    {
        "category": "dispensing",
        "tags": ["fitting", "measurements"],
        "content": """Essential Eyeglass Measurements: Critical measurements for proper lens fitting and optimal vision.

Pupillary Distance (PD):
- Distance between pupils in millimeters
- Single PD (binocular): One measurement for both eyes
- Dual PD (monocular): Separate right and left measurements
- Distance PD: For distance vision (typically used)
- Near PD: For reading glasses (typically 3mm less than distance)
- Average adult: 54-74mm
- Measure with pupilometer or PD ruler
- Accuracy critical: ±0.5mm for single vision, ±0.25mm for progressives

Optical Center Height (OCH) / Segment Height:
- Vertical position of optical center or reading segment
- Measured from bottom of lens to pupil center
- Single vision: Typically centered at pupil
- Progressives: 3-5mm above pupil (varies by design)
- Bifocals: At or slightly above lower lid
- Critical for progressive lens performance

Vertex Distance:
- Distance from back of lens to front of eye
- Standard: 12-14mm
- Critical for strong prescriptions (over ±4.00)
- Affects effective power patient experiences
- Measured during refraction, should match in glasses
- Affects lens calculations

Pantoscopic Tilt:
- Forward tilt of frame front (top to bottom)
- Optimal: 8-12 degrees
- Too much: Can cause distance blur in progressives
- Too little: Can cause near blur in progressives
- Adjust nose pads or temple angle to optimize

Face Form (Wrap Angle):
- Horizontal curve of frame around face
- Fashion frames: 0-10 degrees
- Sport frames: 10-20+ degrees
- Affects peripheral vision and optical performance
- May require compensation in lens design

Frame Measurements:
- A: Lens width (horizontal)
- B: Lens height (vertical)
- DBL: Distance between lenses (bridge)
- Temple length
- Important for progressive lens selection (minimum B measurement)

Measurement Best Practices:
- Patient looking straight ahead at eye level
- Frame properly adjusted before measuring
- Use precision tools (pupilometer, frame ruler)
- Document all measurements clearly
- Verify measurements before ordering
- Explain importance to patient""",
    },
    {
        "category": "dispensing",
        "tags": ["prescription", "interpretation"],
        "content": """Prescription Interpretation: Understanding and reading eyeglass prescriptions accurately.

Prescription Components:
- OD: Oculus Dexter (Right Eye)
- OS: Oculus Sinister (Left Eye)
- OU: Oculus Uterque (Both Eyes)

Sphere (SPH):
- Spherical correction for myopia or hyperopia
- Minus (-): Nearsighted (myopia)
- Plus (+): Farsighted (hyperopia)
- Range: Typically -20.00 to +20.00
- Written in 0.25D increments

Cylinder (CYL):
- Astigmatism correction
- Always minus (-) in minus cylinder form
- Can be plus (+) in plus cylinder form
- Indicates amount of astigmatism
- Written in 0.25D increments

Axis:
- Direction of astigmatism correction
- Range: 1 to 180 degrees
- Must have cylinder to have axis
- 90° = vertical, 180° = horizontal
- Must be written with cylinder

Add (Addition):
- Near vision power for presbyopia
- Always plus (+) power
- Added to distance sphere for near vision
- Range: Typically +0.75 to +3.00
- Same for both eyes (usually)
- Indicates patient needs multifocal

Prism:
- Corrects eye alignment issues
- Measured in prism diopters (Δ or pd)
- Base direction: BU (base up), BD (base down), BI (base in), BO (base out)
- Format: "2Δ BU" means 2 prism diopters, base up
- Less common, requires careful verification

Pupillary Distance (PD):
- Distance between pupils
- Single number (binocular): e.g., "63"
- Two numbers (monocular): e.g., "31/32"
- Essential for lens fabrication

Example Prescription:
OD: -2.50 -0.75 x 180 Add +2.00
OS: -2.25 -0.50 x 175 Add +2.00
PD: 63mm

Interpretation:
- Right eye: Moderate myopia with slight astigmatism at 180°
- Left eye: Similar but slightly less myopia and astigmatism
- Add power: Presbyopic correction needed
- This patient needs progressives or bifocals

Red Flags / Verification:
- Axis without cylinder (error)
- Cylinder without axis (incomplete)
- Unusual prism amounts (verify with prescriber)
- Very different powers between eyes (anisometropia - verify)
- Expired prescription (typically valid 1-2 years)

Strong Prescriptions:
- High myopia: Over -6.00
- High hyperopia: Over +4.00
- High astigmatism: Over -2.00
- Consider special lens designs and materials

Patient Communication:
- Explain prescription in simple terms
- Describe how lenses will help their vision
- Set expectations for adaptation if prescription changed
- Discuss lens options appropriate for prescription
- Address concerns about lens thickness""",
    },
    {
        "category": "dispensing",
        "tags": ["patient-counseling", "progressive-adaptation"],
        "content": """Progressive Lens Patient Counseling: Setting expectations and ensuring successful adaptation.

Pre-Dispensing Education:
- Explain progressive lens design and zones
- Set realistic expectations for adaptation period
- Discuss head movement technique
- Show sample lenses if possible
- Emphasize importance of proper frame adjustment

How to Use Progressive Lenses:
- Distance: Look straight ahead through top portion
- Intermediate: Lower eyes slightly, keep head up
- Near: Lower eyes more, may tilt head slightly back
- Avoid looking through peripheral areas
- Move head rather than just eyes for side-to-side viewing

Adaptation Timeline:
- First few hours: Noticeable distortion, careful with stairs
- First few days: Significant improvement, some challenges remain
- One week: Most patients comfortable for daily activities
- Two weeks: Full adaptation for most patients
- Some patients: May take up to 30 days

Common Initial Challenges:
- Peripheral "swim" sensation
- Difficulty with stairs (look straight down)
- Side-to-side distortion
- Finding the "sweet spot" for reading
- Computer viewing at intermediate zone

Tips for Success:
- Wear progressives full-time during adaptation
- Don't switch back and forth with old glasses
- Practice at home in safe environment
- Use hand rail on stairs initially
- Be extra careful with steps and curbs
- Give yourself extra time for new activities

Frame Adjustment Critical:
- Proper pantoscopic tilt (8-12°)
- Correct vertex distance
- Comfortable, secure fit
- No sliding down nose
- Even on face

When to Return for Adjustment:
- Frame feels uncomfortable or slides
- Can't find comfortable reading position
- Persistent blurry areas
- Headaches or eyestrain after one week
- Any concerns about vision

Troubleshooting:
- Reading area too low: Frame may have slipped - adjust
- Distance blurry: Check pantoscopic tilt
- Can't find reading zone: May need segment height adjustment
- Peripheral distortion excessive: Verify measurements, consider lens design change

Second Pair Recommendations:
- Computer glasses for extensive desk work
- Reading glasses for prolonged near work
- Task-specific glasses reduce need for adaptation
- Still recommend progressives as primary pair

Follow-up Schedule:
- Check-in after first week (phone or in-person)
- Two-week follow-up if any concerns
- Remind patient: Can adjust or remake if needed
- Document adaptation progress

Setting Proper Expectations:
- Be honest about adaptation period
- Explain that some activities may require practice
- Emphasize benefits once adapted
- Offer guarantee/warranty period
- Provide contact information for questions

Success Factors:
- Accurate measurements
- Proper frame selection
- Quality progressive lens design
- Precise fitting and adjustment
- Patient education and support
- Follow-up care""",
    },
    {
        "category": "business",
        "tags": ["inventory", "management"],
        "content": """Optical Inventory Management: Best practices for managing lens and frame inventory efficiently.

Frame Inventory Optimization:
- ABC Analysis: Classify frames by sales velocity
  - A items: Top 20% - Fast movers, keep well-stocked
  - B items: Middle 30% - Moderate movers, standard stock
  - C items: Bottom 50% - Slow movers, minimal stock
- Par Levels: Set minimum/maximum quantities for each item
- Reorder Points: Trigger reorders before stockouts
- Seasonal Adjustments: Increase stock before busy seasons

Lens Inventory:
- Stock Lenses: Common powers in popular materials
  - Single vision: ±2.00 range, basic materials
  - Reduce wait time for basic prescriptions
  - Balance stock vs. custom benefits
- Semi-Finished Blanks: For in-house lab if applicable
- Lens Supplier Management: Reliable relationships critical

Inventory Metrics:
- Inventory Turnover Ratio: Sales / Average Inventory
  - Target: 2-4 times per year for frames
  - Higher turnover = better cash flow
- Days Sales in Inventory: (Inventory / Sales) × 365
  - Target: 90-180 days for optical
- Stockout Rate: Percentage of time items unavailable
  - Target: <5% for popular items

Dead Stock Management:
- Identify: Not sold in 12+ months
- Actions:
  - Discount promotions
  - Staff purchases
  - Return to vendor if possible
  - Donate for tax benefit
- Prevention: Better buying decisions, track aging

Pricing Strategies:
- Cost-Plus: Inventory cost × markup percentage
  - Typical optical markup: 2-3x wholesale
- Competitive Pricing: Match or slightly under competitors
- Value-Based: Price based on perceived value
- Bundle Pricing: Package lenses + coatings + services

Vendor Management:
- Consolidate Suppliers: Better pricing, easier management
- Negotiate Terms: Payment terms, return policies
- Build Relationships: Priority service, favorable terms
- Backup Suppliers: Risk mitigation

Technology Solutions:
- Inventory Management Software: Real-time tracking
- Integrated with POS: Automatic updates
- Reporting: Sales trends, aging, reorder needs
- Barcode/RFID: Efficient tracking and auditing

Inventory Audits:
- Cycle Counts: Regular partial counts
- Annual Physical Inventory: Complete count
- Variance Investigation: Understand discrepancies
- Shrinkage Control: Prevent theft and loss

Financial Management:
- Inventory as Asset: Balance sheet impact
- Cash Flow: Don't over-invest in slow movers
- Credit Lines: Manage seasonal cash needs
- Insurance: Protect against loss/damage

Key Performance Indicators:
- Gross Margin: (Sales - COGS) / Sales × 100
  - Target: 50-70% for optical
- Inventory Investment: Total $ in inventory
  - Minimize while maintaining service level
- Product Mix: Balance between categories
  - Frames, lenses, coatings, accessories

Best Practices:
- Regular review of sales data
- Adjust buying based on trends
- Clear slow-moving inventory promptly
- Maintain optimal stock levels
- Strong vendor relationships
- Use technology effectively
- Train staff on product knowledge
- Monitor competition""",
    },
    {
        "category": "business",
        "tags": ["sales", "patient-retention"],
        "content": """Patient Retention Strategies: Building long-term relationships and maximizing patient lifetime value.

Why Retention Matters:
- 5x more expensive to acquire new patient than retain existing
- Retained patients spend 67% more than new patients
- Loyal patients provide referrals
- Predictable revenue stream
- Higher profit margins

Patient Experience Excellence:
- First Impression: Friendly greeting, clean environment
- Wait Time: Minimize and communicate delays
- Attention: Active listening, show genuine interest
- Professionalism: Knowledgeable staff, smooth processes
- Follow-up: Post-purchase contact, care instructions

Communication Strategies:
- Appointment Reminders: Email, text, phone
- Annual Exam Reminders: Proactive outreach
- Special Occasions: Birthday, anniversary discounts
- New Products: Inform about latest offerings
- Educational Content: Tips, trends, eye health
- Preferred Communication: Ask patient preference

Loyalty Programs:
- Point Systems: Earn points for purchases, referrals
- Tiered Benefits: Silver, Gold, Platinum levels
- Exclusive Offers: Member-only sales and events
- Referral Rewards: Incentivize word-of-mouth
- Birthday/Anniversary Specials: Personal touch

Service Recovery:
- Address Issues Promptly: Don't delay
- Listen and Empathize: Understand patient frustration
- Take Ownership: Don't make excuses
- Offer Solutions: Fix the problem
- Follow-up: Ensure satisfaction
- Learn: Prevent similar issues

Value-Added Services:
- Free Adjustments: Lifetime for purchases
- Free Cleanings: Encourage regular visits
- Protection Plans: Comprehensive coverage
- Warranty: Beyond standard coverage
- Convenient Services: Online ordering, home delivery

Patient Education:
- Lens Options: Help understand choices
- Care Instructions: Proper cleaning and storage
- Eye Health: Warning signs, prevention
- Fashion Advice: Frame selection, styling
- Value Communication: Why quality matters

Recall Programs:
- Annual Eye Exam: Critical for health and retention
- Two-Year Eyewear Replacement: Natural replacement cycle
- Seasonal Promotions: Spring, back-to-school
- Spare Pair: Second pair promotions
- Lens Technology Updates: New coatings, materials

Personalization:
- Remember Preferences: Frame styles, colors
- Purchase History: Suggest relevant products
- Family Information: Brothers, kids, spouse
- Special Needs: Accommodations, preferences
- Personal Details: Hobbies, occupation

Digital Engagement:
- Email Marketing: Regular but not excessive
- Social Media: Engaging content, community building
- Online Reviews: Encourage and respond
- Patient Portal: Convenient access to records
- Mobile App: If available, add value

Metrics to Track:
- Patient Retention Rate: (Returning / Total) × 100
  - Target: 60-80% annual retention
- Patient Lifetime Value: Total revenue per patient
  - Track and work to increase
- Net Promoter Score: Likelihood to recommend
  - Survey and act on feedback
- Average Purchase Frequency: Times per year
  - Encourage multiple visits
- Referral Rate: New patients from existing
  - Goal: 20-30% of new patients

Staff Training:
- Product Knowledge: Expert recommendations
- Customer Service: Exceptional interactions
- Sales Skills: Consultative approach
- Problem Solving: Handle issues effectively
- Brand Ambassadors: Represent practice well

Competitive Advantages:
- Superior Service: Can't be easily copied
- Relationships: Personal connections
- Expertise: Trusted advisor status
- Convenience: Location, hours, services
- Value: Not just price, total experience

Red Flags (Patient Might Leave):
- Complaints Not Resolved: Address immediately
- Long Time Since Visit: Proactive outreach
- Negative Reviews: Respond and improve
- Shortened Visits: May indicate dissatisfaction
- Price Shopping: Emphasize value, not just cost

Recovery Strategies:
- Win-Back Campaigns: Special offers for lapsed patients
- Exit Surveys: Understand why they left
- Service Improvements: Address common issues
- Re-engagement: Remind of benefits
- Personal Outreach: Direct contact from optician/owner

Building Community:
- Local Involvement: Sponsor events, teams
- Charity Partnerships: Give back programs
- Educational Seminars: Eye health topics
- Open Houses: Showcase practice
- Social Events: Patient appreciation

Long-term Success:
- Consistent Quality: Every visit, every time
- Continuous Improvement: Always getting better
- Patient-Centric: Focus on their needs
- Value Delivery: Exceed expectations
- Relationship Building: Beyond transactions""",
    },
]


# ================================
# Seeder Function
# ================================

async def seed_knowledge_base(company_id: str = None):
    """
    Seed the knowledge base with ophthalmic and dispensing knowledge.

    Args:
        company_id: Optional company ID. If not provided, will use a default.
    """
    if not company_id:
        # Use a default "system" company ID for platform-wide knowledge
        company_id = "00000000-0000-0000-0000-000000000000"

    logger.info(f"Starting knowledge base seeding for company {company_id}")
    logger.info(f"Total knowledge entries to seed: {len(OPHTHALMIC_KNOWLEDGE)}")

    try:
        seeded_count = 0
        failed_count = 0

        for idx, knowledge in enumerate(OPHTHALMIC_KNOWLEDGE, 1):
            try:
                logger.info(f"Seeding entry {idx}/{len(OPHTHALMIC_KNOWLEDGE)}: {knowledge['category']} - {knowledge['tags']}")

                # Generate embedding
                embeddings = await llm_service.generate_embeddings([knowledge["content"]])
                embedding = embeddings[0]

                # Generate summary (first 200 chars)
                summary = knowledge["content"][:200] + "..." if len(knowledge["content"]) > 200 else knowledge["content"]

                async with get_db() as session:
                    # Create knowledge entry
                    kb_entry = AIKnowledgeBase(
                        companyId=uuid.UUID(company_id),
                        content=knowledge["content"],
                        summary=summary,
                        category=knowledge["category"],
                        tags=knowledge["tags"],
                        embedding=embedding,
                        filename=f"seed_{knowledge['category']}_{idx}",
                        isActive=True,
                        processingStatus="completed",
                    )

                    session.add(kb_entry)
                    await session.commit()

                seeded_count += 1
                logger.info(f"✓ Successfully seeded entry {idx}")

            except Exception as e:
                failed_count += 1
                logger.error(f"✗ Failed to seed entry {idx}: {e}")
                continue

        logger.info(f"Knowledge base seeding completed!")
        logger.info(f"Successfully seeded: {seeded_count}")
        logger.info(f"Failed: {failed_count}")
        logger.info(f"Total: {len(OPHTHALMIC_KNOWLEDGE)}")

        return {
            "success": True,
            "seeded_count": seeded_count,
            "failed_count": failed_count,
            "total": len(OPHTHALMIC_KNOWLEDGE),
        }

    except Exception as e:
        logger.error(f"Knowledge base seeding failed: {e}")
        return {
            "success": False,
            "error": str(e),
        }


# ================================
# CLI
# ================================

async def main():
    """Main function for CLI usage."""
    import argparse

    parser = argparse.ArgumentParser(description="Seed ophthalmic knowledge base")
    parser.add_argument(
        "--company-id",
        type=str,
        help="Company ID to seed knowledge for (default: system-wide)",
        default=None,
    )

    args = parser.parse_args()

    # Initialize database
    from services.database import init_db
    await init_db()

    # Run seeder
    result = await seed_knowledge_base(company_id=args.company_id)

    if result["success"]:
        print(f"\n✅ Knowledge base seeded successfully!")
        print(f"   Seeded: {result['seeded_count']}/{result['total']}")
        if result['failed_count'] > 0:
            print(f"   ⚠️  Failed: {result['failed_count']}")
    else:
        print(f"\n❌ Knowledge base seeding failed: {result['error']}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
