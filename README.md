# Netimpulse-Final

Shopify-Theme fuer den Shop NetImpulsemarketing (`a50c23-ed.myshopify.com`)
mit integriertem Visual-QA-Workflow (Shopify CLI + Playwright).
Getestet wird im unveroeffentlichten Theme „Netimpulse-Final – Test"
(ID 210831737177). Ins Live-Theme wird aus diesem Repo nie gepusht.

## Was hier drin ist

- `CLAUDE.md` – Projektregeln fuer Claude (Liquid & Theme-Editor)
- `.claude/skills/shopify-visual-qa/` – QA-Schleife: Push ins Test-Theme, Playwright, Screenshots ansehen, nachbessern
- `package.json` – Dependencies & npm-Scripts
- `playwright.config.ts` – Test-Runner Konfiguration (Desktop + Mobile)
- `tests/_base.spec.ts` – Generische Checks + Homepage-Screenshots, laufen bei jedem Testlauf
- `tests/fixtures.ts`, `tests/global-setup.ts` – Test-Theme-ID, Storefront-Login, automatische Ermittlung von Produkt/Collection
- `shopify.theme.toml` – Shopify CLI Config, bewusst nur mit dem Test-Environment
- `.claude/hooks/block-live-push.js` – blockt jeden Shopify-CLI-Befehl, der ins Live-Theme schreiben oder ein Theme veroeffentlichen koennte
- `.gitignore`, `.env.example` – Standard-Boilerplate

Skeleton-Theme-Dateien (sections, snippets, layout, assets) werden ueber den
`/neuer-shop` Skill oder per Hand ergaenzt.

## Setup

Store-Domain und Test-Theme sind schon eingetragen. Noetig sind nur:

1. Dependencies installieren:
   ```bash
   npm install
   npx playwright install chromium
   ```
2. Theme Access Token aus der Theme Access App **dieses** Shops setzen:
   ```bash
   export SHOPIFY_CLI_THEME_TOKEN=shptka_xxx
   ```
   `SHOPIFY_STOREFRONT_PASSWORD` nur, falls der Shop passwortgeschuetzt ist.

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

## Kein Live-Push

Aus diesem Repo wird nie ins Live-Theme gepusht: Es gibt kein
Production-Environment und kein `theme:push:prod`-Script, und der Hook
`.claude/hooks/block-live-push.js` blockt Live-Pushes durch Claude zusaetzlich.
Live geschaltet wird von Hand im Shopify-Admin.
