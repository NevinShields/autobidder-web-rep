# Blog Content Creation & Duda Publishing System

## Developer Handoff Document

**Last Updated:** February 2026
**Original Author:** Claude (AI-assisted implementation)
**System Status:** MVP Complete

---

## 1. High-Level Overview

### What This System Does

The Blog Content System enables Autobidder users to create SEO-optimized blog posts that can be published directly to their Duda websites. It provides:

- **AI-powered content generation** using structured templates (not freeform)
- **Multi-step wizard UI** for guided blog creation
- **Section-based editing** with lock/regenerate capabilities
- **SEO scoring and compliance checking**
- **Direct Duda CMS integration** for publish/sync workflows

### Why It Exists

Autobidder users need to generate localized, service-specific blog content to improve their SEO rankings. This system automates the content creation process while maintaining quality through structured templates and AI assistance, reducing the time to create a blog post from hours to minutes.

### Business Context

- **Access Control:** Available to paid plans only (`trial`, `standard`, `plus`, `plus_seo`)
- **Content Types:** Job Showcase, Expert Opinion, Seasonal Tip, FAQ/Educational
- **Integration:** Syncs with user's existing Duda website via API

---

## 2. File/Module Map

### Backend Files

| File | Responsibility |
|------|----------------|
| `shared/schema.ts` | Database table definitions, TypeScript types, Zod validation schemas |
| `server/routes.ts` | API endpoints (~20 routes under `/api/blog-posts/*`) |
| `server/blog-content-generator.ts` | AI content generation, SEO scoring, compliance checking |
| `server/duda-api.ts` | Duda Blog API client methods |

### Frontend Files

| File | Responsibility |
|------|----------------|
| `client/src/App.tsx` | Route registration for blog pages |
| `client/src/pages/blog-posts.tsx` | Blog list page with filtering and stats |
| `client/src/pages/blog-post-editor.tsx` | Multi-step creation/edit wizard |

### Database Tables

| Table | Purpose |
|-------|---------|
| `blog_posts` | Core blog entity with content, metadata, and Duda sync status |
| `blog_images` | Image attachments with tagging and rights confirmation |
| `blog_layout_templates` | JSON-based layout definitions (currently seeded via code) |
| `blog_section_locks` | Tracks which sections user has manually edited |

---

## 3. Step-by-Step Execution Flow

### Flow 1: Creating a New Blog Post

```
User clicks "New Blog Post"
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  FRONTEND: blog-post-editor.tsx                         │
│  - 7-step wizard guides user through:                   │
│    1. Type selection (job_showcase, expert_opinion...)  │
│    2. Targeting (service, city, goal)                   │
│    3. Content source (work order or freeform notes)     │
│    4. Layout template selection                         │
│    5. AI content generation + section editing           │
│    6. SEO review checklist                              │
│    7. Publish settings (slug, meta, schedule)           │
└─────────────────────────────────────────────────────────┘
        │
        │ POST /api/blog-posts/generate-content
        ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND: routes.ts → blog-content-generator.ts         │
│  - Validates user plan access                           │
│  - Calls generateBlogContent() with input data          │
│  - AI generates title, meta, excerpt, and sections      │
│  - Returns structured BlogContentSection[] array        │
└─────────────────────────────────────────────────────────┘
        │
        │ Returns generated content
        ▼
┌─────────────────────────────────────────────────────────┐
│  FRONTEND: User reviews/edits sections                  │
│  - Can lock sections to prevent regeneration            │
│  - Can regenerate individual sections                   │
│  - SEO score updates in real-time                       │
└─────────────────────────────────────────────────────────┘
        │
        │ POST /api/blog-posts (save)
        ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND: routes.ts                                     │
│  - Validates with insertBlogPostSchema                  │
│  - Calculates word count                                │
│  - Inserts into blog_posts table                        │
│  - Returns created post with ID                         │
└─────────────────────────────────────────────────────────┘
```

### Flow 2: Publishing to Duda

