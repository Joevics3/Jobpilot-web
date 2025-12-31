# Blog Post Functionality Testing Guide

## Sample Data
A SQL file has been created with 3 sample blog posts:
- `supabase/migrations/20240101000002_insert_sample_blog_posts.sql`

## Testing Steps

### 1. Run the Migration
```sql
-- Run this in your Supabase SQL editor or via migration
-- File: supabase/migrations/20240101000002_insert_sample_blog_posts.sql
```

### 2. Test the Resources Listing Page
- Navigate to: `/resources`
- Expected:
  - Header with "Career Resources" title
  - Breadcrumb navigation
  - Posts grouped by category
  - 3 posts displayed:
    - "10 Essential Tips for Acing Your Next Job Interview"
    - "How to Optimize Your CV for ATS Systems"
    - "5 Career Development Strategies for Professional Growth"
  - Category filters/links at the top
  - Each post card shows:
    - Featured image
    - Category badge
    - Title
    - Excerpt
    - Tags
    - Published date
    - View count
    - "Read more" link

### 3. Test Individual Blog Post Pages
Navigate to:
- `/resources/10-essential-tips-job-interview`
- `/resources/optimize-cv-ats-systems`
- `/resources/career-development-strategies`

Expected for each:
- Breadcrumb navigation
- Back to Resources link
- Category badge
- Post title (H1)
- Excerpt
- Published date, views, share button
- Featured image
- Full article content with proper HTML formatting
- Tags section at bottom
- SEO metadata (check page source for meta tags)

### 4. Test SEO Features
Check page source (View > Developer > View Source) for:
- `<title>` tag with post title
- `<meta name="description">` tag
- `<meta name="keywords">` tag
- Open Graph tags (`og:title`, `og:description`, `og:image`, etc.)
- Twitter Card tags
- JSON-LD structured data (BlogPosting schema)
- Canonical URL

### 5. Test Functionality
- [ ] Click "Read more" on listing page → navigates to post
- [ ] Click "Back to Resources" → navigates to listing
- [ ] Click breadcrumb links → navigates correctly
- [ ] Share button works (native share or clipboard copy)
- [ ] Images load correctly
- [ ] Content renders with proper HTML formatting
- [ ] View count increments (may take a moment)
- [ ] Categories filter correctly (if multiple categories)

### 6. Test Responsive Design
- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (> 1024px)

### 7. Test Edge Cases
- Navigate to non-existent slug: `/resources/non-existent-post`
  - Should show 404 page
- Test with no posts in database
  - Should show "No posts available" message

## Known Issues to Check
1. **Image Loading**: Unsplash images should load via Next.js Image component
   - If images don't load, check `next.config.js` remotePatterns
2. **View Count**: Increments via database function
   - May not update immediately (async operation)
3. **Share Button**: Uses Web Share API with clipboard fallback
   - Test on mobile (should use native share)
   - Test on desktop (should copy to clipboard)

## Database Queries for Verification

```sql
-- Check if posts were inserted
SELECT id, title, slug, is_published, category 
FROM blog_posts 
ORDER BY published_at DESC;

-- Check view counts
SELECT slug, title, view_count 
FROM blog_posts 
WHERE is_published = true;

-- Check specific post
SELECT * 
FROM blog_posts 
WHERE slug = '10-essential-tips-job-interview';
```







