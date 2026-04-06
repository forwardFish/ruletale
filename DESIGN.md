# DESIGN

## Product Intent
- Goal: Execute the authoritative local validation set for ruletale and leave the project ready for later formal roadmap execution.
- Audience: product users who need a clear, high-signal interface
- Surface scope: scripts/full_flow_smoke.py, apps/api/tests/test_game_flow.py

## Visual System
- Direction: product-grade application surface with bold hierarchy and restrained detail density
- Clear background atmosphere rather than a flat single-color page
- Expressive headline hierarchy and compact supporting labels
- One accent color family for primary emphasis and one for caution/risk

## Information Architecture
1. Hero section with page thesis, active context, and primary controls
2. Decision strip that highlights the top summary, lead theme, or top opportunity
3. Working sections that separate summary from detailed evidence
4. Shared risk and method boundary section near the end of the page
5. Explicit handling for empty, partial, failure, and refresh states

## Interaction Rules
- Active filters and view modes should be visually obvious.
- Primary metrics must sit next to interpretation, not alone.
- Dense detail blocks should be chunked into evidence, signals, and risks.
- High-risk UI work should preserve navigation continuity and state clarity across refresh and partial data.

## Copy Direction
- Write like a product surface, not an internal demo board.
- Lead with the main decision, then evidence, then risks.
- Prefer concise labels over engineering jargon in the page chrome.

## Implementation Notes
- Preserve current data contracts and route shape.
- Use layered panels, strong hierarchy, and explicit summary sections above dense detail blocks.
- Keep empty, loading, partial-data, and failure states visible.
- Route-level design review should compare the built page against these decisions, not just screenshots.

## Review Checklist
- The first screen explains what the page is for.
- The main theme or decision lead is visible without scanning the full list.
- The page no longer reads like a demo table or placeholder board.
