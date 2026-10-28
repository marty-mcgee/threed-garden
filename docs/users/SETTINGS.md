# App Settings: global and personal

Open **Admin > Settings > App Settings** (`/admin/settings`). Global Module appearance is shared across users; personal controls retain their account/browser scope.

### A) Global Module settings

The current App defines 42 configurable Module identities, including Learn.

Module colors and Lucide icons are shared by every user. Only active, non-deleted **Super Admin** accounts can save them through **Save Module appearance**; other Users can view the saved appearance. A collapsible tree groups controls under Users, Projects, ThreeD, Multimedia, Traffic and Learn. Nested groups and individual Modules start closed; expand a Module to edit its color and icon. Unsaved indicators remain visible on collapsed parent groups, and Save actions stay outside the tree. Connected Admin headers, navigation identities and fixed record icons use these settings; status indicators and individual Layer colors stay independent.

To change a Module, expand **Module colors and icons**, its group and the Module itself. Choose a color and icon, review the preview, then select **Save Module appearance**. Sidebar creation links keep their Plus icons and ordinary navigation styling; green creation buttons on Admin pages are separate from Module appearance.

| Group | Configurable Modules |
| --- | --- |
| Users | Users |
| Projects | Projects |
| ThreeD | ThreeD, Models, Model Files, Model Categories, Textures, Model Builder, Assembly Groups, Animations, Animation Slots, Animation Categories, Designs, Characters, Plants, Beds, Plantings, Scenarios, Simulations, Simulation Results, Layers, Tasks, Waterings, Harvests, FarmBots |
| Multimedia | Multimedia, Albums, Tracks, Lyrics, Media, Links, Speech |
| Traffic | Traffic, CHP-CAD Incidents, CHP Cases, CHP Centers, Caltrans Closures, Caltrans Districts, Caltrans CCTV, CalFire Incidents, Bay Area 511 |
| Learn | Learn |

Global controls offer **Save Module appearance**, **Discard**, **Restore defaults** and **Reload**. Defaults remain a draft until saved. Conflicting saves are rejected and failed drafts remain available. Other sessions receive saved styles when the App reloads.

**Learn** defaults to the green **BookOpen** icon. Its saved identity appears in the Admin sidebar, App navigation menu, Home and Dashboard Learn links, and Learn page introduction. Open **Learn > Learn ThreeD** from Admin or **Learn ThreeD** from the App menu. The guides at `/learn` remain public; Learn does not need a Project assignment and remains available alongside Projects and Settings when optional content navigation is hidden.

### B) Personal settings and sidebar behavior

| Scope | Settings and behavior |
| --- | --- |
| Account-saved | Theme; ThreeD, Multimedia and Traffic navigation visibility; Weather, Garden Analytics, CHP Live, CHP Historical, Caltrans, Bay Area 511 and CalFire Dashboard link visibility. |
| Browser-local | Scene panel, Project Header and button colors/opacity; Model PNG export width/height defaults. These are not global or guaranteed account-isolated settings. |
| Account-keyed in this browser | Admin sidebar section/subgroup expansion and the six main Settings disclosures, with optional storage fallback and cross-tab synchronization. |
| Existing navigation behavior | Labels/order, active-route highlighting, mobile/collapsed navigation and personal visibility filtering remain. Hiding navigation does not revoke access, delete data or stop services. |

The six main Settings sections remember open/closed choices per signed-in user in this browser, with cross-tab synchronization. First-visit defaults: Module colors and icons, Appearance, Model Preview Images, Module Navigation and Dashboard Menu Links open; Scene Appearance closed. About these Settings and nested Module groups remain closed by default. Collapsing retains edits; disclosure changes save automatically without Save Changes. Personal Save Changes, Discard and Refresh remain available in the bottom action bar.

Personal **Save Changes**, **Discard**, **Refresh** and **Restore Defaults** are separate from global Module controls. Under **Model Preview Images**, set Width and Height from 64 to 2048 pixels, then choose **Save preview defaults**. Those PNG export defaults are saved only in this browser.

## Personal control details

| Control | Effect after Save Changes |
| --- | --- |
| Theme: Dark / Light | Applies the chosen appearance through the App's theme provider. |
| Theme: Follow device | Follows your device's light/dark preference. |
| Theme: Use browser preference | Uses the browser's existing theme choice instead of applying an account theme. |
| Module Navigation | Shows or hides ThreeD, Multimedia and Traffic in the Admin sidebar, Dashboard menu and Dashboard Home quick links. |
| Dashboard Menu Links | Shows or hides individual Weather, Analytics and Traffic links in the Dashboard menu. |

**Save Changes** stores account preferences in the database and Scene appearance in this browser. Navigation and appearance update after a successful save. The account preferences load again after a browser reload or sign-in. The header theme button remains available for a temporary browser change; an explicit saved account theme is reapplied on the next account-preference load or Save.

**Discard** restores the last loaded/saved values. **Restore Defaults** prepares a draft with all navigation visible and the browser theme preference; choose Save Changes to keep it. **Refresh** reads the database again and asks before discarding unsaved changes. The status identifies defaults, unsaved changes, loading, saving and saved preferences.

If another window saves first, your outdated save is rejected. Your draft remains visible. Review it, then Refresh and reapply any changes you want to retain. Loading/saving errors are shown explicitly; a failed database read is not treated as a successful load of defaults.

Hidden navigation does not delete data, change Project assignments, block direct URLs or stop services. Projects and Settings remain reachable even with every optional module hidden. The old polling, cron-job, API-documentation and integration switches are not exposed because they did not control supported execution paths. This page does not configure credentials, deployments or physical devices.

### Users and roles

Open **Admin > Users > All Users** (`/admin/users`). An active, non-deleted **Super Admin** can view accounts, search/filter them, and use **Add User**, **Edit** and **Delete User**. Ordinary Admins manage their own content; they cannot manage other accounts. Super Admin authority does not grant ownership of other Users' private content.

- **Add User:** enter name, email and an initial password, then choose **Create User**. The App creates an Admin account; securely share its credentials. No invitation email is sent. Your current Super Admin session stays signed in.
- **Edit:** change name, email or role, then Save Changes. Discard restores saved values. Activity is read-only. Role changes are audited and the last active Super Admin cannot be demoted.
- **Delete User:** type the saved email and choose **Confirm Delete User**. The App retains the record and blocks login/session access. You cannot delete yourself, the last active Super Admin or a User who owns Module content.
- **Deleted Users:** choose this option in the account filter to view retained deleted accounts. Their email addresses stay reserved and their fields are read-only. There is no Restore action.

See [Manage Users](ADMIN_GUIDE.md#manage-users-as-a-super-admin) for the account workflow. New installations have separate [developer prerequisites](../developers/SUPER_ADMIN_BOOTSTRAP.md#users-crud-and-deletion); do not rerun setup scripts already applied to an existing database.

Users styling remains global alongside the other Modules; personal sidebar expansion remains user-scoped.
