# Contribution Guidelines for this project

## Product Overview

This software is an interactive website for creating a curriculum vitae (CV) with a user-friendly interface. Users can input their personal information by clicking and typing text or selecting options. The browser's print preview is used to verify page breaks and save the CV as a PDF. The rendered HTML is proportionally equal to the PDF.

## Tech Stack

- **Framework**: Astro
- **Language**: JavaScript/TypeScript
- **Package Manager**: pnpm (or npm)
- **Build Output**: Static HTML/CSS/JS to `dist/`

## Project Structure

```text
easy-cv/
├── src/          # Source files
├── public/       # Static assets
├── dist/         # Build output (generated)
├── astro.config.mjs
└── package.json
```

## Git Branching Model

### Branch Types

**Permanent branches:**

- **`main`** (release branch) — reflects released production state, commits arrive via cherry-pick PRs, no direct pushes
- **`integration`** — accumulates all completed work via rebase merge, must always be in a releasable state, no direct pushes

**Standalone issue branches:**

- **`issue/<number>-description`** (implementation) — short-lived, branched from `integration`, one per GitHub issue, deleted after merge. E.g. `issue/42-buggy-fido-auth`
- **`release/issue/<number>`** (release) — short-lived, branched from `main`, cherry-picks a standalone issue's commits for release via PR to `main`, deleted after merge. E.g. `release/issue/42`

**Experiment branches** (product discovery — grouping related issues):

- **`experiment/<id>`** (intermediate integration) — short-lived, branched from `integration`, encompasses issues belonging to a particular experiment, deleted after merge to `integration`. E.g. `experiment/increase-engagement-with-dark-mode`
- **`experiment/<id>/issue/<number>-description`** (implementation) — short-lived, branched from `experiment/<id>`, deleted after merge. E.g. `experiment/increase-engagement-with-dark-mode/issue/43-add-toggle`
- **`release/experiment/<id>`** (release) — short-lived, branched from `main`, cherry-picks all commits of the experiment for release as a group, deleted after merge. E.g. `release/experiment/increase-engagement-with-dark-mode`

**Solution branches** (product delivery — grouping related issues):

- **`solution/<id>`** (intermediate integration) — short-lived, branched from `integration`, encompasses issues belonging to a particular solution, deleted after merge to `integration`. E.g. `solution/pdf-export`
- **`solution/<id>/issue/<number>-description`** (implementation) — short-lived, branched from `solution/<id>`, deleted after merge. E.g. `solution/pdf-export/issue/44-generate-pdf`
- **`release/solution/<id>`** (release) — short-lived, branched from `main`, cherry-picks all commits of the solution for release as a group, deleted after merge. E.g. `release/solution/pdf-export`

### Key Invariant

`integration` must always be in a releasable state. Every merge to `integration` must pass CI, be reviewed, and be production-ready. This eliminates the need for hot fixes or stabilisation phases — any bug fix can be released quickly through the normal workflow.

### Code Flow

Code flows in one direction per path, with no synchronisation between `main` and `integration`:

**Standalone issues:**

- **Integration:** `issue/*` → `integration` (PR rebase merge)
- **Release:** cherry-pick from `integration` → `release/issue/*` → `main` (PR merge)

**Grouped issues (experiments or solutions):**

- **Implementation:** `experiment/<id>/issue/*` → `experiment/<id>` (PR rebase merge)
- **Integration:** `experiment/<id>` → `integration` (PR rebase merge)
- **Release:** cherry-pick from `integration` → `release/experiment/<id>` → `main` (PR rebase merge)
- (Same pattern for `solution/`)

`main` and `integration` maintain independent histories. `main` reflects release order, `integration` reflects integration order. These may differ.

### Merge Strategies

| Integration Point                             | Strategy     | Rationale                                                            |
| --------------------------------------------- | ------------ | -------------------------------------------------------------------- |
| `issue/*` → `integration`                     | Rebase merge | Linear history, individual commits preserved                         |
| `experiment/<id>/issue/*` → `experiment/<id>` | Rebase merge | Linear history within the experiment                                 |
| `solution/<id>/issue/*` → `solution/<id>`     | Rebase merge | Linear history within the solution                                   |
| `experiment/<id>` → `integration`             | Rebase merge | Linear history, all experiment commits preserved                     |
| `solution/<id>` → `integration`               | Rebase merge | Linear history, all solution commits preserved                       |
| `release/*` → `main`                          | Rebase merge | Cherry-picked commits replayed onto `main`, linear history preserved |

