#!/usr/bin/env python3
"""Baut alle Seiten des Prototyps aus den Texten der Theme-Templates.
Aufruf: python3 build.py   (im Ordner prototype/)
index.html entsteht ohne Dokumentgerüst (für die veröffentlichte Vorschau), _local.html mit Gerüst für den lokalen Server."""
import json, html, os

HERE = os.path.dirname(os.path.abspath(__file__))
THEME = os.path.join(HERE, '..', 'templates')
LIVE = 'https://netimpulsemarketing.de'

def load(name):
    raw = open(os.path.join(THEME, name), encoding='utf-8').read()
    return json.loads(raw[raw.index('{'):])

def blocks(sec, typ=None):
    out = [sec['blocks'][k] for k in sec.get('block_order', [])]
    return [b for b in out if typ is None or b['type'] == typ]

e = html.escape
def ico(name):
    paths = {
        'arrow': 'M5 12h14M13 6l6 6-6 6', 'check': 'M5 12.5l4.5 4.5L19 7.5', 'plus': 'M12 5v14M5 12h14',
        'down': 'M6 9l6 6 6-6',
    }
    return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="%s"/></svg>' % paths[name]

PAGES = {'seo': 'seo.html', 'sea': 'sea.html', 'smm': 'smm.html', 'geo': 'geo.html', 'webdesign': 'webdesign.html',
         'shopify': 'leistungen.html#l-shopify', 'themes': 'themes.html', 'ki': 'ki.html'}
NICE = {'seo': 'SEO', 'sea': 'Google Ads', 'smm': 'Social Media', 'geo': 'GEO', 'webdesign': 'Webdesign', 'shopify': 'Shopify', 'themes': 'Themes', 'ki': 'KI-Automation'}

home = load('index.json')
SERVICES = [b['settings'] for b in blocks(next(s for s in home['sections'].values() if s['type'] == 'service-orbit'), 'service')]
for s in SERVICES:
    s['url'] = PAGES[s['key']]
    s['nice'] = NICE[s['key']]
TOPICS = ['Shopify-Shop', 'Website', 'SEO und GEO', 'Google Ads', 'Social Media', 'KI-Automation', 'Theme aus dem Store']
def _t(name, branche, price, shop, nav, head, sub, cta, cats, band, sb, sf, sa, lay):
    return dict(name=name, branche=branche, price=price, shop=shop, nav=nav, head=head, sub=sub, cta=cta, cats=cats, band=band, sb=sb, sf=sf, sa=sa, lay=lay)
T = [
    _t('Werkbank', 'Handwerk und Betriebe', '290 €', 'Holzwerk Ahorn', ('Leistungen', 'Projekte'), 'Möbel nach Maß aus Mittelhessen', 'Esstische, Einbauschränke und Treppen aus Massivholz, geplant und gebaut in unserer Werkstatt.', 'Anfrage stellen', [('Esstische', 'auf Anfrage'), ('Einbauschränke', 'auf Anfrage'), ('Treppen', 'auf Anfrage')], 'Vom ersten Aufmaß bis zur Montage aus einer Hand', '#F3F1EC', '#1b1a17', '#C2552A', 'lay-a'),
    _t('Atelier', 'Mode und Accessoires', '340 €', 'Atelier', ('Neu', 'Kollektion'), 'Neue Kollektion', 'Ruhige Schnitte, feste Stoffe und Farben, die länger als eine Saison halten.', 'Jetzt ansehen', [('Mantel', '189 €'), ('Hemd', '79 €'), ('Tasche', '129 €')], 'Kostenloser Versand ab 80 €', '#FAF9F7', '#151515', '#151515', 'lay-b'),
    _t('Salbei', 'Naturkosmetik', '310 €', 'Kräuterhaus Wiese', ('Pflege', 'Inhaltsstoffe'), 'Naturkosmetik aus Kräutern', 'In kleinen Chargen abgefüllt, mit Inhaltsstoffen, die wir einzeln erklären.', 'Zum Sortiment', [('Gesichtsöl', '24 €'), ('Handcreme', '14 €'), ('Seife', '9 €')], 'Jede Zutat steht auf dem Etikett', '#EDF0E8', '#1d2a20', '#4F6D54', 'lay-c'),
    _t('Kornfeld', 'Bäckerei und Café', '260 €', 'Kornfeld', ('Brot', 'Café'), 'Frisch aus dem Ofen', 'Brot und Gebäck zum Vorbestellen und Abholen, jeden Morgen ab sieben.', 'Vorbestellen', [('Roggenbrot', '5,40 €'), ('Dinkelbrötchen', '0,90 €'), ('Zimtschnecke', '2,80 €')], 'Heute bestellen, morgen früh abholen', '#F5EBDD', '#33230f', '#A9662A', 'lay-a'),
    _t('Lahn', 'Outdoor und Sport', '320 €', 'Lahn', ('Ausrüstung', 'Touren'), 'Ausrüstung für draußen', 'Zelte, Rucksäcke und Jacken, die wir selbst auf Tour getestet haben.', 'Entdecken', [('Zelt', '349 €'), ('Rucksack', '159 €'), ('Jacke', '219 €')], 'Getestet zwischen Lahn und Vogelsberg', '#173A31', '#F4EFE2', '#F0B23E', 'lay-b'),
    _t('Kontor', 'B2B und Großhandel', '380 €', 'Lagerhaus Nord', ('Sortiment', 'Konto'), 'Großhandel mit Staffelpreisen', 'Kauf auf Rechnung, Staffelpreise und Schnellbestellung per Artikelnummer.', 'Schnellbestellung', [('Kartonagen', 'ab 0,38 €'), ('Klebeband', 'ab 1,10 €'), ('Folien', 'ab 4,20 €')], 'Preise für Geschäftskunden nach Anmeldung', '#F4F5F7', '#141a2b', '#2C53C2', 'lay-c'),
]

