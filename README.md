# Shopify Theme Template

Template-Repo fuer neue Shopify-Themes mit integriertem Visual-QA-Workflow
(Shopify CLI + Playwright). Ein Repo = ein Theme = ein Shop.

## Was hier drin ist

- `CLAUDE.md` – Projektregeln fuer Claude (Liquid & Theme-Editor)
- `.claude/skills/shopify-visual-qa/` – QA-Schleife: Push ins Test-Theme, Playwright, Screenshots ansehen, nachbessern
- `package.json` – Dependencies & npm-Scripts
- `playwright.config.ts` – Test-Runner Konfiguration (Desktop + Mobile)
- `tests/_base.spec.ts` – Generische Checks + Homepage-Screenshots, laufen bei jedem Testlauf
- `tests/fixtures.ts`, `tests/global-setup.ts` – Test-Theme-ID, Storefront-Login, automatische Ermittlung von Produkt/Collection
- `shopify.theme.toml` – Shopify CLI Config mit Dev-/Prod-Environments
- `.gitignore`, `.env.example` – Standard-Boilerplate
- `ignore`-Block in `shopify.theme.toml` – verhindert, dass QA-Dateien beim Production-Push landen

Skeleton-Theme-Dateien (sections, snippets, layout, assets) werden ueber den
`/neuer-shop` Skill oder per Hand ergaenzt.

## Erstes Setup eines neuen Repos

1. Repo aus diesem Template anlegen (GitHub: "Use this template")
2. Skeleton-Theme reinkopieren bzw. mergen
3. Dependencies installieren:
   ```bash
   npm install
   npx playwright install chromium
   ```
4. Shopify CLI authentifizieren (Token aus Theme Access App):
   ```bash
   export SHOPIFY_CLI_THEME_TOKEN=shptka_xxx
   ```
5. Store-Domain eintragen: `__STORE_DOMAIN__` in `shopify.theme.toml`,
   `playwright.config.ts` und `tests/global-setup.ts` ersetzen.
6. Test-Theme anlegen (erstes Push als unpublished Theme):
   ```bash
   npm run theme:push:dev
   ```
   Theme-ID aus der CLI-Ausgabe fuer `__THEME_ID__` in `shopify.theme.toml`
   und `tests/fixtures.ts` einsetzen.

Gibt es im Shop schon ein unveroeffentlichtes Test-Theme, uebernimmt Claude die
Schritte 5 und 6 beim ersten Auftrag (Skill-Schritt 0.5).

Eine eigene QA-Page im Shop ist nicht noetig: Getestet wird auf der Homepage
bzw. der Seite, zu der die geaenderte Datei gehoert.

## QA-Workflow pro Block

```bash
# 1) Code-Aenderung commiten
# 2) Theme pushen (aktualisiert das Dev-Theme im Store)
shopify theme push -e development --nodelete

# 3) Komplett-Check
npm run qa:full
```

`qa:full` laeuft `theme check` + Playwright Tests. Screenshots landen in
`qa-screenshots/`, der HTML-Report in `playwright-report/`.

## Production-Push

In `shopify.theme.toml` den Production-Block ausfuellen, dann:

```bash
shopify theme push -e production
```

Der `ignore`-Block sorgt dafuer, dass weder QA-Templates noch Tests ins
Production-Theme uebertragen werden.
