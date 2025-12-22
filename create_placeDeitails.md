# PlaceDetailPage - Complete Documentation

## 📋 Overview
This document provides comprehensive documentation for the Place Detail Page, including flow, endpoint integration, design architecture, and a strict prompt for recreation.

**Live URL Example**: `http://localhost:5173/places/693d905647a0b161dbdeef6f`

---

## 🔄 USER FLOW

### 1. Entry Point
User navigates from the Place List Page by clicking on any place card.

**Source**: `frontend/src/pages/PlaceListPage.tsx` (Line 71)
```tsx
<Link to={`/places/${place._id}`} key={place._id}>
  {/* Place card content */}
</Link>
```

### 2. Navigation
- React Router matches route: `/places/:id`
- Route defined in `App.tsx`: `<Route path="places/:id" element={<PlaceDetailPage />} />`

### 3. Component Mounting
- `PlaceDetailPage` component mounts
- Extracts `id` parameter from URL using `useParams()`

### 4. Data Fetching Flow
```
PlaceDetailPage Component
  ↓
usePlace(id) Hook
  ↓
React Query (TanStack Query)
  ↓
placeService.getPlaceById(id)
  ↓
apiClient.get(`/places/${id}`)
  ↓
Backend API: GET /api/places/{id}
```

### 5. Rendering States
- **Loading**: Animated spinner (blue border spinner)
- **Error**: Error message with "Back to Places" link
- **Success**: Full place details with tabs, gallery, and sidebar

---

## 🔌 API ENDPOINT INTEGRATION

### Base Configuration
**Base URL**: `http://localhost:5000/api`  
**File**: `frontend/src/api/client.ts`

```typescript
export const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});
```

### Endpoint Details
**Method**: `GET`  
**Path**: `/places/{id}`  
**Full URL**: `http://localhost:5000/api/places/693d905647a0b161dbdeef6f`

### Request Headers
```http
GET /api/places/693d905647a0b161dbdeef6f
Authorization: Bearer {accessToken}
Content-Type: application/json
```

### Response Structure
```json
{
  "success": true,
  "data": {
    "_id": "693d905647a0b161dbdeef6f",
    "name": "The Great Pyramid of Giza",
    "slug": "great-pyramid-giza",
    "type": "archaeological",
    "description": "The Great Pyramid of Giza is the oldest and largest of the pyramids...",
    "shortDescription": "Ancient wonder of the world",
    "province": "giza",
    "location": {
      "type": "Point",
      "coordinates": [31.1342, 29.9792],
      "address": "Al Haram, Nazlet El-Semman, Giza"
    },
    "address": "Al Haram, Nazlet El-Semman, Giza",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg"
    ],
    "category": "historical",
    "rating": 4.8,
    "reviewsCount": 1250,
    "viewsCount": 15234,
    "tags": ["ancient", "UNESCO", "pyramid", "wonder"],
    "ticketPrice": 200,
    "currency": "EGP",
    "openingHours": "8:00 AM - 5:00 PM",
    "phone": "+20 2 1234567",
    "website": "https://example.com",
    "email": "info@giza.gov.eg",
    "eventDate": null,
    "stars": 5,
    "amenities": ["WiFi", "Restaurant", "Parking", "Gift Shop"],
    "facilities": ["Restrooms", "Wheelchair Access", "Audio Guide"],
    "suggestedDuration": "2-3 hours",
    "bestTimeToVisit": "Morning",
    "reviews": [
      {
        "userName": "John Doe",
        "userAvatar": "https://avatar.com/john.jpg",
        "rating": 5,
        "title": "Amazing Experience",
        "comment": "Absolutely breathtaking! A must-visit...",
        "date": "2024-12-15T10:30:00Z",
        "helpful": 45
      }
    ],
    "tips": [
      {
        "text": "Arrive early to avoid crowds",
        "category": "timing"
      },
      {
        "text": "Bring sun protection and water",
        "category": "safety"
      }
    ]
  }
}
```

