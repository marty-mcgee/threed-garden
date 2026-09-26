# Agent Task Checklists

## Prove

- Read `AGENTS.md`, `CONTEXT.md`, and relevant source files completely.
- Record the specific problem, affected files, existing code paths, and acceptance criteria.
- Inspect the worktree and distinguish user-owned changes from task changes.

## Act

- Make the smallest scoped change that meets the acceptance criteria.
- Avoid unrelated refactors, schema guesses, secret handling, and behavior expansion.
- Preserve stable runtime and API contracts unless the task explicitly changes them.
- For FarmBot work, confirm the approved ThreeD FarmBot Integration Plan phase and do not cross into a later phase, new external resource, schema change, MQTT connection, or physical operation without separate approval.

## Document

- Follow [Validation](VALIDATION.md), starting with the narrowest useful check.
- Review the final diff for unrelated changes and whitespace errors.
- Update durable documentation only after the implementation is proven.
- Report every changed file, command result, assumption, risk, and remaining manual check.
