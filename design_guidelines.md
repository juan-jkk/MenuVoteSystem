# MenuVote Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from productivity tools like Notion and Trello for clean organization, with e-commerce influences from Shopify for voting interactions. This balances the utility-focused nature of school administration with the engagement needs of student voting.

## Core Design Elements

### Color Palette
**Primary Colors:**
- Light mode: 220 85% 15% (deep navy blue)
- Dark mode: 220 85% 85% (light blue)

**Secondary Colors:**
- Success (approved items): 142 76% 36%
- Warning (pending votes): 38 92% 50%
- Error (rejected items): 0 84% 60%

**Background Colors:**
- Light mode: 0 0% 98% (warm white)
- Dark mode: 220 13% 9% (dark navy)

### Typography
**Font Family:** Inter via Google Fonts CDN
- Headings: 600-700 weight
- Body text: 400-500 weight
- UI elements: 500 weight

### Layout System
**Spacing Units:** Tailwind spacing of 2, 4, 6, and 8 units primarily
- Component padding: p-4, p-6
- Section margins: m-8
- Element spacing: gap-4, gap-6

### Component Library

**Navigation:**
- Clean sidebar for admin functions
- Top navigation bar with user profile and logout
- Breadcrumb navigation for deep pages

**Data Display:**
- Card-based layout for menu items with clear voting buttons
- Progress bars for vote tallies using rounded corners
- Badge system for item status (pending, approved, rejected)

**Forms:**
- Consistent form styling with proper focus states
- Clear validation feedback
- Submit buttons with loading states

**Voting Interface:**
- Large, accessible voting buttons with icons
- Real-time vote count displays
- Visual feedback for completed votes

## Visual Treatment

**Card Design:** Rounded corners (rounded-lg), subtle shadows, clean borders
**Buttons:** Primary actions use brand colors, secondary actions use outline variants
**Icons:** Heroicons library for consistency
**Gradients:** Subtle gradients on hero sections using primary color variations

## Layout Structure

**Admin Dashboard:**
- Three-column layout: sidebar navigation, main content, quick actions panel
- Data tables with sorting and filtering capabilities
- Modal overlays for item creation/editing

**Student Voting Interface:**
- Grid layout for menu items (responsive: 1 column mobile, 2-3 desktop)
- Fixed voting summary sidebar on desktop
- Mobile-first responsive design

**Results Display:**
- Bar charts and visual vote tallies
- Color-coded results by category
- Historical voting data in clean tables

## Images Section

**Hero Image:** Large hero banner (h-64 on desktop) featuring appetizing school meal imagery with overlay text and call-to-action buttons with blurred backgrounds (backdrop-blur-sm)

**Menu Item Images:** Square aspect ratio thumbnails (w-32 h-32) for each votable menu item, with placeholder food icons from Heroicons when actual photos unavailable

**Dashboard Graphics:** Simple illustrated icons for empty states and data visualization elements, maintaining the clean aesthetic throughout the interface