### Service Layer Implementation
**File**: `frontend/src/api/services/placeService.ts`

```typescript
export const placeService = {
    getPlaceById: async (id: string) => {
        const response = await apiClient.get<ApiResponse<Place>>(`/places/${id}`);
        return response.data;
    },
};
```

### React Query Hook
**File**: `frontend/src/hooks/queries/usePlaceQueries.ts`

```typescript
export const usePlace = (id: string) => {
    return useQuery({
        queryKey: ['places', id],
        queryFn: () => placeService.getPlaceById(id),
        enabled: !!id,
    });
};
```

---

## 🎨 DESIGN STRUCTURE

### Layout Overview
- **Background**: Gray-50 (light gray)
- **Container**: Max-width container with padding
- **Grid System**: 3-column grid on large screens (2/3 main + 1/3 sidebar)

### Component Breakdown

#### 1. Breadcrumb Navigation (Lines 35-45)
```
Background: White
Border: Bottom border
Layout: Horizontal flex with separators
```
**Structure**: Home / Places / {Place Name}

#### 2. Page Header (Lines 48-68)
**Elements**:
- H1: Place name (text-4xl, font-bold)
- Metadata row with:
  - ⭐ Rating + Views count
  - Type badge (blue pill, capitalized)
  - 📍 Address

#### 3. Photo Gallery (Lines 71-95)
**Grid Layout**: 4 columns, 400px height
- **Main Image**: 2x2 grid span (50% width, full height)
  - Click to select
  - Hover: scale-105 effect
- **Thumbnails**: 4 smaller images (1x1 grid each)
  - Click to change main image
  - Hover: scale-105 + darker overlay
- **Fallback**: Gray placeholder for missing images

#### 4. Main Content Area (Lines 98-371)
**Width**: 2/3 of layout on large screens

##### Tab Navigation (Lines 105-140)
Three tabs with active state highlighting:
1. **Overview** - About, facts, amenities, facilities, tags
2. **Details & Hours** - Operating details, contact info
3. **Reviews** - Rating breakdown, reviews list

**Active State**: 
- Blue text color
- Blue bottom border (2px)

##### Overview Tab Content (Lines 145-250)
- **About Section**: Full description paragraph
- **Quick Facts Grid**: 2 columns
  - 🎫 Admission price
  - ⏰ Opening hours
  - ⭐ Stars rating
  - 📅 Event date (conditional)
- **Amenities**: 2-column grid with green checkmarks
- **Facilities**: 2-column grid with blue bullets
- **Tags**: Wrapped flex layout with blue rounded pills

##### Details Tab Content (Lines 252-310)
- **Details Table**: Key-value rows with borders
  - Type, Hours, Price, Phone, Website, Email
  - Links for phone (tel:), website (external), email (mailto:)
- **Suggested Duration Box**: Blue background callout

##### Reviews Tab Content (Lines 312-370)
- **Header**: Review count + average rating
- **Rating Breakdown**: 5 to 1 stars with progress bars
- **Reviews List**: 
  - Avatar (12x12 rounded)
  - Name, date, star rating
  - Title (optional) + comment
  - Helpful button with count
- **Empty State**: Centered message if no reviews

#### 5. Sidebar (Lines 375-470)
**Width**: 1/3 of layout on large screens  
**Position**: Sticky (top-6)

##### Plan Your Visit Card (Lines 377-440)
- **Map Section**:
  - Mapbox static image (400x300@2x)
  - Fallback: 🗺️ emoji
  - Address text
  - Google Maps link
- **Contact Info**: Phone, Website, Email with icons
- **Action Buttons**:
  - "Book Now" (blue, filled)
  - "Save to Trip" (outlined)

##### Tips Box (Lines 442-470)
- **Background**: Gradient (amber-50 to orange-50)
- **Border**: Amber-200
- **Header**: 💡 + "Tips for Visiting"
- **Tips List**: Custom or 4 default tips with amber bullets

---

## 🎯 COLOR SCHEME