VIS = {
    'seo': '<div class="sheet"><div class="bar">schreinerei gießen</div><div class="row you"><small>deine-domain.de · leistungen</small><b>Schreinerei in Gießen: Möbel nach Maß</b></div><div class="row"><small>branchenbuch-beispiel.de</small>Schreinereien in Gießen und Umgebung</div><div class="row"><small>ratgeber-beispiel.de</small>Möbel nach Maß: Worauf du achten solltest</div></div>',
    'sea': '<div class="sheet"><div class="row you"><small>Anzeige · deine-domain.de</small><b>Einbauschränke nach Maß anfragen</b></div><svg viewBox="0 0 300 110" style="width:100%"><path d="M0 96 C60 90 90 70 140 62 S230 30 300 12" fill="none" stroke="oklch(33% 0.055 188)" stroke-width="2.5"/><path d="M0 100 C80 98 160 92 300 84" fill="none" stroke="oklch(20% 0.02 190 / 0.3)" stroke-width="1.5" stroke-dasharray="4 5"/></svg><div class="row"><small>Anfragen über die Suche im Vergleich zu Klicks ohne Anfrage</small></div></div>',
    'smm': '<div class="tiles"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>',
    'geo': '<div class="sheet"><div class="bar">Welche Schreinerei in Gießen baut Einbauschränke?</div><div class="row"><div class="dim" style="width:92%"></div></div><div class="row"><div class="dim" style="width:74%"></div></div><div class="row you"><small>Quelle</small><b>deine-domain.de</b></div></div>',
    'webdesign': '<div class="sheet surface" style="padding:20px;gap:14px"><h3>Klar erklärt. Gut geführt.</h3><div class="dim" style="width:80%"></div><div class="dim" style="width:56%"></div><span class="fake-btn">Anfrage senden</span></div>',
    'shopify': '<div class="sheet"><div class="row"><small>Theme-Editor · Startseite</small></div><div class="row">Header</div><div class="row">Hero</div><div class="row you"><b>Produktraster</b></div><div class="row">Footer</div></div>',
    'themes': '<div class="sheet surface" style="background:#F3F1EC;padding:20px;gap:14px"><small style="font:600 13px var(--display)">Holzwerk Ahorn</small><h3>Massivholz, geplant und gebaut in Mittelhessen</h3><div style="height:96px;border-radius:12px;background:#C2552A"></div></div>',
    'ki': '<div class="flow"><div>Neue Anfrage<small>kommt über das Formular</small></div><div>Wird einsortiert<small>Thema, Dringlichkeit, Ansprechperson</small></div><div>Antwortentwurf liegt bereit<small>du prüfst und sendest</small></div></div>',
}

# ---------- gemeinsame Teile ----------
def header(current):
    def cur(k): return ' aria-current="page"' if current == k else ''
    dd = ''.join('<a href="%s"><b>%s</b><span>%s</span></a>' % (s['url'], e(s['nice']), e(s['promise'])) for s in SERVICES)
    subs = ''.join('<a href="%s">%s</a>' % (s['url'], e(s['nice'])) for s in SERVICES)
    return '''<header class="top">
  <div class="wrap">
    <a class="brand" href="index.html"><i></i>NetImpulse<span>marketing</span></a>
    <nav class="nav" aria-label="Hauptmenü">
      <div class="dd">
        <button type="button" aria-expanded="false" aria-controls="dd-panel">Leistungen %s</button>
        <div class="dd-panel" id="dd-panel" hidden>%s<a class="all" href="leistungen.html"><span><b>Alle Leistungen und Preise</b></span>%s</a></div>
      </div>
      <a href="themes.html"%s>Theme Store</a>
      <a href="ueber-uns.html"%s>Über uns</a>
      <a class="btn sm" href="kontakt.html">Kontakt</a>
    </nav>
    <button class="burger" type="button" aria-expanded="false" aria-controls="sheet-nav">Menü</button>
  </div>
</header>
<div class="sheet-nav" id="sheet-nav" hidden>
  <div class="row"><a class="brand" href="index.html"><i></i>NetImpulse<span>marketing</span></a><button type="button">Schließen</button></div>
  <nav class="big" aria-label="Hauptmenü mobil">
    <a href="leistungen.html">Leistungen</a>
    <div class="subs">%s</div>
    <a href="themes.html">Theme Store</a>
    <a href="ueber-uns.html">Über uns</a>
    <a href="kontakt.html">Kontakt</a>
  </nav>
  <a class="btn" href="kontakt.html">Kostenloses Erstgespräch %s</a>
</div>
''' % (ico('down'), dd, ico('arrow'), cur('themes'), cur('about'), subs, ico('arrow'))

