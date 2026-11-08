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

## Das Theme

Online-Store-2.0-Theme nach dem Prototyp `netimpulse/netimpulse-redesign`
(Graphit-Palette G3). Alle Texte sind im Theme-Editor pflegbar, als Section-
Einstellungen und Blocks. Die Gestaltung kommt aus `assets/base.css` (Styles
des Prototyps), Shopify-Ergänzungen stehen in `assets/theme.css`.

| Seite | Template |
| --- | --- |
| Startseite | `templates/index.json` |
| Leistungen | `templates/page.leistungen.json` |
| SEO, SEA, SMM, GEO, Webdesign, KI-Automation | `templates/page.seo.json`, `page.sea.json`, `page.smm.json`, `page.geo.json`, `page.web-design.json`, `page.ki.json` (gleiche Sections) |
| Über uns, Kontakt | `templates/page.ueber-uns.json`, `page.kontakt.json` |
| Theme-Shop | `templates/collection.json`, `templates/page.theme-store.json` |
| Theme-Produkt | `templates/product.json` |
| Theme-Vorschau | `templates/product.vorschau.json` (Layout `vorschau`), Aufruf `/products/<handle>?view=vorschau` |
| Warenkorb | `templates/cart.json` |
| Impressum, Datenschutz, AGB, Widerruf | Shopify-Richtlinien, Rahmen in `snippets/policy-frame.liquid` |

### Einrichtung im Shop

- Header und Footer: im Theme-Editor das Menü „Hauptmenü" wählen. Unterpunkte
  eines Menüpunkts werden zum Leistungs-Dropdown und zur Leistungsspalte im Footer.
- Seite `ki` anlegen (Vorlage `page.ki`), falls KI-Automation online gehen soll.
- Themes sind Produkte in der Kollektion `themes`, jeder Farbstil ist eine Variante.
  Metafelder (Namespace `theme`):
  - Produkt: `branche` (einzeiliger Text), `passt_fuer` und `sektionen` (Liste einzeiliger Text),
    `sprungmarken` (JSON: `[{"name": "Hero-Banner", "desktop": [12, 30], "mobile": [8, 20]}]`,
    Start und Höhe in Prozent des Screenshots)
  - Variante: `screenshot_desktop`, `screenshot_mobile` (Datei/Bild), `farbe_grund`, `farbe_akzent` (Farbe)
  Ohne Screenshot zeigt das Theme einen neutralen Platzhalter-Shop.
- Zusatzleistungen: Theme-Einstellungen > Zusatzleistungen. Mit Produkt landen sie mit
  Preis im Warenkorb, sonst als Vermerk am Theme.
- Sprache: Das Theme ist deutsch (`locales/de.default.json`). Der Shop sollte Deutsch als
  Hauptsprache haben, sonst stehen Richtlinien-Titel und `lang` auf Englisch.

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