| Element | Color | Tailwind Class |
|---------|-------|----------------|
| Primary (CTA) | Blue-600 | `bg-blue-600` |
| Primary Hover | Blue-700 | `hover:bg-blue-700` |
| Background | Gray-50 | `bg-gray-50` |
| Cards | White | `bg-white` |
| Text Primary | Gray-900 | `text-gray-900` |
| Text Secondary | Gray-600 | `text-gray-600` |
| Borders | Gray-200 | `border-gray-200` |
| Accents | Amber-500/600 | `text-amber-600` |
| Success | Green-600 | `text-green-600` |
| Type Badge | Blue-100/800 | `bg-blue-100 text-blue-800` |

---

## 📱 RESPONSIVE BEHAVIOR

### Mobile (< 640px)
- Single column layout
- Photo gallery: Stacked vertically
- Tabs: Full width buttons
- Sidebar: Below main content

### Tablet (640px - 1024px)
- 2-column grids
- Photo gallery: 2x2 layout
- Tabs: Side by side
- Sidebar: Still below main content

### Desktop (> 1024px)
- 3-column layout (lg:grid-cols-3)
- Main content: 2/3 width (lg:col-span-2)
- Sidebar: 1/3 width, sticky
- Full photo gallery

---

## 🔧 STATE MANAGEMENT

### Component State
```typescript
const [selectedImage, setSelectedImage] = useState(0);
const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'details'>('overview');
```

### Server State (React Query)
```typescript
const { data, isLoading, error } = usePlace(id || '');
```

**Query Key**: `['places', id]`  
**Cache Time**: Default (5 minutes)  
**Stale Time**: Default (0 - immediate refetch)

---

## 📊 DATA FLOW DIAGRAM

```
User Clicks Place Card
        ↓
React Router Navigation (/places/:id)
        ↓
PlaceDetailPage Component Mounts
        ↓
useParams() → Extract ID
        ↓
usePlace(id) Hook
        ↓
React Query Cache Check
        ↓
[Cache Miss] → API Call
        ↓
axios GET /api/places/{id}
        ↓
Backend Response
        ↓
React Query Cache Update
        ↓
Component Re-render with Data
        ↓
User Interacts (Tabs, Images, Links)
```

---

## 🎬 INTERACTIONS

### User Actions
1. **Tab Switching**: Click tab button → Update `activeTab` state
2. **Image Selection**: Click thumbnail → Update `selectedImage` state
3. **External Links**: Click phone/email/website → Native browser action
4. **Navigation**: Click breadcrumb → React Router navigation
5. **Hover Effects**: Image scale, button color changes

### Animation Effects
- **Spinner**: Rotate animation during loading
- **Images**: Scale-105 on hover (300ms transition)
- **Overlay**: Opacity change on hover (300ms transition)
- **Buttons**: Background color change on hover

---

## 🧩 COMPONENT DEPENDENCIES

### Direct Imports
```typescript
import { useParams, Link } from 'react-router-dom';
import { usePlace } from '../hooks/queries/usePlaceQueries';
import { useState } from 'react';
```

### Type Dependencies
```typescript
interface Place {
  _id: string;
  name: string;
  slug: string;
  type?: string;
  description?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  images?: string[] | {url: string}[];
  rating?: number;
  viewsCount?: number;
  ticketPrice?: number;
  currency?: string;
  openingHours?: string;
  phone?: string;
  website?: string;
  email?: string;
  tags?: string[];
  amenities?: string[];
  facilities?: string[];
  reviews?: PlaceReview[];
  tips?: PlaceTip[];
  stars?: number;
  eventDate?: string;
  suggestedDuration?: string;
  reviewsCount?: number;
  address?: string;
}
```

---

## 🚀 STRICT RECREATION PROMPT

Use this prompt to recreate the PlaceDetailPage from scratch:

---

### **PROMPT: Create Place Detail Page Component**

#### **OBJECTIVE**
Build a fully functional, responsive place detail page for a tourism web application that displays comprehensive information about a single place/attraction.