def ask(pre=None):
    chips = ''.join('<label><input type="checkbox" id="ask-%d" name="t" value="%s"%s><span>%s</span></label>' % (i, e(t), ' checked' if t == pre else '', e(t)) for i, t in enumerate(TOPICS))
    return '''<section class="sec deep lap ask" id="anfrage" data-block="anfrage">
  <div class="wrap ask-grid">
    <div>
      <h2 class="h-giant">Bereit für planbares Wachstum?</h2>
      <p class="lead">Lass uns gemeinsam anschauen, wo dein digitaler Auftritt gerade steht. Such dir aus, worum es geht, den Rest klären wir im kostenlosen Erstgespräch.</p>
    </div>
    <form data-ask>
      <fieldset><legend>Worum geht es dir?</legend><div class="chips">%s</div></fieldset>
      <button class="btn" type="submit">Kostenloses Erstgespräch anfragen %s</button>
      <p class="small note">Kostenlos und unverbindlich, Antwort innerhalb von 48 Stunden</p>
      <p class="direct">Oder direkt: <b>+49 175 8950320</b><b>netimpulsemarketing@gmail.com</b></p>
    </form>
  </div>
</section>
''' % (chips, ico('arrow'))

def footer():
    sv = ''.join('<li><a href="%s">%s</a></li>' % (s['url'], e(s['nice'])) for s in SERVICES)
    return '''<footer class="foot">
  <div class="wrap">
    <div><a class="brand" href="index.html"><i></i>NetImpulse<span>marketing</span></a><p>Digitalagentur in Gießen für Shopify, Webdesign, SEO, GEO und Google Ads.</p></div>
    <div><h3>Menü</h3><ul><li><a href="leistungen.html">Leistungen</a></li><li><a href="themes.html">Theme Store</a></li><li><a href="ueber-uns.html">Über uns</a></li><li><a href="kontakt.html">Kontakt</a></li></ul></div>
    <div><h3>Leistungen</h3><ul>%s</ul></div>
    <div><h3>Rechtliches</h3><ul><li><a href="%s/policies/legal-notice">Impressum</a></li><li><a href="%s/policies/privacy-policy">Datenschutz</a></li><li><a href="%s/policies/terms-of-service">AGB</a></li><li><a href="%s/pages/widerruf">Widerruf</a></li></ul></div>
    <p class="foot-base">© 2026 NetImpulse GbR</p>
  </div>
  <div class="foot-word" aria-hidden="true">NetImpulse</div>
</footer>
<script src="assets/vendor/gsap.min.js"></script>
<script src="assets/vendor/ScrollTrigger.min.js"></script>
<script src="assets/vendor/lenis.min.js"></script>
<script src="assets/site.js"></script>
''' % (sv, LIVE, LIVE, LIVE, LIVE)

def orbit(mode):
    data = [{'key': s['key'], 'name': s['nice'], 'promise': s['promise'], 'long': s['long'], 'url': s['url'], 'label': s['link_label'],
             'pairs': [p.strip() for p in s.get('pairs', '').split(',') if p.strip()]} for s in SERVICES]
    return '''<div class="orbit" data-mode="%s" role="group" aria-label="Unsere Leistungen im Rad">
  <svg viewBox="0 0 400 400" aria-hidden="true"><circle cx="200" cy="200" r="194"/><circle cx="200" cy="200" r="168"/><circle class="arc" cx="200" cy="200" r="168" transform="rotate(-90 200 200)"/><g class="links"></g></svg>
  <div class="orbit-nodes"></div>
  <div class="orbit-core" aria-live="polite"><p data-core-sub></p><h2 data-core-title></h2><a class="btn" data-core-link href="leistungen.html"><span>Zur Leistung</span>%s</a></div>
  <script type="application/json">%s</script>
</div>''' % (mode, ico('arrow'), json.dumps(data, ensure_ascii=False))

def _old_shot(t):
    name, branche, price, shop, head, cta, tb, tf, ta = t
    return '<div class="shot" style="--tb:%s;--tf:%s;--ta:%s"><div class="s-nav">%s<i></i></div><div class="s-h">%s<br><u>%s</u></div><div class="s-img"></div></div>' % (tb, tf, ta, e(shop), e(head), e(cta))

def _old_theme_card(t):
    href = 'theme-werkbank.html'
    return '<a class="theme" href="%s">%s<div class="theme-meta"><b>%s</b><span>%s · <span class="num">%s</span></span></div></a>' % (href, shot(t), e(t[0]), e(t[1]), e(t[2]))

def tone(c):
    for a, t in [('class="sec deep lap', 'deep'), ('class="sec mist lap', 'mist'), ('class="sec white lap', 'paper'), ('class="sec soft lap', 'paper'), ('class="sec lap', 'paper'), ('class="sec light', 'paper')]:
        c = c.replace(a, 'data-tone="%s" class="sec' % t)
    c = c.replace('class="page-hero light-hero"', 'data-tone="paper" class="page-hero"').replace('<section class="page-hero" data-block', '<section data-tone="paper" class="page-hero" data-block')
    c = c.replace('<footer class="foot">', '<footer class="foot" data-tone="deep">')
    for a, k in [('sheet', 'surface'), ('dd-panel', 'surface'), ('form-done', 'surface'), ('tray', 'surface-deep'), ('hero-vis', 'surface-deep'), ('ch-vis', 'surface-deep'), ('sheet-nav', 'surface-deep')]:
        c = c.replace('class="%s"' % a, 'class="%s %s"' % (a, k))
    return c

def page(fname, title, current, body, standalone=True):
    head = '<title>%s</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="assets/site.css">\n' % e(title)
    content = tone(head + header(current) + '<main>\n' + body + '</main>\n' + footer())
    full = '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + content + '</body>\n</html>\n'
    if standalone:
        open(os.path.join(HERE, fname), 'w', encoding='utf-8').write(full)
    else:
        open(os.path.join(HERE, fname), 'w', encoding='utf-8').write(content)
        open(os.path.join(HERE, '_local.html'), 'w', encoding='utf-8').write(full)

