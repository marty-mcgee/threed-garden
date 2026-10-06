# Personal workspace Settings

Open **Admin → Settings** (`/admin/settings`). These preferences belong to your signed-in account; they do not change another User's App.

| Control | Effect after Save Changes |
| --- | --- |
| Theme: Dark / Light | Applies the chosen appearance through the App's theme provider. |
| Theme: Follow device | Follows your device's light/dark preference. |
| Theme: Use browser preference | Uses the browser's existing theme choice instead of applying an account theme. |
| Module Navigation | Shows or hides ThreeD, Multimedia and Traffic in the Admin sidebar, Dashboard menu and Dashboard Home quick links. |
| Dashboard Menu Links | Shows or hides individual Weather, Analytics and Traffic links in the Dashboard menu. |

**Save Changes** stores the preferences in the database. Navigation and appearance update after a successful save. The account preferences load again after a browser reload or sign-in. The header theme button remains available for a temporary browser change; an explicit saved account theme is reapplied on the next account-preference load or Save.

**Discard** restores the last loaded/saved values. **Restore Defaults** prepares a draft with all navigation visible and the browser theme preference; choose Save Changes to keep it. **Refresh** reads the database again and asks before discarding unsaved changes. The status identifies defaults, unsaved changes, loading, saving and saved preferences.

If another window saves first, your outdated save is rejected. Your draft remains visible. Review it, then Refresh and reapply any changes you want to retain. Loading/saving errors are shown explicitly; a failed database read is not treated as a successful load of defaults.

Hidden navigation does not delete data, change Project assignments, block direct URLs or stop services. Projects and Settings remain reachable even with every optional module hidden. The old polling, cron-job, API-documentation and integration switches are not exposed because they did not control supported execution paths. This page does not configure credentials, deployments or physical devices.

No new schema is introduced by this workspace. It uses the existing Settings definition, User override and audit tables. Browser/database acceptance remains a separate development check from the offline validators.
