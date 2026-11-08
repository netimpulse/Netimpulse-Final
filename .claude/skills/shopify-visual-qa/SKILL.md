---
name: shopify-visual-qa
description: Geschlossener Visual-QA-Workflow für Shopify-Themes via Shopify CLI + Playwright. Verwende diesen Skill bei jeder Erstellung, Änderung oder Fehlerbehebung an Sections, Blocks, Snippets, Templates oder Storefront-CSS/JS — egal ob für Page-Blocks, Produktseiten, Cart, Collections, Header, Footer oder andere Storefront-Bereiche. Der Skill pickt automatisch die richtige Test-URL anhand der geänderten Datei und funktioniert mit Claude Code Web's PR-Flow, weil das Test-Theme via Shopify CLI direkt aus der Arbeits-Branch heraus aktualisiert wird. Trigger automatisch bei .liquid-Dateien, Schemas, Sections, Blocks, Snippets, Storefront-UI, oder wenn der Nutzer Begriffe wie "Block bauen", "Produktseite anpassen", "Cart umbauen", "Header ändern", "QA-Schleife", "Visual Test" nutzt.
---

# Shopify Visual QA Workflow

Geschlossene Schleife für jede Storefront-Änderung: Code ändern → ins Test-Theme pushen → Playwright gegen die echte Seite laufen lassen → Screenshots ansehen → nachbessern. Die Code-Regeln für Liquid und den Theme-Editor stehen in `CLAUDE.md`.

## Architektur

| Theme im Dev-Store | Rolle |
|---|---|
| GitHub-synced Main-Theme | Spiegel von `main`, nicht für Tests |
| Test-Theme (UNPUBLISHED) | Ziel aller Tests, wird per Shopify CLI aus der aktuellen Arbeits-Branch gepusht |

Die Theme-IDs stehen in `shopify.theme.toml` (development) und `tests/fixtures.ts` (`themeId`). So läuft die Schleife unabhängig davon, ob Claude Code Web auf einer PR-Branch arbeitet.

Es gibt kein QA-Template und keine QA-Page: Getestet wird auf der Homepage oder auf der Seite, zu der die geänderte Datei gehört (Schritt 1). Keine `qa-*.json`-Templates anlegen und keine QA-Pages im Admin vorschlagen, außer der Nutzer will es ausdrücklich.

## 0 — Umgebungs-Check (einmal pro Session)

```bash
node -v && npm -v && git --version
shopify version
npx playwright --version
echo "Theme-Token: $([ -n "$SHOPIFY_CLI_THEME_TOKEN" ] && echo gesetzt || echo NEIN)"
echo "Storefront-PW: $([ -n "$SHOPIFY_STOREFRONT_PASSWORD" ] && echo gesetzt || echo NEIN)"
```

`SHOPIFY_CLI_THEME_TOKEN` ist Pflicht. `SHOPIFY_STOREFRONT_PASSWORD` ist optional — ohne Passwortschutz überspringt `tests/global-setup.ts` den Login.

Fehlt eine Pflicht-Variable: stoppen und den Nutzer einmal in der Session fragen. Nie in eine committete Datei schreiben.

Fehlen Tools: `npm install`, `npx playwright install chromium`.

## 0.5 — Repo-Config-Check (einmal pro Repo)

Frisch aus dem Template erzeugte Repos enthalten Platzhalter. Produkt- und Collection-Handles muss niemand setzen — die ermittelt `tests/global-setup.ts` beim ersten Lauf über `/products.json` und `/collections.json` und legt sie in `playwright/.auth/discovered.json` ab.

```bash
grep -rn "__THEME_ID__\|__STORE_DOMAIN__\|__PROD_THEME_ID__" \
  shopify.theme.toml playwright.config.ts tests/fixtures.ts tests/global-setup.ts 2>/dev/null
```

Bei Treffern den Workflow stoppen und die zwei Werte setzen:

1. **Ermitteln.** Mit Shopify-MCP: `get-shop-info` liefert die Store-Domain; per `themes()`-Query das Test-Theme finden (bevorzugt UNPUBLISHED mit Namen wie „Test", „QA Preview" oder „Sandbox", sonst das erste UNPUBLISHED; gibt es keins, ein Duplikat per `themeDuplicate` vorschlagen). Ohne MCP den Nutzer nach beiden Werten fragen.
2. **Einsetzen.**

   | Datei | Platzhalter → Wert |
   |---|---|
   | `shopify.theme.toml` | `__STORE_DOMAIN__` → Store-Handle (ohne `.myshopify.com`), `__THEME_ID__` → Test-Theme-ID |
   | `tests/fixtures.ts` | `__THEME_ID__` → Test-Theme-ID |
   | `playwright.config.ts` | `__STORE_DOMAIN__` → Store-Handle |
   | `tests/global-setup.ts` | `__STORE_DOMAIN__` → Store-Handle |

3. **Prüfen:** keine `__…__`-Platzhalter mehr, Store-Domain überall gleich (mit MCP gegen `get-shop-info` abgleichen).

## 1 — Test-URL bestimmen

Vor dem Coden festlegen, gegen welche URL getestet wird:

1. **Der Nutzer nennt das Ziel:** „auf die Produktseite" → `QA.paths.product`, „in den Cart" → `QA.paths.cart`, Header oder Footer → `QA.paths.home`, eine bestimmte Page → deren URL.
2. **Sonst nach Datei:**

   | Geänderte Datei | Test-URL |
   |---|---|
   | `sections/product-*`, `snippets/product-*`, `templates/product.json` | `QA.paths.product` |
   | `sections/cart-*`, `templates/cart.json` | `QA.paths.cart` |
   | `sections/collection-*`, `templates/collection.json` | `QA.paths.collection` |
   | `sections/search.liquid`, `templates/search.json` | `QA.paths.search` |
   | `sections/404.liquid` | `QA.paths.notFound` |
   | Header, Footer, `layout/theme.liquid` | `QA.paths.home` |
   | alles andere | `QA.paths.home` |

3. **Die Ziel-Page existiert nicht** (z. B. `/pages/services`): gegen `QA.paths.home` testen und dem Nutzer sagen, dass die Page fehlt und angelegt werden kann.

## 2 — Ablauf pro Aufgabe

### 2.1 Komponente bauen

Nach den Regeln in `CLAUDE.md`.

### 2.2 Section temporär ins Ziel-Template einbauen

Nur nötig, wenn die Section dort noch nicht vorkommt (typisch: Homepage, Page-Templates). Beispiel `templates/index.json`:

```json
{
  "sections": {
    "qa_new_block": {
      "type": "your-section-handle",
      "settings": { /* realistische Werte */ }
    },
    ... bestehende Sections ...
  },
  "order": ["qa_new_block", ... bestehende Reihenfolge ...]
}
```

Realistische Inhalte („Wir bauen Möbel, die bleiben", echte Button-Labels), kein Lorem Ipsum. Den temporären Eintrag im PR kennzeichnen oder vor dem Merge entfernen, falls er nicht nach `main` soll; im Test-Theme darf er bleiben.

### 2.3 Block-Test schreiben

`tests/blocks/<component-handle>.spec.ts` anlegen oder erweitern:

```ts
import { test, expect } from "@playwright/test";
import { QA, withTheme } from "../fixtures";

test.describe("<component-handle>", () => {
  test("…", async ({ page }, testInfo) => {
    await page.goto(withTheme(QA.paths.home)); // Ziel-URL aus Schritt 1
    const section = page.locator("<Selektor der Section>");
    await expect(section).toBeVisible();
    // Interaktionen und Assertions …

    // Screenshot für die Sichtprüfung in 2.6
    await section.screenshot({
      path: `qa-screenshots/<component-handle>-${testInfo.project.name}.png`,
    });
  });
});
```

Bei Header-, Footer- oder Layout-Änderungen statt der Section die ganze Seite fotografieren (`page.screenshot({ path, fullPage: true })`).

| Komponente | Was getestet wird |
|---|---|
| Slider | next/prev, Slide-Wechsel, Loop |
| Accordion | open/close pro Item, `aria-expanded` |
| Tabs | Panel-Wechsel, nur eins sichtbar |
| Video | Player initialisiert, Controls vorhanden |
| Button mit Link | `href` stimmt mit dem Schema-Setting |
| Form | Felder ausfüllbar, Submit erreichbar (nicht echt absenden) |
| Variant-Switcher | Klick auf Variante ändert Preis/SKU |
| Add-to-Cart | Klick öffnet Cart-Drawer oder zeigt Bestätigung |

Die generischen Checks aus `tests/_base.spec.ts` (Konsolenfehler, leeres Layout, kaputte Bilder, Homepage-Screenshots) laufen immer mit — nicht duplizieren.

### 2.4 Cart-Tests

Der Cart braucht ein Produkt. Die Variant-ID ermittelt `global-setup.ts` automatisch:

```ts
test.beforeEach(async ({ context }) => {
  test.skip(!QA.firstVariantId, "Kein Produkt im Shop gefunden");
  await context.request.post(withTheme("/cart/add.js"), {
    headers: { "Content-Type": "application/json" },
    data: { items: [{ id: QA.firstVariantId, quantity: 1 }] },
  });
});
```

### 2.5 Ins Test-Theme pushen und testen

```bash
shopify theme check
shopify theme push -e development --nodelete
npx playwright test
```

Errors aus `theme check` blockieren. `--nodelete` verhindert, dass Dateien im Test-Theme gelöscht werden, wenn die Branch unvollständig ist.

### 2.6 Screenshots ansehen und nachbessern

Nach **jedem** Testlauf, auch wenn alles grün ist:

1. Die Screenshots mit dem Read-Tool öffnen: `qa-screenshots/<component-handle>-desktop.png` und `-mobile.png`, dazu `desktop-base.png` und `mobile-base.png` (Homepage).
2. Mit dem Ziel vergleichen: Sieht es aus wie gewollt? Auf Layout, Abstände, Umbrüche, Überlappungen, abgeschnittene Texte, fehlende Bilder und horizontales Scrollen (ab 320 px Breite) achten, auf Desktop und Mobile.
3. Bei roten Tests zusätzlich: Fehlermeldung, Fehler-Screenshots und Traces unter `test-results/`, den HTML-Report `playwright-report/index.html`, Konsole und DOM des betroffenen Elements.

Gefundenes beheben und zurück zu 2.5. Höchstens **drei** Runden, danach stoppen und berichten, was probiert wurde und was offen ist. Nie mit roten Tests committen.

### 2.7 Commit und Push

```bash
git add .
git commit -m "<type>: <komponente> - <kurzbeschreibung>"
git push
```

Claude Code Web öffnet daraus einen PR, der Nutzer reviewt und mergt. Das Test-Theme ist schon in 2.5 aktualisiert. Commit-Typen: `feat`, `fix`, `refactor`, `chore`, `style`, `perf`.

## 3 — Production-Push (nur auf ausdrücklichen Wunsch)

1. `[environments.production]` in `shopify.theme.toml` hat Store und Theme-ID des Kundenshops; ein eigenes Theme-Access-Token für diesen Shop ist gesetzt.
2. Die `ignore`-Liste in `shopify.theme.toml` hält Tests und QA-Dateien heraus.
3. `shopify theme push -e production`
4. Den Nutzer bitten, die Live-Seite selbst kurz zu prüfen — echte Shopdaten können etwas brechen, das im Dev-Store grün war.

## 4 — Sicherheit

- `SHOPIFY_CLI_THEME_TOKEN` und `SHOPIFY_STOREFRONT_PASSWORD` nie in committete Dateien, Commit-Messages oder Logs; fehlt einer, in der Session beim Nutzer erfragen.
- `playwright/.auth/` ist gitignored, dort wird nichts committet.
- Fixtures in `tests/fixtures.ts` nicht ohne Grund löschen oder umbenennen.

## 5 — Schnellreferenz

| Situation | Schritte |
|---|---|
| Neue Section oder neuer Block ohne klares Ziel | 2.1, 2.2 (`templates/index.json`), 2.3 mit `QA.paths.home`, 2.5–2.7 |
| Produktseite | 2.1, 2.3 mit `QA.paths.product`, 2.5–2.7 |
| Cart | 2.1, 2.3 + 2.4 mit `QA.paths.cart`, 2.5–2.7 |
| Collection | 2.1, 2.3 mit `QA.paths.collection`, 2.5–2.7 |
| Header, Footer, Layout | 2.1, 2.3 mit `QA.paths.home` und Full-Page-Screenshot, 2.5–2.7 |
| Search, 404 | 2.1, 2.3 mit `QA.paths.search` bzw. `QA.paths.notFound`, 2.5–2.7 |
| Ziel-Page fehlt | Fallback `QA.paths.home`, Nutzer informieren |
| ENV-Variable fehlt | 0, Nutzer fragen |
| Production | 3, nur auf Anforderung |