# ---------- Startseite ----------
def store(t, cls=''):
    cards = ''.join('<div><i></i><span>%s</span><small>%s</small></div>' % (e(c), e(p)) for c, p in t['cats'])
    return '<div class="store %s %s" style="--sb:%s;--sf:%s;--sa:%s"><div class="st-nav"><b>%s</b><span><i>%s</i><i>%s</i><i>Kontakt</i></span></div><div class="st-hero"><div><b>%s</b><p>%s</p><u>%s</u></div><div class="st-img"></div></div><div class="st-cards">%s</div><div class="st-band">%s</div></div>' % (
        t['lay'], cls, t['sb'], t['sf'], t['sa'], e(t['shop']), e(t['nav'][0]), e(t['nav'][1]), e(t['head']), e(t['sub']), e(t['cta']), cards, e(t['band']))

def explorer(link_all=True):
    items = ''.join('<li><button type="button" data-i="%d" aria-pressed="%s"><b><span class="dot" style="background:%s"></span>%s</b><small class="num">%s</small><small>%s</small></button></li>' % (i, 'true' if i == 0 else 'false', t['sa'], e(t['name']), e(t['price']), e(t['branche'])) for i, t in enumerate(T))
    tpls = ''.join('<template data-i="%d" data-sb="%s" data-name="%s">%s</template>' % (i, t['sb'], e(t['name']), store(t)) for i, t in enumerate(T))
    return '''<div class="explorer" data-explorer>
      <ul class="ex-list" aria-label="Theme auswählen">%s</ul>
      <div class="ex-stage">
        <div class="device" style="--sb:%s">%s</div>
        <div class="ex-foot">
          <div class="seg" role="group" aria-label="Vorschau wechseln"><button type="button" data-view="desktop" aria-pressed="true">Desktop</button><button type="button" data-view="phone" aria-pressed="false">Handy</button></div>
          <a class="btn" href="theme-werkbank.html"><span data-ex-name>Werkbank</span> ansehen %s</a>
        </div>
        <p class="sample">Gezeichnete Beispiel-Vorschau. Namen und Preise sind Platzhalter, echte Screenshots folgen mit den fertigen Themes.</p>
      </div>
      %s
    </div>''' % (items, T[0]['sb'], store(T[0]), ico('arrow'), tpls)

def build_home():
    prob = next(s for s in home['sections'].values() if s['type'] == 'problem-row')
    loose = ''.join('<li><b>%s</b><span>%s</span></li>' % (e(b['settings']['title']), e(b['settings']['text'])) for b in blocks(prob))
    chapters = ''.join('''
        <article class="chapter" id="ch-%s" data-key="%s">
          <p class="tag">%s · %s</p>
          <h2>%s</h2>
          <p class="lead">%s</p>
          <p><a class="more" href="%s"><span>%s</span>%s</a></p>
          <div class="ch-vis" aria-hidden="true">%s<span class="sample">Beispiel</span></div>
        </article>''' % (s['key'], s['key'], e(s['nice']), e(s['long']), e(s['promise']), e(s['teaser']), s['url'], e(s['link_label']), ico('arrow'), VIS[s['key']]) for s in SERVICES)
    body = '''<div class="story" data-tone="paper">
  <div class="rail"><div class="rail-stick">%(orbit_story)s</div></div>
  <section class="hero" data-block="hero">
    <div class="wrap">
      <h1 class="h-giant"><span class="ln"><span>Online-Präsenz</span></span><span class="ln"><span>für dein</span></span><span class="ln"><span>Unternehmen</span></span></h1>
      <div class="hero-copy">
        <p>NetImpulse entwickelt Shopify-Websites, SEA-Kampagnen und Strategien, damit du online klarer auftrittst, besser gefunden wirst und professioneller verkaufst.</p>
        <div class="hero-actions"><a class="btn" href="kontakt.html">Kostenloses Erstgespräch %(arrow)s</a><a class="more" href="leistungen.html"><span>Alle Leistungen ansehen</span></a></div>
      </div>
      <div class="hero-orbit">%(orbit_auto)s</div>
    </div>
  </section>
  <div class="wrap" id="leistungen" data-block="leistungen">
    <div class="chapters">
      <article class="chapter">
        <h2>%(p_head)s</h2>
        <p class="lead">%(p_text)s</p>
        <ul class="loose">%(loose)s</ul>
        <p class="h-mid">%(p_strong)s</p>
      </article>%(chapters)s
    </div>
  </div>
</div>

<section class="sec" data-tone="deep" data-block="entwurf">
  <div class="wrap">
    <div class="wipe-head">
      <h2 class="h-giant">Vom Gerüst zur fertigen Seite</h2>
      <div><p class="lead">Eine Website sollte sofort verständlich machen, wer du bist, was du anbietest und warum es relevant ist. Zieh den Regler oder scroll weiter und sieh, wie aus einem Entwurf eine Seite wird.</p><p style="margin-top:20px"><a class="more" href="webdesign.html"><span>Mehr zu Webdesign</span>%(arrow)s</a></p></div>
    </div>
    <div class="wipe">
      <div class="device" style="--sb:%(sb)s"><div class="wipe-draft" aria-hidden="true">%(store)s</div><div class="wipe-done">%(store)s</div><div class="wipe-line" aria-hidden="true"></div><input type="range" id="wipe-range" min="0" max="100" value="55" aria-label="Zwischen Entwurf und fertiger Seite wechseln"></div>
      <p class="wipe-tags small"><span>Fertige Seite</span><span>Entwurf</span></p>
    </div>
  </div>
</section>

<section class="sec tight" id="themes" data-tone="deep" data-block="themes">
  <div class="wrap">
    <div class="sec-head"><div><h2 class="h-big">Themes für Shopify, bereit zum Anpassen</h2><p class="lead">Theme- und Section-Packs für verschiedene Branchen. Such dir eins aus und sieh es dir am Desktop und am Handy an.</p></div><a class="more" href="themes.html"><span>Zum Theme Store</span>%(arrow)s</a></div>
    %(explorer)s
  </div>
</section>

<section class="sec" data-tone="paper" data-block="team">
  <div class="wrap team-grid">
    <div><h2 class="h-big">Direkt. Klar. Ohne Umwege.</h2><p class="lead">Bei NetImpulse arbeiten Strategie, Design, Marketing und Shopify-Umsetzung nah zusammen. So entstehen Websites, Kampagnen und Themes, die sich wie ein gemeinsames System anfühlen.</p><a class="more" href="ueber-uns.html"><span>Team kennenlernen</span>%(arrow)s</a></div>
    <ul class="faces">
      <li><img src="assets/img/niklas.jpg" alt="Niklas" width="700" height="875"><b>Niklas</b><span>Online-Marketing und Shopify-Entwicklung</span></li>
      <li><img src="assets/img/luca.jpg" alt="Luca" width="700" height="875"><b>Luca</b><span>Design, Konzept und digitale Auftritte</span></li>
      <li><div class="ph" role="img" aria-label="Tom, Foto folgt">T<small>Foto folgt</small></div><b>Tom</b><span>Content, Organisation und Projektunterstützung</span></li>
    </ul>
  </div>
</section>
''' % dict(arrow=ico('arrow'), orbit_story=orbit('story'), orbit_auto=orbit('auto'), p_head=e(prob['settings']['heading']), p_text=e(prob['settings']['text']), loose=loose,
           p_strong=e(prob['settings']['goal_strong']), chapters=chapters, sb=T[0]['sb'], store=store(T[0]), explorer=explorer())
    page('index.html', 'NetImpulse Prototyp', 'home', body + ask(), standalone=False)