---

#### **TECHNICAL SPECIFICATIONS**

**Route Configuration**:
- Route path: `/places/:id`
- Component: `PlaceDetailPage`
- Register in `App.tsx`: `<Route path="places/:id" element={<PlaceDetailPage />} />`

**API Integration**:
- Endpoint: `GET /api/places/{id}`
- Base URL: `http://localhost:5000/api`
- Response format: `{ success: boolean, data: Place }`
- Use React Query with `usePlace(id)` custom hook
- Extract ID from URL params using `useParams<{ id: string }>()`

**State Requirements**:
```typescript
const [selectedImage, setSelectedImage] = useState(0);
const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'details'>('overview');
```

---

#### **COMPONENT STRUCTURE**

##### **1. Loading & Error States**

**Loading State**:
```tsx
<div className="flex justify-center items-center min-h-[50vh]">
  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
</div>
```

**Error State**:
```tsx
<div className="container mx-auto px-4 py-8">
  <div className="text-center text-red-500">
    <h2 className="text-2xl font-bold mb-4">Place Not Found</h2>
    <Link to="/places" className="text-blue-600 hover:underline">
      ← Back to Places
    </Link>
  </div>
</div>
```

##### **2. Page Layout**

**Container**:
- Full-height viewport (`min-h-screen`)
- Background: `bg-gray-50`

**Breadcrumb Section**:
- White background with bottom border
- Navigation: Home / Places / {Place Name}
- Use `Link` components for navigation
- Text size: `text-sm`
- Separators: Gray-400 "/"

**Header Section**:
- H1: Place name (`text-4xl font-bold mb-3`)
- Metadata row (flex-wrap, gap-4):
  - ⭐ Rating + Views count
  - Type badge (blue-100/800, rounded-full, capitalize)
  - 📍 Address

##### **3. Photo Gallery**

**Layout**: 4-column grid, 400px height, gap-2

**Main Image** (col-span-2 row-span-2):
- Display: `images[selectedImage]`
- Cursor: pointer
- Hover: scale-105, overlay effect
- Rounded corners, overflow hidden

**Thumbnails** (4 images):
- Display: `images.slice(1, 5)`
- Click handler: `setSelectedImage(idx + 1)`
- Same hover effects as main image
- Smaller grid cells (1x1)

**Fallback**:
- Show gray placeholder if no multiple images
- Message: "No additional images"

##### **4. Main Content Grid**

**Layout**: `grid-cols-1 lg:grid-cols-3 gap-6`

**Left Column** (lg:col-span-2):

**Tab Navigation Bar**:
- Three tabs: Overview | Details & Hours | Reviews
- Full-width flex layout
- Active state: `text-blue-600 border-b-2 border-blue-600`
- Inactive: `text-gray-600 hover:text-gray-900`
- Transition: smooth color changes

**Tab Content Panel** (white card, p-6):

**Overview Tab**:
1. **About Section**:
   - H2: "About This Place"
   - Description paragraph (text-lg, leading-relaxed)

2. **Quick Facts Grid** (2 columns, gray-50 bg):
   - 🎫 Admission: Price or "Free"
   - ⏰ Hours: Opening hours or "Check locally"
   - ⭐ Stars: Conditional rendering (if exists)
   - 📅 Event Date: Conditional rendering (if exists)

3. **Amenities Section** (conditional):
   - H3: "Amenities"
   - 2-column grid
   - Green checkmark (✓) per item

4. **Facilities Section** (conditional):
   - H3: "Facilities"
   - 2-column grid
   - Blue bullet (•) per item

5. **Tags Section** (conditional):
   - H3: "Popular Mentions"
   - Flex wrap layout
   - Blue rounded pills (blue-50 bg, blue-700 text)
   - Hover: blue-100 bg

**Details Tab**:
1. **Details Table**:
   - Rows: Type, Opening Hours, Ticket Price, Phone, Website, Email
   - Layout: `flex justify-between border-b`
   - Links: Phone (tel:), Website (external), Email (mailto:)
   - Blue links with hover underline

