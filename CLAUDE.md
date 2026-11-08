# CLAUDE.md – Shopify Theme

Shopify-Theme (Online Store 2.0, Liquid) auf Basis von Shopifys Skeleton Theme. Ein Repo = ein Theme = ein Shop.

- **Shop:** NetImpulsemarketing – `a50c23-ed.myshopify.com`, live unter netimpulsemarketing.de
- **Test-Theme:** „Netimpulse-Final – Test" (ID `210831737177`, unveröffentlicht) – das einzige Push-Ziel

## Arbeitsweise

- Jede Änderung an Storefront-Dateien läuft über den Skill `shopify-visual-qa`: ins Test-Theme pushen, Playwright laufen lassen, Screenshots ansehen, nachbessern.
- **Nie in den Live-Shop pushen, auch nicht auf Nachfrage.** Gepusht wird nur mit `shopify theme push -e development --nodelete`. Tabu sind `--live`, `--allow-live`, `--publish`, `shopify theme publish`, Pushes mit einer anderen Theme-ID und Admin-API-Schreibzugriffe auf andere Themes als das Test-Theme. Der Hook `.claude/hooks/block-live-push.js` blockt die CLI-Varianten zusätzlich. Live schaltet der Nutzer selbst.

## Liquid

- `{% render %}` statt `{% include %}` (deprecated), Variablen explizit übergeben.
- In Named Arguments eines Filters keine weiteren Filter: `image_tag: alt: image.alt | escape` bricht. Den Wert vorher per `assign` berechnen.
- Liquid hat keinen Ternary-Operator; dafür `{% liquid %}` mit `if`/`else`.
- In `{% stylesheet %}` und `{% javascript %}` wird kein Liquid gerendert. Werte aus Settings über `{% style %}` bzw. CSS-Variablen.
- Mehrzeilige Logik in `{% liquid %}`-Blöcken, Whitespace mit `{%- -%}` steuern, auf `blank` prüfen (nicht `empty` oder `== ""`), Fallbacks mit `| default`.
- Shopify-Bausteine statt Handarbeit: Bilder über `image_url | image_tag` (Ausgabe nicht noch einmal in ein `<img>` packen), Pfade über `routes.*`, Preise über `| money`, Produktmedien über `product.media`.
- Alle Texte über Übersetzungs-Keys: im Markup `| t` (auch `alt`, `aria-label`, `placeholder`), im Schema `t:`-Keys (auch Preset-Namen und Preset-Block-Texte). Jeder Key muss in `locales/en.default.json` bzw. `locales/en.default.schema.json` existieren, sonst steht „Translation missing" im Shop.

## Schema & Theme-Editor

- Ein `{% schema %}` pro Datei, ganz unten, valides JSON ohne Liquid. Section-Namen max. 25 Zeichen, Setting-IDs eindeutig und in `snake_case`.
- Jedes Setting, das einen `default` unterstützt, bekommt einen sinnvollen, nicht leeren Default.
- Jede Section hat ein `color_scheme`-Setting (Default `scheme-1`), `padding_top`/`padding_bottom` als Range (0–100, Schritt 4, px) und mindestens ein Preset. Kein zusätzliches `bg_color`/`text_color` für denselben Zweck.
- Alles, was der Händler ändern können soll, ist ein Setting oder Block. `visible_if` für abhängige Settings, `{ "type": "@app" }` in Kern-Sections (Product, Cart, Header, Footer).
- Bestehende Setting- und Block-IDs nie umbenennen oder entfernen – gespeicherte Händler-Einstellungen hängen daran.
- `{{ block.shopify_attributes }}` auf jedem Block-Wrapper.
- JS muss das Neu-Rendern im Editor überstehen: auf `shopify:section:load`/`unload`, `shopify:block:select`/`deselect` und `shopify:section:reorder` reagieren, beim Entladen Listener, Observer und Intervalle aufräumen, doppelte Initialisierung verhindern.
- Im Editor kann `product` nil sein (z. B. ohne Produkte im Shop). Alles, was `product` oder `current_variant` nutzt – vor allem `{% form 'product' %}` –, hinter eine Prüfung auf `product != blank` legen und sonst einen deaktivierten Platzhalter ausgeben.
- Keine Styles auf `.shopify-section` (Grid, Margin, Padding); Hintergrund und Abstände gehören aufs Root-Element der Section. Dynamisches CSS über `#shopify-section-{{ section.id }}` scopen.
- Color Schemes: Hat `config/settings_schema.json` noch kein `color_scheme_group` (Stand des Skeleton Themes), zuerst eins anlegen (id `color_schemes`, Felder `background`, `background_gradient`, `text`, `button`, `button_label`, `secondary_button_label`, `shadow`) und in `config/settings_data.json` mindestens `scheme-1` (hell) und `scheme-2` (dunkel) mit Hex-Werten setzen. Sonst kann der Editor die Schemes nicht anzeigen.

## Layout, Section Groups, Templates

- `layout/theme.liquid` braucht `{{ content_for_header }}` und `{{ content_for_layout }}`. Header und Footer über `{% sections 'header-group' %}` / `{% sections 'footer-group' %}`, nicht per `{% section %}`.
- Header-/Footer-Sections bekommen `"enabled_on": { "groups": ["header"] }` bzw. `["footer"]`; `enabled_on` und `disabled_on` nie zusammen. Group-JSONs schlank halten, keine vorkonfigurierten Blocks oder Settings.
- Ein Liquid-Fehler in einer Section oder einem Snippet einer Group kann die ganze Group ohne Fehlermeldung verschwinden lassen. Snippets in Header und Footer besonders sorgfältig prüfen.
- In Template-JSONs `color_scheme` und Paddings jeder Section explizit setzen; fehlende Werte haben schon zu einer 404-Homepage geführt. Jeder `type` braucht eine passende Section-Datei, Block-Typen müssen zum Schema passen. Max. 25 Sections pro Template, 50 Blocks pro Section.
- Keine Legacy-Customer-Templates (`templates/customers/*`) für neue Themes, sie sind deprecated.

Vor jedem Push: `shopify theme check`. Errors sind Blocker – darunter fallen Liquid-Syntaxfehler (auch abgeschnittene Dateien), ungültige Schemas und fehlende Übersetzungs-Keys.

## Projektnotizen

Hier nur eintragen, wenn der Nutzer es ausdrücklich will oder eine Abhängigkeit im Code nicht auffindbar ist und sonst später etwas bricht (Beispiel: „Header-Counter liest Metafield `custom.wishlist`"). Eine Zeile pro Eintrag, keine Feature-Logs, keine Historie. Im Zweifel nicht eintragen.

- _(leer)_