# ---------- Leistungsseiten ----------
def build_service(tpl, fname, key):
    d = load(tpl)
    out = []
    for sid in d['order']:
        sec = d['sections'][sid]; s = sec.get('settings', {}); t = sec['type']
        if t == 'service-hero':
            title = s['crumb_current']
            out.append('''<section class="page-hero" data-block="hero">
  <div class="wrap">
    <p class="crumb"><a href="leistungen.html">Leistungen</a><span>›</span><span>%s</span></p>
    <div class="page-hero-grid">
      <div><h1>%s</h1><p class="lead">%s</p><a class="btn" href="kontakt.html">%s %s</a><a class="more" href="leistungen.html"><span>%s</span></a></div>
      <div class="hero-vis" aria-hidden="true">%s<span class="sample">Beispiel</span></div>
    </div>
  </div>
</section>
''' % (e(s['crumb_current']), e(s['title']), e(s['text']), e(s['button_label']), ico('arrow'), e(s.get('button_2_label', 'Alle Leistungen')), VIS.get(key, VIS['webdesign'])))
        elif t == 'service-catalog':
            cats, cur = [], None
            for b in blocks(sec):
                if b['type'] == 'category':
                    cur = [b['settings']['title'], []]; cats.append(cur)
                elif cur:
                    cur[1].append(b['settings'])
            cols = ''.join('<div class="cat"><h3>%s</h3>%s</div>' % (e(c[0]), ''.join('<button class="offer" type="button" aria-pressed="false"><b>%s</b><span>%s</span><i>%s</i></button>' % (e(o['title']), e(o['text']), ico('plus')) for o in c[1])) for c in cats)
            out.append('''<section class="sec lap" id="angebote" data-block="baukasten">
  <div class="wrap" data-catalog data-topic="%s" data-empty="%s">
    <div class="sec-head"><div><h2 class="h-big">%s</h2><p class="lead">%s</p></div></div>
    <div class="cat-grid">%s</div>
    <div class="tray"><div><b>%s</b><p data-count></p></div><button class="btn" type="button" data-go disabled>%s %s</button></div>
  </div>
</section>
''' % (e(TOPIC_OF.get(key, '')), e(s['empty_text']), e(s['heading']), e(s['text']), cols, e(s['tray_title']), e(s['button_label']), ico('arrow')))
        elif t == 'service-steps':
            steps = ''.join('<li><h3>%s</h3><p>%s</p></li>' % (e(b['settings']['title']), e(b['settings']['text'])) for b in blocks(sec))
            focus = ''
            if s.get('focus_list'):
                focus = '<p class="focus"><b>%s</b>%s</p>' % (e(s.get('focus_title', '')), ''.join('<span>%s%s</span>' % (ico('check'), e(x)) for x in s['focus_list'].split('\n') if x.strip()))
            out.append('''<section class="sec white lap" id="ablauf" data-block="ablauf">
  <div class="wrap">
    <div class="sec-head"><div><h2 class="h-big">%s</h2><p class="lead">%s</p></div></div>
    <ol class="steps">%s</ol>%s
  </div>
</section>
''' % (e(s['heading']), e(s.get('text', '')), steps, focus))
        elif t == 'service-pair':
            col = next((b['settings'] for b in blocks(sec, 'column')), None)
            pan = next((b['settings'] for b in blocks(sec, 'panel')), None)
            if not col: continue
            cols_html = ''.join('<div style="margin-top:40px"><h2 class="h-mid" style="margin-bottom:16px">%s</h2><p class="lead">%s</p></div>' % (e(b['settings']['title']), e(b['settings']['text']).replace('\n\n', '</p><p class="lead" style="margin-top:16px">')) for b in blocks(sec, 'column')[1:])
            panel = ''
            if pan:
                panel = '<div class="pair-list"><h3>%s</h3><ul>%s</ul></div>' % (e(pan['title']), ''.join('<li>%s</li>' % e(x) for x in pan['points'].split('\n') if x.strip()))
            out.append('''<section class="sec deep lap" id="fuer-wen" data-block="fuer-wen">
  <div class="wrap pair">
    <div><h2 class="h-big">%s</h2><p class="lead">%s</p>%s</div>
    %s
  </div>
</section>
''' % (e(col['title']), e(col['text']).replace('\n\n', '</p><p class="lead" style="margin-top:16px">'), cols_html, panel))
        elif t == 'service-directory':
            out.append(directory(key, s['heading']))
    pre = {'seo': 'SEO und GEO', 'geo': 'SEO und GEO', 'sea': 'Google Ads', 'smm': 'Social Media', 'webdesign': 'Website', 'ki': 'KI-Automation'}.get(key)
    page(fname, title + ' · NetImpulse', key, ''.join(out) + ask(pre))

