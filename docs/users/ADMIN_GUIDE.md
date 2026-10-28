# Admin Guide

Use Admin at `/admin` to manage your Projects and reusable content. Sign in at `/auth/sign-in`; **Create an account** opens signup. New accounts are Admins of their own content. An active, non-deleted Super Admin can also manage Users and global Module appearance. That role does not grant ownership of another User's private content.

## Find your workspace

| Sidebar section | What you manage |
| --- | --- |
| Users | Accounts through **All Users** and **Add User**, available to Super Admins. |
| Projects | **All Projects** and **Add Project**; Project details, configuration, Modules and assigned assets. |
| ThreeD | Models and their Files, Categories, Textures and Animations; Designs, Characters, garden records, Scenarios, Simulations, Layers and FarmBots. |
| Traffic | CHP, Caltrans, CalFire and Bay Area 511 records. |
| Multimedia | Albums, Tracks, Lyrics, Speech, Media and Links. |
| Learn | Super Admins manage shared Markdown guides through **All Guides** and **Add Guide**. **Learn ThreeD** opens published guides at `/learn`. |
| Settings | **App Settings** for global Module appearance and personal workspace preferences. |

Expand a section or subgroup to see its pages. Expansion choices are remembered for your account in this browser. The current page has a tinted background and outline; creation links such as **Add User**, **Add Project**, **Add Model**, **Add Simulation** and **Add Speech** retain ordinary sidebar styling.

Creation buttons on Admin pages are green. Read the button label before acting: existing Save buttons can also be green. Module icons and colors follow saved App Settings; utility icons such as the creation Plus remain distinct. Use search, filters and paging where offered to find records, and follow linked relationship badges to their related Admin records.

## Manage Learn guides

For shared learning content, open **Learn > All Guides**. **Import Starter Guides** adds the fourteen existing ThreeD Learn guides as editable records, skipping any matching slugs already present. **Add Guide** starts an unpublished draft. Edit the Markdown, review its preview, then Save; a guide appears publicly only when both Active and Published are enabled. The [Learn setup and authoring guide](../developers/THREED_LEARN.md) covers the database prerequisite and full workflow.

## Create and configure a Project

1. Choose **Projects > Add Project** at `/admin/projects/new`.
2. In **Setup**, enter **Project Name**, optionally add a Description, and review Public, Active and measurement preferences. Choose **Create Project**.
3. On the saved Project, open **Modules and assets**. Use **Add Module** for the Modules this Project needs.
4. Use **Manage Assigned Assets** to choose the specific assets for that Module. An asset being Active does not assign it to your Project.
5. Use **Open Project Scene** to work in the Dashboard. Choose **Save ThreeD Project** in the Project menu, or the toolbar Save icon, to retain its content and workspace, then reopen it to check your work.

Existing Project **Setup** changes use **Save Changes**; **Reset changes** restores the loaded values. **Reload configuration** reads the saved configuration and asks before discarding a changed draft. Module/asset controls have their own explicit operations; review their results before leaving.

**ThreeD > Designs** at `/admin/threed/designs` summarizes architecture in your Projects. Drawing walls, floors, roofs and openings takes place in the Project Scene's Design workspace and uses Project Save. It does not create a separate reusable Model. Continue with the [Dashboard guide](DASHBOARD_GUIDE.md) for Scene editing.

## Prepare Models, Files and Materials

1. Open **ThreeD > Models > All Models** at `/admin/threed/models`. Search/filter existing Models or choose **Add Model**. Use **Bulk Import Models** when importing a bundle or several supported Models together.
2. Review the Model's **Details** and preview. A reusable Model and its placed Project instances are separate; creating a Model does not place it in a Project.
3. Open the Model's **Files** view, or **ThreeD > Models > Files**, to inspect saved geometry and attachments. **Required files** identifies missing dependencies. Upload the requested files with their correct names/relative paths, then review the preview again.
4. In **Materials**, choose a material and channel, preview the Texture, and save the assignment to that material or all supported materials. Uploading or registering a Texture alone does not assign it.

Details drafts and Files/appearance operations save separately. A primary file uploaded in Details remains staged until **Create Model** or **Save Changes** succeeds; wait for that confirmation before leaving. Files attachment and Material assignment operations have their own save feedback. A readiness message does not establish that every texture rendered correctly.

