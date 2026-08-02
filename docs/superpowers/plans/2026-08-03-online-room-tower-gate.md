# Online Room Tower Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy online room form with a responsive Toy Tower Gate lobby and a motion-coordinated transition into multiplayer combat.

**Architecture:** Keep `OnlineLobby` as the presentation boundary for create/join selection, controlled field values, errors, and busy visuals. Preserve the existing `onCreate`, `onJoin`, and `onBack` contracts; derive transition visuals from the existing `busy` prop so networking remains owned by `App`. Isolate the visual world in a dedicated stylesheet imported by the component so legacy menu and in-combat styles remain untouched.

**Tech Stack:** React 19, TypeScript 5.9, CSS animations and responsive media queries, Vitest, Testing Library, Vite.

## Global Constraints

- Do not use Git.
- Remove “Phase 3,” “sandbox,” and technical server-authority copy from the room screen.
- Preserve room networking, server authority, combat behavior, persistence, and database schemas.
- Preserve exact `onCreate(displayName)`, `onJoin(displayName, roomCode)`, and `onBack()` callback contracts.
- Keep `Create Room` and `Join Room` as accessible action names.
- Interactive targets must be at least 44 by 44 pixels and safe-area aware.
- Support English and Thai layout expansion, keyboard navigation, visible focus, color-independent state, and `prefers-reduced-motion`.
- Do not add external art or dependencies.

## File Structure

- Modify `apps/client/src/ui/OnlineLobby.tsx`: semantic structure, create/join presentation state, form submission, busy/error announcements, and decorative tower markup.
- Create `apps/client/src/ui/online-lobby.css`: complete Toy Tower Gate visual world, responsive layouts, tactile states, and reduced-motion behavior.
- Modify `apps/client/tests/OnlineUi.test.tsx`: user-facing copy, path switching, callbacks, busy state, errors, and accessibility contracts.

---

### Task 1: Room Path Behavior and Accessible Form Contract

**Files:**
- Modify: `apps/client/tests/OnlineUi.test.tsx`
- Modify: `apps/client/src/ui/OnlineLobby.tsx`

**Interfaces:**
- Consumes: `busy: boolean`, `error: string`, `onCreate(displayName: string)`, `onJoin(displayName: string, roomCode: string)`, `onBack()`.
- Produces: an accessible form with `path: 'create' | 'join'` as local presentation state; selected path buttons with `aria-pressed`; contextual submit button with stable accessible names.

- [ ] **Step 1: Write failing behavioral tests**

Add assertions that the default view shows “Gather at the Tower Gate,” contains no “Phase 3” or “sandbox,” defaults to Create, hides Room code, switches to Join, reveals Room code, dispatches exact callback payloads, and calls Back.

```tsx
expect(screen.getByRole('heading', { name: 'Gather at the Tower Gate' })).toBeVisible();
expect(screen.queryByText(/phase 3|sandbox/i)).not.toBeInTheDocument();
expect(screen.getByRole('button', { name: 'Start an expedition' })).toHaveAttribute('aria-pressed', 'true');
expect(screen.queryByLabelText('Room code')).not.toBeInTheDocument();
fireEvent.click(screen.getByRole('button', { name: 'Join your party' }));
expect(screen.getByLabelText('Room code')).toBeVisible();
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run apps/client/tests/OnlineUi.test.tsx`

Expected: FAIL because the legacy heading and always-visible room code do not satisfy the new contract.

- [ ] **Step 3: Implement semantic behavior**

Refactor `OnlineLobby` to use a `<form>`, local create/join state, conditional room-code rendering, and one submit handler:

```tsx
type LobbyPath = 'create' | 'join';
const [path, setPath] = useState<LobbyPath>('create');
const submit = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  if (busy) return;
  if (path === 'create') onCreate(displayName);
  else onJoin(displayName, roomCode);
};
```

Keep decorative tower elements `aria-hidden="true"`. Use `aria-pressed` on selector buttons, `aria-label={path === 'create' ? 'Create Room' : 'Join Room'}` on submit, and a real Back button.

- [ ] **Step 4: Run the focused test and verify pass**

Run: `npx vitest run apps/client/tests/OnlineUi.test.tsx`

Expected: PASS.

---

### Task 2: Busy and Error Interaction States

**Files:**
- Modify: `apps/client/tests/OnlineUi.test.tsx`
- Modify: `apps/client/src/ui/OnlineLobby.tsx`