TOPIC_OF = {'seo': 'SEO und GEO', 'geo': 'SEO und GEO', 'sea': 'Google Ads', 'smm': 'Social Media', 'webdesign': 'Website', 'ki': 'KI-Automation'}

def directory(skip, heading):
    groups = [('Sichtbarkeit', ['seo', 'sea', 'smm', 'geo']), ('Websites und Shops', ['webdesign', 'shopify', 'themes']), ('KI und Automation', ['ki'])]
    by = {s['key']: s for s in SERVICES}
    cols = ''.join('<div><h3>%s</h3>%s</div>' % (g, ''.join('<a href="%s"><b>%s</b>%s<span>%s</span></a>' % (by[k]['url'], e(by[k]['nice']), ico('arrow'), e(by[k]['teaser'])) for k in ks if k != skip)) for g, ks in groups)
    return '''<section class="sec lap" id="weiter" data-block="verzeichnis">
  <div class="wrap">
    <div class="sec-head"><div><h2 class="h-big">%s</h2></div><a class="more" href="leistungen.html"><span>Alle Leistungen</span>%s</a></div>
    <div class="dir">%s</div>
  </div>
</section>
''' % (e(heading), ico('arrow'), cols)

# ---------- Leistungsübersicht ----------
def build_overview():
    d = load('page.leistungen.json'); S = d['sections']
    h = S['hero']['settings']
    rows = []
    for sid in d['order']:
        sec = S[sid]
        if sec['type'] != 'service-row': continue
        s = sec['settings']
        partners = []
        for p in s.get('partners', '').split(','):
            if '=' in p:
                n, k = [x.strip() for x in p.split('=')]
                partners.append('<a href="#l-%s">%s</a>' % (k, e(NICE.get(k, n))))
        pts = ''.join('<li>%s<span>%s</span></li>' % (ico('check'), e(x)) for x in s.get('points', '').split('\n') if x.strip())
        btn = ''
        if s.get('button_label') and s['key'] in PAGES and s['key'] != 'shopify':
            btn = '<a class="btn" href="%s">%s %s</a>' % (PAGES[s['key']], e(s['button_label']), ico('arrow'))
        rows.append('''<article class="lrow" id="l-%s">
      <div><h2>%s</h2><p class="sub">%s</p><p class="partners">%s %s</p></div>
      <div><p class="lead">%s</p><ul>%s</ul><div class="acts">%s<a class="more" href="kontakt.html"><span>%s</span></a></div></div>
    </article>''' % (s['key'], e(NICE[s['key']]), e(s['subtitle']), e(s['partners_label']), ', '.join(partners), e(s['text']), pts, btn, e(s['link_label'])))
    bill = S['abrechnung']; steps = ''.join('<li><h3>%s</h3><p>%s</p></li>' % (e(b['settings']['title']), e(b['settings']['text'])) for b in blocks(bill))
    zus = S['zusatz']; prices = ''.join('<li><h3>%s</h3><p class="small">%s. %s</p><span class="price num">%s</span><a class="btn sm" href="kontakt.html">%s</a></li>' % (e(b['settings']['name']), e(b['settings']['text']), e(', '.join(x for x in b['settings']['points'].split('\n') if x.strip())), e(b['settings']['price']), e(b['settings']['button_label'])) for b in blocks(zus))
    body = '''<section class="page-hero light-hero" data-block="hero">
  <div class="wrap">
    <div class="page-hero-grid">
      <div><h1>%s</h1><p class="lead">%s</p><a class="btn" href="kontakt.html">%s %s</a><a class="more" href="#abrechnung"><span>%s</span></a></div>
      %s
    </div>
  </div>
</section>
<section class="sec white lap" data-block="leistungen"><div class="wrap">%s</div></section>
<section class="sec deep lap" id="abrechnung" data-block="abrechnung">
  <div class="wrap">
    <div class="sec-head"><div><h2 class="h-big">%s</h2><p class="lead">%s</p></div><a class="btn" href="kontakt.html">%s %s</a></div>
    <ol class="steps">%s</ol>
  </div>
</section>
<section class="sec lap" id="zusatz" data-block="zusatzleistungen">
  <div class="wrap">
    <div class="sec-head"><div><h2 class="h-big">%s</h2><p class="lead">%s</p></div></div>
    <ul class="prices">%s</ul>
  </div>
</section>
''' % (e(h['title']), e(h['text']), e(h['button_label']), ico('arrow'), e(h['price_label']), orbit('jump'), ''.join(rows),
       e(bill['settings']['heading']), e(bill['settings']['text']), e(bill['settings']['button_label']), ico('arrow'), steps,
       e(zus['settings']['heading']), e(zus['settings']['text']), prices)
    page('leistungen.html', 'Leistungen · NetImpulse', 'leistungen', body + ask())