**Linked Texture and embedded resources** lets you inspect supported saved GLB/GLTF images, download originals, or explicitly register selected images as reusable Textures. **Attach saved thumbnail**, when offered, adds an attachment reference for an existing saved thumbnail. See [Model administration](../developers/THREED_MODEL_ADMIN.md#model-editor-layout) and [embedded image inspection](../developers/THREED_MODEL_ADMIN.md#embedded-image-inspection-and-reuse) for details and limits.

**Library Preview Image** is the catalog thumbnail; **Top View Image** represents the Model in the plan. On a saved Model, **Export Top View Image** captures a transparent footprint. In Details, using the image fills the form; choose **Save Changes** to select it for the Model. The Top View upload attaches its File immediately, while selecting that image for the plan still follows the Details save.

For generated geometry, open **ThreeD > Models > Model Builder**. Adjust the Cottage dimensions in inches, choose **Generate Preview**, then download the metre-based GLB/manifest or capture a PNG. **Save as New Model** creates a private, inactive Model with managed PBR textures. Review and activate it before placing it through a Project's Model Library. See the [Builder workflow and limitations](../developers/THREED_MODEL_BUILDER.md#builder-workflow).

## Manage Users as a Super Admin

Open **Users > All Users** at `/admin/users`. Search by name/email or filter by role and **Current Users**, **Deleted Users** or **All Users**.

1. Choose **Add User** to open `/admin/users/new`.
2. Enter **Name**, **Email** and **Initial password**. The password needs at least eight characters and at most 72 UTF-8 bytes.
3. Choose **Create User**. The new User is an Admin of their own content; save first before changing their role. Share the initial credentials securely. No invitation email is sent, and your own session stays signed in.
4. Use **Edit** to change name, email or role, then **Save Changes**. **Discard** restores saved values. Account activity is read-only. Role changes are audited; the last active Super Admin cannot be demoted.

To remove account access, save or discard pending edits, choose **Delete User**, type the saved email exactly, and choose **Confirm Delete User**. This retains the User record and blocks sign-in/session access. You cannot delete yourself, the last active Super Admin, or a User who owns content.

Choose **Deleted Users** in the account filter to inspect retained accounts. Their fields are read-only and their email addresses remain reserved. There is no Restore, invitation or password-reset workflow here. Installation prerequisites belong to the [developer account-management guide](../developers/SUPER_ADMIN_BOOTSTRAP.md#users-crud-and-deletion).

## Add and display Lyrics

1. Open **Multimedia > Lyrics** at `/admin/multimedia/lyrics` and choose **Add Lyrics**.
2. Enter a **Title** and plain-text **Lyrics**. Text may be empty while drafting. Set **Sort Order** and **Active** as needed.
3. Optionally select owned **Projects**, **Albums** and **Tracks**. Search and check records to assign them; uncheck or remove a selected chip to detach them. Lyrics can stand alone, and assigning a Track does not require assigning its Album too.
4. Choose **Save Changes**. The list's Albums, Tracks and Projects badges show assignments and link to their Admin records. Use **Edit** to revise the text or assignments.

The **Lyrics** tab on an Admin Track player shows active Lyrics directly assigned to that Track. The Dashboard Album player and Home featured player show eligible active Lyrics assigned to the Album or its active Tracks, with duplicate records shown once. Public display requires a Public, Published Album and Lyrics owned by the same User. Project-only assignments do not publish Lyrics. The older Track Lyrics field remains separate; it does not synchronize with these records. See the [Lyrics workflow](../developers/MULTIMEDIA_LYRICS.md).

## Adjust App Settings

Open **Settings > App Settings** at `/admin/settings`. Super Admins can change shared Module icons/colors through **Save Module appearance**. Personal **Appearance**, **Module Navigation** and **Dashboard Menu Links** use **Save Changes**. Scene appearance and Model PNG defaults belong to this browser. See [App Settings: global and personal](SETTINGS.md) for save, reset and conflict handling.

## FarmBot connection setup

Open **ThreeD > FarmBots**, then choose **FarmBot Connection** or **MQTT Activity** from an owned FarmBot record. The selected section expands beneath that record; opening one closes the other.

1. Generate and store a credential with the FarmBot account login workflow, or store a current FarmBot JWT directly.
2. Select **Test** and confirm REST authentication, the FarmBot REST device ID and the MQTT broker identity.
3. Select **Discover** under **Configured peripherals** and explicitly assign the correct peripheral to Water.
4. Select **Validate** to confirm the stored Water assignment still matches FarmBot.
5. Review the broker metadata and select **Readiness** to check eligibility for the read-only MQTT worker.
6. Open **MQTT Activity**, select **Start read-only**, and inspect connected state, recent status/message times and X/Y/Z position. Select **Stop** when the session is no longer needed.

Stored credentials are encrypted and never displayed again. The current integration observes allowlisted status; it does not send movement, Water, pin or other physical commands. Connection readiness does not authorize device control. See [FarmBot integration](../developers/FARMBOT_INTEGRATION.md) for deployment prerequisites and boundaries.

Earlier prototype instructions and their historical scope are preserved in the [user-guide archive](../releases/history/2026-10-27/README.md).