**Interfaces:**
- Consumes: the Task 1 form and existing `busy` and `error` props.
- Produces: `data-connection-state="idle|opening|error"` on the lobby shell, one polite busy status, one assertive error summary, and duplicate-submit prevention.

- [ ] **Step 1: Write failing state tests**

```tsx
const view = render(<OnlineLobby busy onCreate={create} onJoin={join} error="" onBack={() => {}} />);
expect(screen.getByRole('status')).toHaveTextContent('Opening the gate…');
expect(screen.getByRole('button', { name: 'Create Room' })).toBeDisabled();
fireEvent.submit(screen.getByRole('button', { name: 'Create Room' }).closest('form')!);
expect(create).not.toHaveBeenCalled();
view.rerender(<OnlineLobby busy={false} error="That room could not be found." onCreate={create} onJoin={join} onBack={() => {}} />);
expect(screen.getByRole('alert')).toHaveTextContent('That room could not be found.');
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run apps/client/tests/OnlineUi.test.tsx`

Expected: FAIL until the new status and shell state are exposed.

- [ ] **Step 3: Implement state semantics**

Derive `connectionState` from `busy` and `error`, disable path selectors and submit while busy, associate the error with inputs through the existing generated ID, and render “Opening the gate…” once inside `role="status"`.

- [ ] **Step 4: Run the focused test and verify pass**

Run: `npx vitest run apps/client/tests/OnlineUi.test.tsx`

Expected: PASS.

---

### Task 3: Toy Tower Gate Visual System and RPG Motion

**Files:**
- Create: `apps/client/src/ui/online-lobby.css`
- Modify: `apps/client/src/ui/OnlineLobby.tsx`

**Interfaces:**
- Consumes: Task 2 semantic classes and `data-connection-state` values.
- Produces: desktop two-column tower-and-form composition, mobile stacked composition, short-landscape adaptation, create/join color states, opening-door animation, error wobble, and reduced-motion fallback.

- [ ] **Step 1: Import the dedicated stylesheet and add stable visual hooks**

Use class names scoped beneath `.tower-gate-lobby`, including `.tower-gate-scene`, `.tower-gate`, `.tower-gate__doors`, `.tower-gate__party`, `.tower-gate-panel`, `.tower-gate-paths`, and `.tower-gate-submit`.

- [ ] **Step 2: Implement the desktop composition and material system**

Define local CSS custom properties using the established palette. Build molded surfaces with thick cocoa borders, inset highlights, offset shadows, and non-uniform silhouettes. Reserve gold for Create and mint for Join. Use a sky field and CSS-authored tower scenery rather than external assets.

- [ ] **Step 3: Implement purposeful motion**

Animate initial layer arrival, one tower settle, gentle flag sway, path-panel slide, state-specific doorway light, busy door opening, stepping lights, and one error wobble. Restrict animation to transforms and opacity. Add tactile hover, active, disabled, and focus-visible states.

- [ ] **Step 4: Implement responsive and reduced-motion rules**

At `max-width: 760px`, stack the tower above a compact control sheet. At short landscape heights, reduce scene height and ornament density. Under `prefers-reduced-motion: reduce`, disable idle and state animations and retain only immediate state changes.

- [ ] **Step 5: Run behavior and static verification**

Run:

```powershell
npx vitest run apps/client/tests/OnlineUi.test.tsx
npx eslint apps/client/src/ui/OnlineLobby.tsx apps/client/tests/OnlineUi.test.tsx
npm run typecheck
npm run build:client
```

Expected: all commands pass.

- [ ] **Step 6: Inspect desktop and mobile together, then fix one batch**

Capture a desktop viewport near 1440 by 900, a mobile portrait viewport near 390 by 844, and a short landscape viewport near 844 by 390. Check overflow, hierarchy, form visibility, tower-door transition, error readability, 44-pixel targets, and focus. Apply one consolidated correction batch, then confirm once.

---

## Plan Self-Review

- Spec coverage: content, hierarchy, create/join behavior, busy/error states, tactile material, responsive layouts, motion, reduced motion, accessibility, and verification each map to a task.
- Type consistency: all tasks preserve the existing `OnlineLobby` prop signatures and introduce only local `LobbyPath` state.
- Scope: the plan changes only the online lobby presentation and its focused tests; no server, protocol, persistence, database, mode-selection, or in-combat UI work is included.
- Git: no Git command or commit step is included.

