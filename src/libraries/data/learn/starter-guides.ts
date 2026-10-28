import type { LearnGuideInput } from '@/libraries/services/learn/contracts';

// Imported only through the explicit Super Admin action; never a public fallback or automatic seed.
export const starterLearnGuides: LearnGuideInput[] = [
  {
    "title": "Draw a room",
    "slug": "draw-room",
    "summary": "Walls, floor and hosted openings appear in both views and in Project Assets under Architecture.",
    "content": "## Steps\n\n1. Open your own Project and choose Design in the View Mode controls.\n2. In the toolbar at the upper-right inside the 2D canvas, choose Wall. Click a start and end corner for each wall; use snapping to join corners.\n3. Choose Floor and click at least three corners. Finish Floor, Enter, or clicking the first corner completes it. Escape cancels an unfinished draft.\n4. Choose Door or Window and click a wall with enough space. Inspect the opening and its dimensions in Design Properties.\n5. Inspect the room in the Scene, then Save ThreeD Project to retain it.\n\n## Expected result\n\nWalls, floor and hosted openings appear in both views and in Project Assets under Architecture.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/DASHBOARD_GUIDE.md)\n",
    "sortOrder": 10,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Add a Model",
    "slug": "add-model",
    "summary": "The Project stores its placed instance. Changing its position does not replace the reusable Model file. A Ready label describes setup; the preview checks actual file loading.",
    "content": "## Steps\n\n1. Open a Project you own. Choose Add, then Models in the Project toolbar.\n2. Browse the Model Library. Inspect previews a reusable Model; Place starts adding an instance to this Project. Review loading feedback and follow the placement prompt.\n3. To work with an instance already placed, select it in Project Assets and use its DetailsCard. Placing from the Library again creates another instance.\n4. Save ThreeD Project, reopen it and check the Model is still present.\n\n## Expected result\n\nThe Project stores its placed instance. Changing its position does not replace the reusable Model file. A Ready label describes setup; the preview checks actual file loading.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/DASHBOARD_GUIDE.md)\n",
    "sortOrder": 20,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Edit properties and measurement units",
    "slug": "object-properties",
    "summary": "Architecture uses Design Properties; placed Models use their DetailsCard. Each shows the controls supported by the selected object.",
    "content": "## Steps\n\n1. In Design mode, select a shape in the plan or choose its entry in Project Assets > Architecture.\n2. In Design settings, choose Project measurement units. Imperial uses inch inputs and foot rulers; Metric uses centimetre inputs and metre rulers. Switching units does not resize objects.\n3. Expand Properties in Design Properties. Change a supported value, such as wall length or height; rotation uses degrees. Check the plan and Scene. Undo reverses the edit; Redo reapplies it.\n4. Use Locate beside an Architecture entry to frame it in the current view. Save ThreeD Project to keep your edits and unit preference.\n\n## Expected result\n\nArchitecture uses Design Properties; placed Models use their DetailsCard. Each shows the controls supported by the selected object.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/THREED_CONTROLS.md)\n",
    "sortOrder": 30,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Switch View Modes and navigate",
    "slug": "view-modes",
    "summary": "Design places the Scene above the editable plan. Its rulers follow pan and zoom, and the divider resizes the available space.",
    "content": "## Steps\n\n1. Use the Project toolbar to choose 3D, Design, 2D or Combined. These show the same active Project. Design includes the editable plan; 2D is the map view.\n2. In the 3D Scene, drag to orbit and scroll to zoom. Release Character control before practicing ordinary camera navigation.\n3. In the Design plan, use Pan, Alt-drag or middle-drag to pan. Scroll to zoom at the pointer.\n4. Use Fit Plan, Zoom to Selection or Reset View to frame your work. Hover or focus the icons for their names. Open Setup > Project Tour for setup guidance.\n\n## Expected result\n\nDesign places the Scene above the editable plan. Its rulers follow pan and zoom, and the divider resizes the available space.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/THREED_CONTROLS.md)\n",
    "sortOrder": 40,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Save and reopen",
    "slug": "save-reopen",
    "summary": "The existing Project Save retains architectural content, placed assets and supported workspace preferences together.",
    "content": "## Steps\n\n1. Sign in and open a Project you own. Make a small edit.\n2. Use Save ThreeD Project in the Project menu, or the Save icon at the right of the toolbar. A green outline with a yellow dot indicates unsaved changes. Explicitly save camera and inspector choices too, even if they do not change the badge.\n3. Wait for the ThreeD Project saved message. If saving fails, keep the page open, read the error and retry. Edits made while saving can require another Save.\n4. Return to Dashboard, open the same Project and inspect your change. In Design, select the saved shape and confirm its dimensions are still editable.\n\n## Expected result\n\nThe existing Project Save retains architectural content, placed assets and supported workspace preferences together.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/GETTING_STARTED.md)\n",
    "sortOrder": 50,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Import or export a design backup",
    "slug": "design-json",
    "summary": "Imported architecture receives fresh IDs. This export is an architectural backup; it does not include the complete Project or recover catalog Model files.",
    "content": "## Steps\n\n1. In Design mode, choose Export JSON in the Project toolbar to download the supported editable architecture.\n2. Choose Import JSON for a supported Design backup or legacy plan. Select a file, then choose Merge architectural content or Replace architectural content only.\n3. Review converted counts, validation messages and omissions. When offered, acknowledge Import supported architecture only before continuing.\n4. Merge adds imported architecture. Replacement replaces architectural content only; unrelated Models and Scene content are retained. Cancel and invalid input leave the design unchanged.\n5. Inspect a successful import, then Save ThreeD Project.\n\n## Expected result\n\nImported architecture receives fresh IDs. This export is an architectural backup; it does not include the complete Project or recover catalog Model files.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/DASHBOARD_GUIDE.md)\n",
    "sortOrder": 60,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Prepare Model Files and Materials",
    "slug": "model-files",
    "summary": "Files, Materials and preview images have distinct jobs. Inspect the actual Model preview before placing it; a missing thumbnail or Texture assignment does not always mean missing geometry.",
    "content": "## Steps\n\n1. In Admin > ThreeD > Models, open a Model you own and choose Files.\n2. Review Required files. Attach the named dependencies or use eligible shared Textures. An OBJ material library can reveal additional texture requirements.\n3. Use Materials to inspect the loaded surfaces and save intended Texture assignments. Embedded GLB/GLTF images can be inspected and explicitly saved as reusable Textures; this does not automatically reassign Materials.\n4. Use Library Preview Image for the catalog thumbnail and Top View Image for the plan representation. Review each image action and save any pending Details changes with Save Changes.\n\n## Expected result\n\nFiles, Materials and preview images have distinct jobs. Inspect the actual Model preview before placing it; a missing thumbnail or Texture assignment does not always mean missing geometry.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/ADMIN_GUIDE.md)\n",
    "sortOrder": 70,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Align a Ground Map",
    "slug": "ground-map",
    "summary": "The image provides a flat site reference. Aligning it does not move existing objects or generate terrain from its pixels.",
    "content": "## Steps\n\n1. Open your own ThreeD Project. In Environment, choose Ground Map · Edit settings.\n2. Enter Source and Attribution when required by the image provider, then use Upload Ground Map Image for a PNG, JPG or static WebP reference.\n3. Choose Uploaded Image, then adjust Width, Length, Center, Elevation, Rotation and Opacity. These position and size fields use Scene units; read their labels separately from Design measurement preferences.\n4. Inspect alignment beside your existing objects, then Save ThreeD Project. Uploading the image alone does not save later alignment changes.\n\n## Expected result\n\nThe image provides a flat site reference. Aligning it does not move existing objects or generate terrain from its pixels.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/THREED_GROUND_MAPS.md)\n",
    "sortOrder": 80,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Control a Character and choose a target",
    "slug": "character-actions",
    "summary": "Autonomous Characters and movable Characters retain different controls. FarmBot targeting animates the Character; it does not send physical device commands.",
    "content": "## Steps\n\n1. Select a movable Character and open its DetailsCard. Choose Take Control and use WASD to move; Release Control returns to ordinary navigation.\n2. Select a supported Scene object and choose Use as Action Target, then return to the Character actions. Read the readiness and range feedback.\n3. Choose an available action. Targeted Water and Pick Fruit require their supported Planting target and save their result after the action completes.\n4. If an action is inactive, check compatible Animation assignments in Admin. Importing an Animation alone does not assign it to a Character.\n\n## Expected result\n\nAutonomous Characters and movable Characters retain different controls. FarmBot targeting animates the Character; it does not send physical device commands.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/THREED_CONTROLS.md)\n",
    "sortOrder": 90,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Open a Scenario or run a Simulation",
    "slug": "scenarios-simulations",
    "summary": "Scenarios provide guidance; Simulations run supported Actions. Captured Results are read-only records, separate from editable Simulation definitions.",
    "content": "## Steps\n\n1. Use Setup > Scenarios and Choose Scenario. Review and complete its setup checks, then choose Open Scenario when ready to display the plan guidance.\n2. For an executable workflow, use Setup > Simulations and choose an available saved definition. A Scenario is not required.\n3. Review the Actions and setup feedback, then Run Simulation. The current Scene runner supports Run to target ball and Kick ball using a Character and a ball.\n4. Review Results after an owner run. If saving the result fails, Retry result save retries persistence without repeating the Actions. Public runs remain local.\n\n## Expected result\n\nScenarios provide guidance; Simulations run supported Actions. Captured Results are read-only records, separate from editable Simulation definitions.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/help/threed-simulations.md)\n",
    "sortOrder": 100,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Explore Multimedia and add Lyrics",
    "slug": "multimedia-lyrics",
    "summary": "Public Lyrics require an eligible Public, Published Album and active Lyrics owned by the same account. A Project-only assignment does not publish Lyrics.",
    "content": "## Steps\n\n1. Open Dashboard > Multimedia to browse available public Albums and play their Tracks. Use the Lyrics tab when eligible Lyrics are available.\n2. To manage your own records, open Admin > Multimedia > Lyrics and choose Add Lyrics.\n3. Enter Title and Lyrics, choose Sort Order and Active, and optionally assign your own Projects, Albums or Tracks. Choose Save Changes.\n4. Review linked assignment badges and the relevant player. The owner Admin Track player uses directly assigned active Track Lyrics; public players use eligible Album and Track assignments.\n\n## Expected result\n\nPublic Lyrics require an eligible Public, Published Album and active Lyrics owned by the same account. A Project-only assignment does not publish Lyrics.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/ADMIN_GUIDE.md)\n",
    "sortOrder": 110,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Find your way around Admin",
    "slug": "admin-navigation",
    "summary": "Admin manages records and assignments; the Project workspace assembles and saves the Scene. Global account authority does not grant access to everyone else’s private content.",
    "content": "## Steps\n\n1. Sign in and open Admin. Ordinary Admins manage their own content; Super Admin additionally manages Users and global App Settings.\n2. Expand the sidebar Module you need. Projects includes All Projects and Add Project; ThreeD includes Models, Designs, Characters and other spatial records; Multimedia and Traffic have their own sections. Learn > Learn ThreeD opens these public guides.\n3. Use Add actions to create records and Edit to update existing ones. Admin creation buttons are usually green. Sidebar creation links keep ordinary navigation styling, with separate current-page highlighting.\n4. Use the list search, filters and linked relationship badges to find related records. Sidebar expansion is remembered per signed-in account in this browser.\n\n## Expected result\n\nAdmin manages records and assignments; the Project workspace assembles and saves the Scene. Global account authority does not grant access to everyone else’s private content.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/ADMIN_GUIDE.md)\n",
    "sortOrder": 120,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Personalize the App",
    "slug": "app-settings",
    "summary": "Global Module appearance, personal account preferences and browser-local controls have separate scopes and Save actions.",
    "content": "## Steps\n\n1. Open Admin > Settings > App Settings. Adjust Appearance, Module Navigation or Dashboard Menu Links, then Save Changes for account preferences.\n2. Scene Appearance stays in this browser. Model Preview Images has its own browser-local save control. Hiding a navigation item does not delete its data or revoke access.\n3. As an active Super Admin, expand Module colors and icons, then a group and Module, including Learn. Choose its color and icon and use Save Module appearance to update the shared App identity.\n4. Restore defaults prepares a draft; review it before saving. Discard restores saved values. If another session saved first, retain your intended changes, reload the current settings and reapply them.\n\n## Expected result\n\nGlobal Module appearance, personal account preferences and browser-local controls have separate scopes and Save actions.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/SETTINGS.md)\n",
    "sortOrder": 130,
    "isActive": true,
    "isPublished": true
  },
  {
    "title": "Add and manage Users",
    "slug": "manage-users",
    "summary": "Deleted Users remain stored and cannot sign in or use sessions. Their emails remain reserved; the Deleted Users filter is read-only and has no Restore action.",
    "content": "## Steps\n\n1. As an active Super Admin, open Admin > Users > Add User. Enter Name, Email and an Initial password, then Create User.\n2. The new account starts as an Admin of its own content. Share the credentials securely; this workflow does not send an invitation email or switch your signed-in session.\n3. Use Edit to change profile details or role, then Save Changes. Activity is read-only, and the last active Super Admin cannot be demoted.\n4. For Delete User, enter the saved email to confirm. Deletion is blocked for yourself, the last active Super Admin and Users who own content.\n\n## Expected result\n\nDeleted Users remain stored and cannot sign in or use sessions. Their emails remain reserved; the Deleted Users filter is read-only and has no Restore action.\n\n[Read the full Markdown guide](https://github.com/marty-mcgee/threed-garden/blob/main/docs/users/SETTINGS.md)\n",
    "sortOrder": 140,
    "isActive": true,
    "isPublished": true
  }
];