2. **Suggested Duration Box**:
   - Blue-50 background, blue-100 border
   - 💡 Icon
   - Dynamic text or type-based fallback:
     - archaeological: "2-3 hours"
     - entertainment: "3-5 hours"
     - hotels: "Overnight stay"
     - default: "Event duration varies"

**Reviews Tab**:
1. **Header**:
   - H2: "Visitor Reviews"
   - Subtitle: "Based on {count} reviews • Rating: {rating}/5"

2. **Rating Breakdown** (gray-50 bg):
   - 5 progress bars (5 stars to 1 star)
   - Yellow-500 filled portion
   - Formula: `((place.rating - (5 - star)) / star) * 100`
   - Max width: 100%

3. **Reviews List**:
   - Avatar: 12x12 rounded-full (fallback: pravatar.cc)
   - Name + Date + Star rating (⭐ repeated)
   - Optional title (font-semibold)
   - Comment text
   - Helpful button: "👍 Helpful (count)"
   - Border-b between reviews

4. **Empty State**:
   - Center-aligned
   - Italic gray text
   - Message: "No reviews yet. Be the first to share your experience!"

##### **5. Sidebar** (Sticky)

**Position**: `sticky top-6`

**Plan Your Visit Card** (white, shadow, border, p-6):

1. **Map Section**:
   - Height: 192px (h-48)
   - Gray-200 background
   - Mapbox static image:
     ```
     https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/
     pin-s+3b82f6({lng},{lat})/{lng},{lat},13,0/400x300@2x?
     access_token={TOKEN}
     ```
   - Fallback: 🗺️ emoji (text-4xl)
   - Error handler: Clear src, show emoji
   - Address text below
   - Google Maps link: `https://www.google.com/maps?q={lat},{lng}`

2. **Contact Info** (border-t, pt-4):
   - 📞 Phone (tel: link)
   - 🌐 Website (external link, truncate text)
   - ✉️ Email (mailto: link, truncate text)
   - Hover: text-blue-600

3. **Action Buttons** (mt-6, space-y-2):
   - "Book Now": Blue-600 bg, white text, full-width
   - "Save to Trip": Border button, gray text, full-width
   - Hover effects on both

**Tips Box** (gradient amber-50 to orange-50):
- Border: amber-200
- H3: 💡 + "Tips for Visiting"
- Tips list or default tips (4 items):
  - "Arrive early to avoid crowds"
  - "Bring water and sun protection"
  - "Photography may be restricted"
  - "Guided tours are recommended"
- Amber bullets (•)

---

#### **STYLING REQUIREMENTS**

**Framework**: Tailwind CSS

**Colors**:
- Primary: `blue-600` / `blue-700`
- Background: `gray-50`
- Text: `gray-900` / `gray-600`
- Accents: `amber-600` / `amber-50`
- Success: `green-600`
- Type badge: `blue-100` bg / `blue-800` text

**Typography**:
- Base: Sans-serif
- H1: `text-4xl font-bold`
- H2: `text-2xl font-bold`
- H3: `text-lg font-semibold`
- Body: `text-base` / `text-lg`

**Spacing**:
- Container: `px-4 py-6`
- Card padding: `p-6`
- Gaps: `gap-4` / `gap-6`

**Effects**:
- Transitions: `transition-colors` / `transition-transform`
- Duration: 300ms
- Hover scales: `hover:scale-105`
- Shadow: `shadow-sm` / `shadow-lg`

**Responsive**:
- Mobile: Single column
- Tablet: 2 columns (md:)
- Desktop: 3 columns (lg:)
- Sidebar: Below on mobile, sticky on desktop

---

#### **DATA HANDLING**

**Image Normalization**:
```typescript
const images = Array.isArray(place.images) ? place.images : [];
```

