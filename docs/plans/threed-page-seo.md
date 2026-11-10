# ThreeD App: Dynamic Page Metadata

## Objective and evidence

Requested November 9, 2026, following the production release of v0.32.1.
Provide useful, page-specific metadata in each page's initial HTML output,
controlled through the existing App Settings and Project metadata boundaries.
This is a formulated implementation plan, not a claim that dynamic record
metadata is already implemented. No new version is assigned here.

Reviewed [monetization](../business/monetization.md), current App metadata
contracts, Project metadata service, page declarations, AppPageTitle and the
Project, Learn and Multimedia schemas. The commercial document is an older
business proposal: suggested prices, subscriptions, marketplace, confidential
hosting and construction-grade deliverables are not established product offers.
Do not advertise them through metadata.

## Audience and wording

Describe demonstrated benefits: explain a landscape or property concept,
present products in context, prepare reusable Models, and teach with interactive
Projects. Use **ThreeD App** as the product name. Retain ThreeD Garden where it
is the actual site/repository or existing page-title identity. Preserve the four
Top Modules: ThreeD, Multimedia, Traffic and Learn; Admin/Dashboard are surfaces.

Suggested Home description:

> Turn landscape, garden and property ideas into interactive spaces with ThreeD App. Combine editable 2D plans, reusable 3D Models, maps and multimedia.

Suggested Home social title:

> ThreeD App | Interactive 2D Plans and 3D Project Presentations

This copy supports the commercial positioning without promising sales outcomes,
paid services, unsupported automation or construction-ready documentation.

## Current implementation facts

- Root generateMetadata reads the optional App-wide allowlisted Settings tags.
- Saved Project config.metaTags supplies optional overrides for the canonical
  /dashboard/scene?projectId= URL through an owner/public-active scoped lookup.
  The lookup currently reads config only, not a generated name/description.
- Learn landing and several Dashboard pages declare static descriptions. Learn
  guide pages currently share "Read a published ThreeD App guide."
- Dashboard Multimedia declares "Albums and Tracks Player", regardless of
  Album/Track selection.
- AppPageTitle is the existing title owner, including client route/Project
  changes. Do not create competing title elements while improving metadata.
- htmlLimitedBots resolves metadata in initial HTML for all user agents.
  A local history-only Project switch is not a new server document request.

## Page metadata copy and record sources

These are proposed defaults. Generated text must describe the actual page and
only use fields admitted by that page's existing public/owner read contract.

| Page | Proposed description or derivation | Search treatment |
| --- | --- | --- |
| Home | The Home description above. | Eligible public landing page. |
| Learn | Learn ThreeD App: create your first Project, draw 2D plans, place 3D Models, add multimedia and explore interactive spaces with practical guides. | Eligible public landing page. |
| Published Learn guide | Saved guide.summary; if empty: "Learn {guide.title} in ThreeD App with practical instructions for your workspace." | Only active, published guides. |
| Learn Data Structure | Explore ThreeD App's data structure, Module relationships and Project ownership across ThreeD, Multimedia, Traffic and Learn. | Eligible public reference page. |
| Public active Project Scene | Saved Project description when meaningful; otherwise: "Explore {project.name}, an interactive ThreeD App Project with 2D and 3D views." Then apply explicit Project tags. | Eligible only through existing public-active access. |
| Project unavailable/private/inactive | Generic Project workspace description without private record names, descriptions or images. | noindex; retain authorization/response behavior. |
| Multimedia landing | Explore published Albums and Tracks in ThreeD App. Browse multimedia and choose what to play. | Public landing; retain existing publication rules. |
| Eligible Album selection | Public Album description; fallback: "Explore {album.title} in ThreeD App Multimedia. Browse its available Tracks and choose what to play." | Only if the server and visible player resolve the same eligible selection. |
| Eligible Track within Album | "Listen to {track.title} from {album.title} in ThreeD App Multimedia." Use "Explore" when the media is not audio. | Validate Album membership and public eligibility first. |
| Public Traffic pages | Describe the specific existing source/view, such as "Explore mapped CalFire incident information in ThreeD App Traffic." | Do not claim real-time accuracy or freshness without evidence. |
| Public Weather page | "View available weather observations in ThreeD App." | Do not expose private Project locations or fabricate current conditions. |
| Other Dashboard pages | Explicit route-purpose summary based on visible public content. Personal workspace pages stay generic. | Per-route policy; Dashboard prefix alone is not a privacy rule. |
| Admin CRUD pages | "Manage {existing record type} in the ThreeD App Admin surface." No selected private record fields. | noindex, nofollow. |
| Account, internal/test, missing/error pages | Generic purpose text without account or record details. | noindex, nofollow; preserve status/auth behavior. |

Do not assign indexable metadata to an API/JSON response or a redirect as though
it were a content page. Inventory every actual HTML page, including dynamic
segments, aliases and missing-record cases; classify unknown routes conservatively.

## Resolution and settings policy

1. Resolve existing access and publication rules before reading record fields
   for output. Public metadata must not vary with an owner's private preview.
2. Use a route-specific description/social title, then refine from eligible saved
   record fields. Do not derive marketing copy from raw URL slugs or arbitrary
   search text. Strip Markdown/HTML and normalize whitespace for plain text.
