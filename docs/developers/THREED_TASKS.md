# ThreeD Tasks visibility

In **Admin > ThreeD > Tasks**, use **Public Task** to share a Task. New Tasks start private and keep their selected status. The Tasks list and direct Task links allow the owner to read their own Tasks and other visitors to read explicitly public Pending Tasks. Task stats count the owner's Tasks and explicitly public Tasks. A public Project Scene can show explicitly public assigned Tasks under its existing Project access rules. Project assignment lists and counts use the same Task visibility rule.

## Bulk Edit

Select Tasks you own on the current Admin Tasks page and choose **Bulk Edit**. You can update Assigned To, Due Date, Task Type, Priority, Status, Activity, or Sort Order in one save. Fields you leave at **Keep current** or leave unchecked retain each Task's value. To remove an assignee or due date, enable the field and leave its value blank. Use **Clear Task Type** to remove a type.

The App saves the whole selection in one transaction. If a selected Task is missing or belongs to another User, the save leaves all selected Tasks unchanged.

## Sort Order

Set **Sort Order** in Add Task or Edit Task. The Tasks table shows the saved rank and sorts by it across pages. Lower ranks appear first by default. Tasks with the same rank appear alphabetically by title. Sort Order starts at 0 and accepts whole numbers from −1,000,000 to 1,000,000.

In **Admin > ThreeD > Tasks**, clear search and sort **Sort Order** ascending. Drag a grip above or below another Task you own on the current page, or focus the grip and press **Arrow Up** or **Arrow Down**. Each move saves immediately and assigns consecutive ranks across your Tasks, preserving the relative order of the other Tasks across pages.

The [Task Sort Order migration](sql/threed-tasks-sort-order.sql) adds `threed_tasks.sort_order` with a default of 0 for existing and new Tasks. Apply it to the intended database before using the new edit controls. Before the migration, the Tasks table can still load alphabetically and writes return a migration-required message. An App rollback can leave the column in place to retain saved ranks.

## Database rollout

The [Task visibility migration](sql/threed-tasks-visibility.sql) adds `threed_tasks.is_public`. It preserves existing Task visibility and defaults future records to private. Before it runs, the updated App shows existing Tasks to their owners with **Visibility unavailable**, keeps other viewers out, and returns a migration-required error on Task writes.

Confirm which database the target App uses. If local development shares production, treat both as readers of the same records. Before adding private Task content, apply the migration to the authorized database and ensure every App deployment that can read that database runs the visibility-aware code. Older deployments can expose new private Pending Tasks through their legacy read rules.

## Verify before a private import

1. With approved test data, confirm the signed-in owner can list and open a private Pending Task. Check that its detail response has `status: "pending"` and `isPublic: false`.
2. Check the same Task signed out and as another User. The Tasks list and search omit it, the direct Task URL returns 404, and stats exclude it. A private Task assigned to a public Project is also absent from the guest and non-owner Scene responses.
3. Confirm an explicitly public Pending Task remains readable by a guest.
4. For each mapped record, search the Tasks list as the intended owner and match its stable Task ID and exact title. Skip an exact match, and review any conflicting match. Submit each missing Task with its stable `taskId`, `status: "pending"` and `isPublic: false`. Leave absent dates and assignees blank. The authenticated User supplies the owner ID.
5. Verify all 20 stable keys are present exactly once for the intended owner, with the original day windows and private Pending status.

Use `npm run validate -- threed-task-privacy threed-project-session` for the offline handler and Scene checks.