```
User clicks "Sync to Duda"
        │
        │ POST /api/blog-posts/:id/sync-to-duda
        ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND: routes.ts                                     │
│  - Fetches post from database                           │
│  - Gets user's Duda site ID from businessSettings       │
│  - Converts content to HTML via blogContentToHtml()     │
│  - Calls dudaApi.createBlogPost() or updateBlogPost()   │
│  - Updates post with dudaBlogPostId, dudaStatus         │
└─────────────────────────────────────────────────────────┘
        │
        │ User clicks "Publish"
        │ POST /api/blog-posts/:id/publish-to-duda
        ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND: routes.ts → duda-api.ts                       │
│  - Calls dudaApi.publishBlogPost()                      │
│  - Updates dudaStatus to "published"                    │
│  - Stores dudaLiveUrl for "View Live" link              │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Data Flow

### Key Data Structures

**BlogContentSection** (stored in `blog_posts.content` as JSONB):
```typescript
interface BlogContentSection {
  id: string;                    // Unique section identifier
  type: "hero" | "text" | "job_summary" | "before_after" |
        "process_timeline" | "pricing_factors" | "faq" | "cta";
  content: any;                  // Type-specific content object
  isLocked: boolean;             // Prevents AI regeneration
}
```

**BlogGenerationInput** (sent to AI generator):
```typescript
interface BlogGenerationInput {
  blogType: string;              // e.g., "job_showcase"
  serviceName: string;           // e.g., "Roof Cleaning"
  serviceDescription?: string;
  targetCity: string;
  targetNeighborhood?: string;
  jobData?: {                    // From work order if selected
    title: string;
    customerAddress: string;
    completedDate: string;
    notes?: string;
    images: string[];
  };
  talkingPoints: string[];
  tonePreference: string;        // "professional" | "friendly" | "technical"
  layoutTemplate: LayoutSection[];
}
```

**API Response Flow:**
```
Frontend State ──POST──▶ routes.ts ──validates──▶ blog-content-generator.ts
                                                          │
                                                   AI Provider
                                                   (Claude/Gemini/OpenAI)
                                                          │
                                                          ▼
Frontend State ◀──JSON── routes.ts ◀──structured── BlogGenerationOutput
```

### Database Relationships

```
blog_posts
    ├── userId → users.id (implicit, varchar match)
    ├── primaryServiceId → formulas.id (optional)
    ├── workOrderId → work_orders.id (optional)
    ├── leadId → leads.id (optional)
    └── layoutTemplateId → blog_layout_templates.id (optional)

blog_images
    └── blogPostId → blog_posts.id

blog_section_locks
    └── blogPostId → blog_posts.id