# ---------- Theme Store ----------
def mini(t):
    return '<a class="theme" href="theme-werkbank.html"><div class="device" style="--sb:%s">%s</div><div class="theme-meta"><b>%s</b><span>%s · <span class="num">%s</span></span></div></a>' % (t['sb'], store(t), e(t['name']), e(t['branche']), e(t['price']))

def build_themes():
    body = '''<section class="page-hero" data-tone="paper" data-block="hero">
  <div class="wrap">
    <h1 class="h-giant" style="max-width:12ch">Shopify-Themes, die nicht nach Baukasten aussehen</h1>
    <p class="lead">Fertige Themes für verschiedene Branchen, gebaut mit Online Store 2.0 und eigenen Sections. Kaufen, installieren und im Theme-Editor anpassen, oder von uns einrichten lassen.</p>
  </div>
</section>
<section class="sec" data-tone="deep" data-block="themes"><div class="wrap">%s</div></section>
<section class="sec" data-tone="mist" data-block="einrichten">
  <div class="wrap sec-head" style="margin-bottom:0">
    <div><h2 class="h-big">Lieber einrichten lassen?</h2><p class="lead">Wir installieren dein Theme, übernehmen Logo und Farben und konfigurieren die Grundeinstellungen. Theme-Setup ab 200 €.</p></div>
    <a class="btn" href="leistungen.html#zusatz">Zusatzleistungen ansehen %s</a>
  </div>
</section>
''' % (explorer(), ico('arrow'))
    page('themes.html', 'Theme Store · NetImpulse', 'themes', body + ask('Theme aus dem Store'))

def build_theme_detail():
    t = T[0]
    body = '''<section class="page-hero" data-tone="paper" data-block="produkt">
  <div class="wrap">
    <p class="crumb"><a href="themes.html">Theme Store</a><span>›</span><span>Werkbank</span></p>
    <div class="td">
      <div class="td-stage">
        <div class="device" style="--sb:%s">%s</div>
        <div class="seg" role="group" aria-label="Vorschau wechseln"><button type="button" data-view="desktop" aria-pressed="true">Desktop</button><button type="button" data-view="phone" aria-pressed="false">Handy</button></div>
        <p class="sample">Gezeichnete Beispiel-Vorschau. Echte Screenshots folgen mit dem fertigen Theme.</p>
      </div>
      <div class="td-info">
        <h1>Werkbank</h1>
        <p class="lead">Für Betriebe, die Leistungen zeigen und Anfragen bekommen wollen. Esstische, Einbauschränke und Treppen aus Massivholz als Beispielinhalt, austauschbar im Theme-Editor.</p>
        <div class="td-price"><b class="num">290 €</b><span class="small">Platzhalter-Preis, einmalig</span></div>
        <div class="td-list"><h2>Enthaltene Sektionen</h2><ul><li>Header mit Menü<span class="small">anpassbar</span></li><li>Hero mit Bild und Button<span class="small">anpassbar</span></li><li>Leistungen im Raster<span class="small">anpassbar</span></li><li>Projekte mit Bildern<span class="small">anpassbar</span></li><li>Anfrageformular<span class="small">anpassbar</span></li><li>Footer<span class="small">anpassbar</span></li></ul></div>
        <fieldset class="td-list"><legend style="padding:0"><h2>Zusatzleistungen</h2></legend>
          <label class="addon"><input type="checkbox" id="add-setup" value="Theme-Setup"><span>Theme-Setup<small>Installation, Grundkonfiguration, Logo und Farben</small></span><span class="num">ab 200 €</span></label>
          <label class="addon"><input type="checkbox" id="add-adapt" value="Anpassung"><span>Bestehendes Theme anpassen<small>Section- und Block-Anpassungen, mobiler Feinschliff</small></span><span>auf Anfrage</span></label>
        </fieldset>
        <button class="btn" type="button" data-buy>In den Warenkorb %s</button>
        <p class="small" style="margin-top:12px">Fragen zum Theme? <a href="kontakt.html">Schreib uns</a>.</p>
      </div>
    </div>
  </div>
</section>
<section class="sec tight" data-tone="paper" data-block="weitere">
  <div class="wrap">
    <div class="sec-head"><div><h2 class="h-big">Weitere Themes</h2></div><a class="more" href="themes.html"><span>Alle Themes</span>%s</a></div>
    <div class="theme-row">%s</div>
  </div>
</section>
''' % (t['sb'], store(t), ico('arrow'), ico('arrow'), ''.join(mini(x) for x in T[1:4]))
    page('theme-werkbank.html', 'Theme Werkbank · NetImpulse', 'themes', body + ask('Theme aus dem Store'))