### Protected Branches and Push Rules

- `main` and `integration`: no direct pushes, no force pushes, changes only via PRs
- `experiment/<id>` and `solution/<id>`: developers may create branches and push; force push allowed
- `release/*`: only the CI is allowed to create and cherry-pick commits; developers may delete; push and force-push not allowed
- `issue/*`, `experiment/<id>/issue/*`, `solution/<id>/issue/*`: developers may create, push, and force-push

### Tagging and Versioning

- Annotated tags (`git tag -a`) on `main` after each release merge
- Format: `v<major>.<minor>.<patch>`
- Tags are immutable — never deleted or moved
- **Version derivation** — analyse the cherry-picked commits relative to the last version tag on `main`:
  1. If any commit has a breaking change: bump **major**, reset minor and patch to 0
  2. Else if any commit has type `behav`: bump **minor**, reset patch to 0
  3. Otherwise: bump **patch**

## Release Workflow

### Releasing a Standalone Issue

Step-by-step:

1. Confirm the issue has been merged to `integration` and CI has passed
2. Collect all commits belonging to the issue
3. Check `Based-on:` footers — ensure all referenced commits have already been released to `main`. If not, wait until they are released.
4. Create a release branch from `main`: `git checkout -b release/issue/42 main`
5. Cherry-pick the issue's commits onto the release branch
6. Resolve any conflicts if the cherry-pick doesn't apply cleanly
7. Open a PR from `release/issue/42` targeting `main`
8. After approval and CI pass, merge the PR
9. Determine the new version (see Tagging and Versioning)
10. Tag the new `main` tip: `git tag -a v<version> -m "Release v<version>"`
11. Push the tag
12. Delete the release branch

### Releasing an Experiment or Solution

Experiments and solutions are always released as a whole — all issues in the group are released together.

Step-by-step:

1. Confirm all issues of the experiment/solution have been merged to their intermediate integration branch, and the intermediate branch has been merged to `integration`, and CI has passed
2. Collect all commits belonging to the experiment/solution
3. Check `Based-on:` footers — ensure all referenced commits have already been released to `main`. If not, wait until they are released.
4. Create a release branch from `main`: `git checkout -b release/experiment/<id> main`
5. Cherry-pick all of the experiment's/solution's commits onto the release branch
6. Resolve any conflicts
7. Open a PR targeting `main`
8. After approval and CI pass, merge the PR
9. Determine the new version (see Tagging and Versioning)
10. Tag and push
11. Delete the release branch

### Parallel Releases

Multiple releases (standalone issues, experiments, solutions) may be in-flight simultaneously. Since each release branch is cut from `main` and contains only its own commits, releases are independent. If two releases target overlapping code, the second to merge may encounter cherry-pick conflicts — resolve these normally.

## Development Workflow

### Implementing a Standalone Issue

Step-by-step:

1. Create a branch from `integration`: `git checkout -b issue/42-short-description integration`
2. Develop with conventional commits, keeping commits small and focused
3. Keep the branch current by rebasing onto `integration`
4. Open a PR targeting `integration`
5. Address review feedback with additional commits
6. After approval and CI pass, rebase-merge into `integration`
7. Delete the branch

### Implementing an Experiment or Solution

Step-by-step:

1. Create the intermediate integration branch from `integration`: `git checkout -b experiment/<id> integration`
2. For each issue in the experiment/solution:
   a. Create an issue branch from the intermediate branch: `git checkout -b experiment/<id>/issue/43-description experiment/<id>`
   b. Develop with conventional commits, keeping commits small and focused
   c. Keep the issue branch current by rebasing onto the intermediate branch
   d. Open a PR targeting `experiment/<id>`
   e. After approval and CI pass, rebase-merge into `experiment/<id>`
   f. Delete the issue branch
3. Keep the intermediate branch current by rebasing onto `integration`: `git fetch origin && git rebase origin/integration`
4. When all issues are complete, open a PR to rebase-merge `experiment/<id>` into `integration`
5. After approval and CI pass, rebase-merge into `integration`
6. Delete the intermediate branch

### Bug Fixes

All bugs — including those discovered in production on `main` — are regular issues:

1. Create an issue
2. Branch from `integration` (or from the relevant experiment/solution branch if the bug is scoped to one), implement the fix using commit type `behavfix` or `perffix`
3. PR to the appropriate target
4. Release via the normal release workflow

## Committing changes

