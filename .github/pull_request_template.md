## What changed
<!-- Provide a clear, concise summary of the changes introduced in this PR. -->

## Which spec section this implements
<!-- Reference specific sections in docs/mvp-spec.md or relevant issue. -->
- Section:

## Ownership Boundary Check
- [ ] Changes respect module ownership defined in `docs/AI_DEVELOPMENT_GUIDELINES.md`
- [ ] No direct edits to deterministic validation or deadline date math without review
- [ ] API routes match contracts in `docs/mvp-spec.md`

## How it was tested
<!-- Check off all that apply and detail manual steps if needed -->
- [ ] Local build passes cleanly (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Tested endpoint / UI flow manually in browser
- [ ] Verified anti-hallucination citation validation logic (if modifying RAG)
- [ ] Verified deadline calculation deterministic logic (if modifying case logic)
