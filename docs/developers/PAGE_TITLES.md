# HTML page titles

Introduced in v0.25.4. The browser tab title has one shared owner: [AppPageTitle.tsx](../../src/components/layout/AppPageTitle.tsx), mounted around the application providers in the [root layout](../../src/app/layout.tsx).

## React, TypeScript and Next.js responsibilities

- `usePathname()` supplies the current Next.js route and updates on client navigation. `getAppPageTitle()` converts its segments into readable labels, retaining the `ThreeD Garden` prefix. Nested Admin/Dashboard ThreeD grouping segments are omitted; numeric path IDs appear as `#15`.
- The component renders a React `<title>` element. React's native document-metadata support places it in `<head>`; there is no imperative `document.title` assignment or HTML-string injection. See the [React title reference](https://react.dev/reference/react-dom/components/title).
- Root and route metadata descriptions remain intact. Previous metadata `title` declarations were removed to avoid competing title owners. Future page titles should extend this shared formatter/context rather than add another `<title>` or metadata title.
- Typed React context carries an optional `{ pathname, name, id }` Project suffix. `useProjectPageTitle()` registers and clears it through an effect. The owner only uses context matching the current pathname.
- The [Dashboard Scene page](../../src/app/dashboard/scene/page.tsx) registers its existing loaded Project name and ID only when loading has completed, the view is not the default/error view, and the loaded Project access identity matches the selected Project. It performs no extra fetch or database read for titles.

## Examples

| Page | Title |
| --- | --- |
| Home | `ThreeD Garden` |
| Admin Models | `ThreeD Garden - Admin - Models` |
| Model 15 | `ThreeD Garden - Admin - Models - #15` |
| Learn | `ThreeD Garden - Learn ThreeD` |
| Loaded Project Scene | `ThreeD Garden - Dashboard - Scene - Legacy Plan Demo 1 Recovery [17]` |

The Project suffix becomes available after client Project loading; it is not server-generated Project metadata. Other routes currently use route labels rather than fetching entity names. Query-string View Modes do not change the Scene title. Titles do not alter visible App headers, permissions, Scene state or Save/load.

## Verification and maintenance

Implementation checks passed: TypeScript and six mocked pathname cases rendered with ReactDOMServer, checking expected text, head placement and exactly one title per render. These checks did not exercise authenticated Project loading or client navigation in a browser.

Manual checks: navigate Home → Learn → Admin Models; open a Project Scene and confirm its name/ID; switch Projects, test an unavailable Project, then leave the Scene. Confirm the suffix follows the loaded Project and disappears elsewhere, and inspect the DOM for one title. Check direct loads and browser Back/Forward. No server or database operation is needed to maintain the formatter itself.