# ---------- Über uns ----------
def build_about():
    d = load('page.ueber-uns.json'); S = d['sections']
    v = S['werte']; vals = ''.join('<li><i></i><div><h2>%s</h2><p>%s</p></div></li>' % (e(b['settings']['title']), e(b['settings']['text'])) for b in blocks(v))
    tm = S['team']; imgs = {'Niklas': '<img src="assets/img/niklas.jpg" alt="Niklas" width="700" height="875">', 'Luca': '<img src="assets/img/luca.jpg" alt="Luca" width="700" height="875">'}
    members = ''.join('<li>%s<b>%s</b><span class="role">%s · %s</span><p>%s</p></li>' % (imgs.get(b['settings']['name'], '<div class="ph" role="img" aria-label="%s, Foto folgt">%s<small>Foto folgt</small></div>' % (e(b['settings']['name']), e(b['settings']['name'][0]))), e(b['settings']['name']), e(b['settings']['role']), e(b['settings']['focus']), e(b['settings']['text'])) for b in blocks(tm))
    body = '''<section class="sec values" data-tone="paper" data-block="werte">
  <div class="wrap">
    <h1>%s</h1>
    <p class="lead">%s</p>
    <div class="vpath">
      <svg viewBox="0 0 120 1000" preserveAspectRatio="none" aria-hidden="true"><path d="M60 0 C60 60 22 90 22 150 S98 320 98 390 22 560 22 630 98 800 98 860 60 940 60 1000"/></svg>
      <ol>%s</ol>
      <span class="end" aria-hidden="true"></span>
    </div>
  </div>
</section>
<section class="sec mist lap who" data-block="team">
  <div class="wrap">
    <h2 class="h-big">%s</h2>
    <p class="big-lead">%s</p>
    <p class="lead">%s</p>
    <ul class="faces">%s</ul>
  </div>
</section>
''' % (e(v['settings']['title']), e(v['settings']['text']), vals, e(tm['settings']['heading']), e(tm['settings']['lead']), e(tm['settings']['text']), members)
    page('ueber-uns.html', 'Über uns · NetImpulse', 'about', body + ask())

# ---------- Kontakt ----------
def build_contact():
    s = load('page.kontakt.json')['sections']['formular']['settings']
    chips = ''.join('<label><input type="checkbox" id="f-t%d" name="t" value="%s"><span>%s</span></label>' % (i, e(t), e(t)) for i, t in enumerate(TOPICS))
    body = '''<section class="sec light" data-block="kontakt" style="padding-top:clamp(40px,5vw,80px)">
  <div class="wrap form-grid">
    <div>
      <h1 class="h-giant">%s</h1>
      <p class="lead" style="margin-top:28px">%s</p>
      <ul class="contact-lines"><li><span class="small">Telefon</span><b>+49 175 8950320</b></li><li><span class="small">E-Mail</span><b>netimpulsemarketing@gmail.com</b></li><li><span class="small">Standort</span><b>Gießen</b></li></ul>
    </div>
    <div>
      <form class="form" data-contact novalidate>
        <fieldset><legend style="margin-bottom:12px">Worum geht es dir?</legend><div class="chips">%s</div></fieldset>
        <div class="field"><label for="f-name">Name</label><input id="f-name" name="name" type="text" autocomplete="name" aria-describedby="f-name-err"><span class="err" id="f-name-err" role="alert"></span></div>
        <div class="field"><label for="f-email">E-Mail</label><input id="f-email" name="email" type="email" autocomplete="email" aria-describedby="f-email-err"><span class="err" id="f-email-err" role="alert"></span></div>
        <div class="field"><label for="f-message">Nachricht</label><textarea id="f-message" name="message" aria-describedby="f-message-err"></textarea><span class="err" id="f-message-err" role="alert"></span></div>
        <div><button class="btn" type="submit">Nachricht senden %s</button><p class="small" style="margin-top:12px">Mit dem Absenden stimmst du der Verarbeitung laut <a href="%s/policies/privacy-policy">Datenschutzerklärung</a> zu.</p></div>
      </form>
      <div class="form-done" tabindex="-1" hidden><h2 class="h-mid">Danke, das ist ein Prototyp</h2><p style="margin-top:12px">Hier wird nichts gesendet. Im echten Shop geht die Nachricht an uns und du bekommst innerhalb von 48 Stunden eine Antwort.</p></div>
    </div>
  </div>
</section>
''' % (e(s['title']), e(s['text']), chips, ico('arrow'), LIVE)
    # Kontaktseite ohne zusätzliches Anfrage-Band, der Fuß schließt direkt an
    head = '<title>Kontakt · NetImpulse</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="stylesheet" href="assets/site.css">\n'
    full = '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n' + tone(head + header('kontakt') + '<main>\n' + body + '</main>\n' + footer()) + '</body>\n</html>\n'
    open(os.path.join(HERE, 'kontakt.html'), 'w', encoding='utf-8').write(full)

build_home()
for tpl, fname, key in [('page.seo.json', 'seo.html', 'seo'), ('page.sea.json', 'sea.html', 'sea'), ('page.smm.json', 'smm.html', 'smm'), ('page.geo.json', 'geo.html', 'geo'), ('page.web-design.json', 'webdesign.html', 'webdesign'), ('page.ki.json', 'ki.html', 'ki')]:
    build_service(tpl, fname, key)
build_overview(); build_themes(); build_theme_detail(); build_about(); build_contact()
print('fertig')