**Optional Field Handling**:
- Use `||` operator for fallbacks
- Conditional rendering with `&&`
- Provide user-friendly defaults (e.g., "Not specified")

**Type Safety**:
- Use TypeScript interfaces
- Type all props and state
- Handle undefined/null cases

---

#### **INTERACTION PATTERNS**

1. **Tab Switching**: Click → `setActiveTab('tab-name')`
2. **Image Selection**: Click thumbnail → `setSelectedImage(index)`
3. **External Links**: `target="_blank" rel="noopener noreferrer"`
4. **Hover States**: All interactive elements
5. **Loading States**: Show spinner during fetch
6. **Error Handling**: User-friendly messages

---

#### **TESTING CHECKLIST**

- [ ] Page loads correctly with valid ID
- [ ] Loading spinner displays during data fetch
- [ ] Error page shows for invalid/missing ID
- [ ] All three tabs switch properly
- [ ] Image gallery selection works
- [ ] Thumbnails change main image on click
- [ ] Hover effects work on all interactive elements
- [ ] All external links open correctly (phone, email, website, maps)
- [ ] Breadcrumb navigation works
- [ ] Responsive layout on mobile/tablet/desktop
- [ ] Sticky sidebar functions on scroll
- [ ] Empty states render properly (no images, no reviews)
- [ ] Optional fields handle missing data gracefully
- [ ] TypeScript compiles without errors
- [ ] Back button maintains browser history

---

#### **NAVIGATION INTEGRATION**

From list page (`PlaceListPage.tsx`), each place card must use:

```tsx
<Link to={`/places/${place._id}`} className="block group">
  {/* Card content with hover effects */}
</Link>
```

Ensure `place._id` is the correct MongoDB ObjectId from the API.

---

#### **FILE LOCATIONS**

- Component: `frontend/src/pages/PlaceDetailPage.tsx`
- Hook: `frontend/src/hooks/queries/usePlaceQueries.ts`
- Service: `frontend/src/api/services/placeService.ts`
- Types: `frontend/src/types/index.ts`
- Route: `frontend/src/App.tsx`

---

#### **FINAL NOTES**

- Prioritize user experience with smooth transitions
- Ensure accessibility (alt tags, semantic HTML)
- Handle all edge cases (missing data, API errors)
- Maintain consistent styling with app theme
- Use meaningful variable names
- Add comments for complex logic
- Keep components focused and readable

---

## ✅ VERIFICATION CHECKLIST

After implementation, verify:

- [ ] URL parameter extraction works
- [ ] API call triggers on page load
- [ ] Data displays correctly in all sections
- [ ] All tabs function properly
- [ ] Image gallery interactive
- [ ] Map displays or fallback shows
- [ ] All links functional
- [ ] Responsive on all screen sizes
- [ ] Loading states work
- [ ] Error handling works
- [ ] Browser back button works
- [ ] No console errors
- [ ] TypeScript errors resolved
- [ ] Tailwind classes applied correctly

---

## 📚 ADDITIONAL RESOURCES

### Related Files
- List Page: `frontend/src/pages/PlaceListPage.tsx`
- API Client: `frontend/src/api/client.ts`
- React Query Setup: Check `main.tsx` for QueryClientProvider

### External Dependencies
- React Router v6
- TanStack Query (React Query)
- Axios
- Tailwind CSS

### API Documentation
- Backend API should have endpoint documentation
- Check `backend/src/routes/` for route definitions
- Verify authentication requirements

---

## 🎯 SUCCESS CRITERIA

The page is complete when:
1. ✅ Users can navigate from list page to detail page
2. ✅ All place information displays correctly
3. ✅ Interactive elements respond to user actions
4. ✅ Page is fully responsive
5. ✅ Error and loading states handled
6. ✅ External integrations work (maps, links)
7. ✅ Code is type-safe and maintainable
8. ✅ Performance is optimal (no unnecessary re-renders)

---

**Document Version**: 1.0  
**Last Updated**: December 21, 2025  
**Author**: Generated from existing implementation analysis