### Scoping and sizing commits

One commit should represent a single logical change. If possible keep changes scoped to a single domain or logical unit. Keep commits as small as possible, but as large as necessary. Write a conventional commit message for every commit.

### Writing commit messages

Commit messages follow a variation of the **Conventional Commits** [specification](https://www.conventionalcommits.org/en/v1.0.0/):

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Commit Types

Use the following custom types:

- **behav**: A change in the application behavior
- **behavfix**: A bug fix that affects the application behavior
- **chore**: A configuration, dependency update, or maintenance task that doesn't affect application behavior
- **docs**: A documentation change
- **style**: A code style change, not affecting behavior (formatting, semicolons, reordering statements, etc.)
- **refac**: A code refactoring, not affecting behavior (e.g. renaming variables, extracting functions, changing patterns, etc.)
- **test**: A change affecting dedicated system or integration tests
- **perf**: An improvement in application performance, not affecting behavior (e.g. optimizing algorithms, reducing memory usage, etc.)
- **perffix**: A performance fix, not affecting behavior
- **cicd**: A configuration change of CI/CD pipelines

#### Scopes

Guidelines for scopes:

- Keep scopes consistent with the repository structure
- Maintain a whitelist of allowed scopes in and enforce it via commit linting
- Add as new domains or modules are introduced
- Always use a scope for `behav` and `behavfix` commits
- A scoped commit must only contain changes (files or lines) that belong to the specified scope

#### Breaking changes

Guidelines for breaking changes:

- **Always indicate with `!`** — Always add an exclamation mark after the type/scope for breaking changes

#### Description

Guidelines for the description:

- **Uppercase allowed** — Always start with a capital letter and use uppercase where it serves clarity (e.g. acronyms, proper nouns, etc.)
- **Imperative mood** — Use "Add support for..." not "Added..." or "Adds..."
- **Be concise** — The total length of type, scope, and description must not exceed 80 characters
- **Avoid redundancy** — Don't use words redundant to the type or scope (e.g. "Fix" in a `*fix` commit, etc.)

#### Body

Guidelines for the body:

- **Explain why, not what** — The diff shows what changed; explain the reasoning, context, or problem being solved
- **Wrap at 80 characters** — Wrap lines so they don't exceed 80 characters, but don't cut words, unless it's longer than 80 characters itself
- **Be concise** — A few sentences typically suffice; use bullet points only for multiple related changes
- **Imperative mood** — Use "Add support for..." not "Added..." or "Adds..."
- **One concern per paragraph** — Group related points; separate unrelated ones with blank lines

#### Footers

Guidelines for footers:

- **Explain breaking changes** — Add a `BREAKING-CHANGE:` section explaining why the change is necessary and how to adapt
- **Reference experiment or solution** — If the issue belongs to an experiment or solution, add an `Experiment: <id>` or `Solution: <id>` footer, derived from the GitHub issue
- **Reference issues/tickets** — Always reference GitHub issues with the token `Issue #`
- **Track commit dependencies** — Add `Based-on:` footers referencing commits that this commit directly depends on (one per line). A commit depends on another if it changes the same lines of code or invokes logic changed by that commit. Only list first-level dependencies — do not trace transitive dependencies in depth or breadth. Code-level dependencies (same lines) are identified automatically via `git blame`; logic-level dependencies (invoked changed logic) are added manually by the developer. `Based-on:` footers must appear at the very bottom of the commit message, after all other footers.

Footer order (each optional except `Issue #`):

1. `BREAKING-CHANGE:` (if applicable)
2. `Experiment: <id>` or `Solution: <id>` (if applicable, mutually exclusive)
3. `Issue #` (always present)
4. `Based-on:` (if applicable, always last)

#### Examples

```text
behav(theming): Add a color palette chooser to the toolbar

Add a button in the header to toggle between light and dark themes.
The preference is persisted to localStorage.

Experiment: dark-mode
Issue #123
Based-on: abc1234
Based-on: def5678
```

```text
behavfix(billing)!: Correctly calculate tax for international orders

International regulations have changed, and the previous tax calculation logic
was no longer compliant. This update ensures that tax is calculated correctly
for all orders, regardless of the customer's location.

BREAKING-CHANGE: The tax calculation logic has been updated to comply with
international regulations. Clients must update their tax calculation logic to
accommodate the new rules.

Solution: tax-compliance
Issue #456
```

```text
chore: Update astro dependencies to latest version

Issue #789
```