```

---

## 5. Where to Safely Make Changes

### Adding New Features

**Add a new blog type (e.g., "case_study"):**
1. Add type to `BLOG_TYPES` array in `blog-post-editor.tsx` (line ~45)
2. Add corresponding prompt template in `blog-content-generator.ts` `getPromptForBlogType()`
3. Add default layout to `DEFAULT_LAYOUT_TEMPLATES` in `blog-content-generator.ts`

**Add a new content section type:**
1. Add type to `BlogContentSection.type` union in `shared/schema.ts`
2. Add rendering logic in `blog-post-editor.tsx` `renderSectionEditor()`
3. Add HTML conversion in `blog-content-generator.ts` `blogContentToHtml()`
4. Update AI prompt to generate this section type

**Add a new SEO check:**
1. Modify `calculateSeoScore()` in `blog-content-generator.ts`
2. Add check to `SeoChecklistItem[]` return value
3. Frontend automatically renders new checks from API response

### Modifying Existing Behavior

**Change AI provider priority:**
- Edit `generateBlogContent()` in `blog-content-generator.ts`
- Current order: Claude → Gemini → OpenAI
- Each provider call is wrapped in try/catch for fallback

**Modify Duda sync behavior:**
- Edit sync endpoints in `routes.ts` (search for `sync-to-duda`)
- Duda API methods are in `duda-api.ts`

**Adjust SEO scoring weights:**
- All scoring logic is in `calculateSeoScore()` function
- Each check is independent; modify point values as needed

### What NOT to Edit

| Area | Reason |
|------|--------|
| `blogPosts` table schema columns | Requires database migration; coordinate with team |
| `BlogContentSection` interface | Breaking change affects all stored content |
| Duda API endpoint URLs in `duda-api.ts` | These are Duda's official API paths |
| `insertBlogPostSchema` generation | Auto-generated from table; modify table instead |
| AI provider API call signatures | Match provider SDKs exactly |

---

## 6. Assumptions and Edge Cases

### Assumptions Made

1. **User has Duda site configured:** The system assumes `businessSettings.dudaSiteId` exists when syncing. If missing, sync will fail gracefully with error message.

2. **AI providers are available:** At least one of Claude/Gemini/OpenAI must be configured with valid API keys. System falls back through providers on failure.

3. **Content is English:** AI prompts are English-only. Localization would require prompt translation.

4. **Images are accessible URLs:** Image URLs in work orders must be publicly accessible for AI alt-text generation.

### Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| User edits section, then clicks regenerate | Locked sections are skipped during regeneration |
| Duda sync fails mid-operation | Post remains in "synced" state; user can retry |
| AI generation returns malformed JSON | Caught in try/catch; returns error to frontend |
| User has no work orders to choose from | Freeform notes input is always available |
| SEO score is 0 | Valid state; displayed with red indicator |

### Edge Cases NOT Handled

| Scenario | Current Behavior | Suggested Fix |
|----------|------------------|---------------|
| Duda blog post deleted externally | Our DB still shows "published" | Add webhook or periodic sync check |
| Very long content (>50k chars) | May timeout on AI generation | Add chunking or streaming |
| Concurrent edits to same post | Last write wins | Add optimistic locking with version field |
| Rate limiting from AI providers | Returns 500 error | Add retry with backoff |

---

## 7. Known Limitations and Technical Debt

### Limitations

1. **No image upload flow:** `blog_images` table exists but upload UI is not implemented. Images must be URLs.

2. **Layout templates are hardcoded:** `DEFAULT_LAYOUT_TEMPLATES` is defined in code. The `blog_layout_templates` table exists but admin UI to manage templates is not built.

3. **No version history UI:** The `version` and `parentVersionId` columns exist for version tracking, but the UI only shows current version.

4. **No scheduling backend:** `scheduledPublishAt` column exists but there's no cron job or scheduler to auto-publish.

5. **Single Duda site per user:** System assumes one Duda site per user. Multi-site support would require site selection UI.

### Technical Debt

| Item | Impact | Effort to Fix |
|------|--------|---------------|
| TypeScript `as` assertions in routes.ts | Type safety reduced | Medium - proper typing |
| No unit tests for blog-content-generator | Regression risk | Medium - add Jest tests |
| AI prompts embedded in code | Hard to tune without deploy | Low - move to config/DB |
| No caching of AI responses | Repeated generation costs | Medium - add Redis cache |
| Mixed mutation patterns in frontend | Inconsistent error handling | Low - standardize |

### Database Migration Note

The blog tables were created via raw SQL migration (not Drizzle push) due to interactive prompt issues. Future schema changes should use:
```bash
npx drizzle-kit push --force
```
Or create migration SQL manually if interactive prompts block CI/CD.

---

## Quick Reference

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/blog-posts` | List all posts (with filters) |
| GET | `/api/blog-posts/:id` | Get single post |
| POST | `/api/blog-posts` | Create new post |
| PATCH | `/api/blog-posts/:id` | Update post |
| DELETE | `/api/blog-posts/:id` | Delete post |
| POST | `/api/blog-posts/generate-content` | AI generate full blog |
| POST | `/api/blog-posts/:id/regenerate-section` | Regenerate one section |
| POST | `/api/blog-posts/:id/sync-to-duda` | Create/update on Duda |
| POST | `/api/blog-posts/:id/publish-to-duda` | Publish on Duda |
| GET | `/api/blog-layout-templates` | Get available templates |

### Key Functions

| Function | File | Purpose |
|----------|------|---------|
| `generateBlogContent()` | blog-content-generator.ts | Main AI generation entry point |
| `calculateSeoScore()` | blog-content-generator.ts | Returns score + checklist |
| `blogContentToHtml()` | blog-content-generator.ts | Converts sections to HTML |
| `canAccessBlogFeature()` | routes.ts | Plan-based access check |
| `dudaApi.createBlogPost()` | duda-api.ts | Duda API create call |

---

## Contact / Questions

If you encounter issues not covered here:
1. Check server logs for `[Blog]` prefixed messages
2. Verify AI provider API keys are set in environment
3. Confirm user's plan includes blog access
4. Check Duda site connection in user's business settings
