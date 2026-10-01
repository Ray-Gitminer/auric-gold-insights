<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Dashboard and Signals use the full-width top navigation while all other routes retain the sidebar shell, because these two intelligence workspaces share the cinematic three-column composition.
- Dashboard trading signals are computed deterministically in src/lib/signals/engine.ts; AI only runs in the explicit, user-triggered "AI" mode, because AI must not be the source of truth for core signals.
- FinanceCalendar.com data is read server-side through the Firecrawl connector with a 1h in-memory cache and shown with its own source badge alongside official agency data, so third-party values never overwrite official ones.