3. Existing App Settings remain explicit global defaults. A configured App-wide
   description remains the fallback; known route/record descriptions take
   precedence, as current child-route metadata already does. App social identity
   and images inherit unless an eligible route supplies a replacement.
4. Explicit enabled Project config.metaTags overrides that Project's generated
   metadata, field by field. Disabling Project overrides restores inherited and
   generated defaults; it must not disable App metadata or change privacy.
5. Route restrictions are the final robots ceiling. Neither an App-wide nor
   Project "index, follow" setting should index Admin/account/private/error pages.
   An App-wide restrictive robots choice remains restrictive on public pages.
6. Preserve independent Open Graph/Twitter field inheritance. Avoid duplicate
   descriptions and social tags. Use the same resolved public title/description
   for social fallbacks unless explicitly overridden.

The proposed automatic-default and robots-ceiling policy changes existing
behavior and needs implementation tests; it is not a description of v0.32.1.
Do not add schema fields, migrations, stored generated descriptions or a second
defaults store. If an additional user-facing mode is needed, define that change
explicitly rather than silently repurposing the existing enable checkbox.

## Social previews, titles and canonical URLs

- Supply og:title/description/site_name and Twitter title/description/card from
  the resolved page data. Keep optional author factual; do not repeat a global
  author as the supposed creator of another user's Project or Album.
- Use only existing publicly eligible images with absolute HTTPS URLs. Support
  a configured App image fallback; do not invent screenshot URLs or expose
  private uploads. A fallback is preferable to an unrelated image.
- Coordinate server titles and AppPageTitle before changing title ownership.
  Preserve accepted browser titles and client navigation behavior, with exactly
  one meaningful title in initial and navigated documents.
- Choose a trusted deployment/site origin before adding canonical/og:url values.
  Do not hard-code localhost, a Vercel preview host or one production domain
  across other deployments. Forwarded request headers are not trusted config.
- Keep Project identity in the Scene canonical URL; ignore view/overlay UI state.
  Keep validated Album/Track identity when it selects distinct public content.
  Normalize unrelated query parameters; do not canonicalize every Project to
  the generic Scene or every Album to one landing page.
- Canonical is a link element, not another freely entered meta-tag name. Retain
  the existing tag allowlist and escaped Next Metadata API output.

## Implementation outline

1. Inventory HTML routes and current metadata/title callers. Add a typed,
   testable route policy/resolver under src/libraries/config and server services
   under their existing owners. No browser-pathname guess in the root layout.
2. Implement Home, Learn and published-guide defaults first. Reuse the published
   Learn service projection, including unavailable/withdrawn guide behavior.
3. Extend the current Project metadata lookup with only permitted name and
   description fields, retaining access, revision and explicit override rules.
4. Add server metadata to Multimedia selection using its current Album/Track
   public projection and membership rules. Keep the player and metadata on the
   same normalized selection; never use an Admin service as a public shortcut.
5. Cover Traffic/Weather and generic routes. Apply private/Admin/account/error
   noindex policy without altering authentication, runtime or data writes.
6. Reconcile title ownership and initial/client navigation. Canonical origins
   remain an explicit deployment choice; do not guess the domain.
7. Validate all route categories, update the next release record and retain the
   already-released v0.32.1 evidence as historical.

Expected affected areas: src/app/layout.tsx, public page/server entries,
src/app/dashboard/scene/page.tsx, src/libraries/services/project/meta-tags.ts,
the existing Learn/Multimedia public services, src/components/layout/AppPageTitle.tsx,
the meta-tag contract and focused validation scripts. Leave SceneWorkspace,
Canvas/Rapier, saved view state and all content ownership unchanged.

## Acceptance criteria

- Initial HTML has a single appropriate description and consistent social tags
  for Home, Learn, two different published guides, two public Projects and two
  eligible Album/Track selections. Distinct records produce distinct text.
- Settings/Project explicit overrides, disabled states, empty summaries,
  duplicate tags, escaped content and stale revisions retain tested semantics.
- Private, inactive, unpublished, missing and unauthorized records emit no private
  identity/description/image and cannot override restrictive indexing policy.
- Slow/failed reads preserve safe fallback and page availability; repeated
  layout/route reads are deduplicated within a request where applicable, without
  cross-user or stale-publication caching.
- Client navigation and local Project/Track switching remain coherent with the
  visible selection. Test fresh View Source separately from client DOM changes.
- Offline tests mock persistence. Finish with fresh TypeScript, applicable CI,
  isolated build and Developer View Source/share-preview acceptance. No live
  writes, search ranking claims or production acceptance inferred from mocks.

## Search guidance

Google recommends page-specific, descriptive summaries and may choose other
visible page text for its snippets. Meta keywords are not used by Google Search.
Do not auto-fill keyword lists or promise rankings. Concise copy is an editorial
target, not a fixed Google character limit. Social tags support sharing and do
not guarantee search placement.

- [Google: snippets and descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Google: supported meta tags](https://developers.google.com/search/docs/crawling-indexing/special-tags)
- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: robots metadata](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

Robots directives control indexing, not authentication or confidentiality.
Preserve actual authorization regardless of metadata.
