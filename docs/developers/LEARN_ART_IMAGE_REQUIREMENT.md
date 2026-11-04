# Learn Art Image Development Requirement

This is a standing Developer requirement for ThreeD Learn and the App's README, following the [v0.31.3 visual guides](../releases/v0.31.3.md) and the Developer's subsequent clarification. Images that document the App must be captured from actual screen views. Created illustrations may be used for support only. New guides and substantial workflow updates must use relevant real screen captures when documenting the interface; small wording corrections do not require a new capture.

## Why this matters

A reader needs to recognize the controls they will actually use, understand what they are building and know what to expect after an action. Screenshots connect instructions to the real interface, especially when moving between Admin, a Project's 2D Design plan and its 3D Scene. A supporting illustration can explain a relationship beside those screen captures.

Good Learn art helps a newcomer recognize the next step, compare the starting and expected states, and distinguish concepts with similar names. It also gives contributors a concrete way to review whether the guide describes the App correctly. A polished image that teaches the wrong relationship undermines that purpose.

The README should use selected real screen views to introduce the App and explain important workflows. Each Learn guide should show the screens relevant to its particular task. Supporting art should answer a learning question. Written steps remain available for the details and for readers who cannot use the image.

## What the image must explain

Start with one learning objective. Identify the action, relationship or outcome the reader should understand, then choose the smallest useful visual.

| Learning question | Actual screen views | Optional supporting art |
| --- | --- | --- |
| How do I start and keep my work? | Project creation, the changed workspace and its Save confirmation. | Create → change → Save → confirm → reopen sequence. |
| Is this a reusable asset or a placed object? | The Model Library and a selected Project instance's DetailsCard. | Catalog-to-instance relationship. |
| Why do the views look different? | Design, 3D, the 2D geographic map and Combined for the same Project. | A compact view comparison. |
| What does this operation save or replace? | The actual import review or Save feedback. | An explanation of the affected content boundary. |
| What is guidance and what runs Actions? | The Scenario panel and Simulation controls with their real states. | Plan, Action execution and Results distinctions. |
| Who does this setting affect? | The relevant Settings sections and Save controls. | Shared, account and browser-local scopes. |

Use the existing [Schema-First, Top-Down architecture](../plans/app-module-architecture.md) and current implementation as the reference. ThreeD, Multimedia, Traffic and Learn are the four peer Top Modules. Preserve the distinctions between a Top Module, saved Module instance, sub-module, record, Project assignment and Scene instance. Use the exact App name **DetailsCard** and its established **ThreeD > Project > Model > DetailsCard** ownership.

An illustration must not imply an unsupported Action, automatic Save, universal relationship, permission or device command. When a workflow changes, review its existing image, labels, alternative text and caption alongside the written instructions.

## Screen capture and supporting artwork

Capture the real App showing the relevant workflow and state. Identify the screen, App version and capture date in the caption when relevant. Review captures when the controls change. Existing Developer-provided captures can be reused when they accurately represent the topic; retain their original dates and context.

Crop and annotate a capture only to focus attention while preserving what the screen actually showed. Do not draw or generate substitute controls, confirmations, data or results and present them as a real screen. A screenshot of a mock fixture is not evidence of the running App.

Supporting artwork may supplement these captures:

- **SVG diagrams:** useful for relationships, plans and labeled sequences. Keep them editable and label them as supporting or conceptual illustrations. The v0.31.3 collection is supporting artwork, not captured screen views.
- **Raster illustrations:** useful for additional context when the topic benefits from it. Label their supporting role and inspect them for factual accuracy.
- **Existing UI icons:** use the App's established Lucide and Module appearance paths for interface controls. Guide artwork does not replace the configured icon system.

Name files, titles and labels after their App screen, workflow or documentation purpose. Do not introduce `AI` branding into App filenames, titles or features. This is an image-documentation requirement; it adds no runtime generation service.

Reuse the accepted visual language where appropriate: clear panels, restrained navy/teal colors, simple spatial drawings, short labels and visible connections. Labels and shapes must carry the meaning as well as color. Avoid tiny text, crowded compositions and visual details that obscure the task.

## Integration and content ownership

The current shared implementation is documented in [Learn visual authoring](THREED_LEARN.md#visual-guides):

The existing v0.31.3 topic images remain conceptual support illustrations. This requirement does not reclassify them as screenshots or claim that every guide already has an actual screen capture.

- Shared App/Markdown artwork lives in [public/learn/illustrations](../../public/learn/illustrations). Repository-only artwork can remain in [docs/images/illustrations](../images/illustrations).
- [guide-illustrations.ts](../../src/components/learn/guide-illustrations.ts) maps recognized topics to their alternative text and captions. [LearnGuideIllustration](../../src/components/learn/LearnGuideIllustration.tsx) renders them in the public reader, landing page and Admin preview.
- Known starter-guide slugs gain their matching image through presentation. Existing database Markdown remains authoritative; an artwork change does not require another starter import or a content rewrite.
- A custom guide can include an appropriate image through ordinary Markdown. New custom slugs receive no unrelated automatic picture. Referencing the matching built-in asset in the body suppresses its automatic copy.
- App image URLs use `/learn/illustrations/<topic>.svg`. Repository Markdown uses the appropriate relative path to the same file. Verify both consumers when sharing an asset.

Keep publication, ownership, safe Markdown rendering and failed/loading states in their existing paths. Public illustrations associated with a guide render after its successful public read; artwork must not substitute for an unavailable or unpublished guide. Asset creation does not authorize live content writes, uploads or SQL operations. Follow [AGENTS.md](../../AGENTS.md) for those boundaries.

## Completion and review

Before completing a new guide or substantial workflow update:

1. Verify the topic against current source, schemas and Developer terminology. Write down the one thing its visual should teach.
2. Capture or reuse an accurate actual App screen for the workflow. Add created art only when it supports the explanation, then integrate the images into the relevant Learn reader/preview and Markdown or README location.
3. Supply descriptive alternative text and a useful caption. Identify actual captures and their version/date separately from supporting illustrations. Reserve image dimensions, scale them responsively and provide full-size viewing when small-screen detail needs it.
4. Inspect the actual image. Check text bounds, meaningful relationships, contrast and readability at desktop and mobile widths in light/dark presentation. Written instructions must still make sense independently.
5. Verify local paths and SVG XML. Keep SVGs self-contained, without scripts, executable event handlers, external resources or `foreignObject`. Preserve Learn's existing raw-HTML and unsafe-URL restrictions.
6. Run checks appropriate to the change: documentation paths/anchors for prose; `npm run validate -- learn repository-maintenance` for guide assets or presentation, with fresh TypeScript and the applicable CI/build gates when code or a release changes. Use isolated installations and mocked boundaries as required by the [validation guide](../agents/VALIDATION.md).
7. Record visual review, automated results and remaining manual checks accurately. Keep local/mocked evidence, Developer acceptance and production confirmation separate in the matching release record.

A guide is ready when its words and captured views explain the same supported workflow, the reader can access them, and the relevant checks pass. A support illustration alone does not satisfy a need to show the actual interface. Identify missing captures honestly rather than substituting invented screens. Routine capture or supporting artwork within an authorized task needs no additional approval gate; local server and live-system boundaries still apply.
