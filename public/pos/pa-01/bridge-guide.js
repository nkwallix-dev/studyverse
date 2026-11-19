/* Bridge + Elevator PA Reference: UI-only, reads static teaching texts. No storage, XP, Tokens, or cloud. */
(function () {
  'use strict';
  var pages = [].concat(window.PA_GUIDE_PAGES || [], window.PA_GUIDE_EXTRA || []).filter(p => p.id !== 'faq');
  var fullSources = Object.create(null);
  var highlights = Object.create(null);
  var sourceError = '';
  var sourceLoaded = false;
  var selected = 'overview';
  var tab = 'explain';
  var search = '';
  var expanded = Object.create(null);
  var groups = ['START', 'BRÜCKEN 2024', 'AUFZUG 2025', 'AIRPORT (REKONSTRUKTION)', 'PRODUKTVERWALTUNG (REKONSTRUKTION)', 'SKALIERBARE GUI', 'WPF TOOLBOX', 'THREADING', 'DEBUGGING', 'TRANSFER'];
  groups.forEach(function (g) { expanded[g] = true; });
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function inline(v) {
    return esc(v).replace(/&#96;([^&#]*?)&#96;/g, '<code>$1</code>');
  }
  function find() { return pages.find(function (p) { return p.id === selected; }) || pages[0]; }
  function tree() {
    var needle = search.trim().toLocaleLowerCase('de');
    var filtered = needle ? pages.filter(function (p) {
      return [p.file, p.title, p.lead, p.group].concat(p.steps || [], p.notes || [], p.transfer || []).join(' ').toLocaleLowerCase('de').includes(needle);
    }) : pages;
    var html = '';
    groups.forEach(function (g) {
      var arr = filtered.filter(function (p) { return p.group === g; });
      if (!arr.length) return;
      var isOpen = needle ? true : expanded[g] !== false;
      html += '<section class="pa-tree-group"><button type="button" class="pa-tree-heading" data-guide="group" data-group="' + esc(g) + '" aria-expanded="' + isOpen + '"><span>' + (isOpen ? '▾' : '▸') + '</span>' + esc(g) + ' <small>' + arr.length + '</small></button>';
      if (isOpen) {
        html += '<div class="pa-tree-files">' + arr.map(function (p) {
          return '<button type="button" class="pa-file ' + (p.id === selected ? 'active' : '') + '" data-guide="file" data-id="' + esc(p.id) + '" title="' + esc(p.title) + '"><span aria-hidden="true">' + (p.file.endsWith('.cs') ? '♯' : p.file.endsWith('.xaml') ? '◇' : '▤') + '</span><span>' + esc(p.file) + '</span></button>';
        }).join('') + '</div>';
      }
      html += '</section>';
    });
    if (!filtered.length) html = '<p class="pa-empty">Keine Treffer. Versuch z. B. „Monitor“, „ComboBox“ oder „Gewicht“.</p>';
    return html;
  }
  function explanation(p) {
    return '<div class="pa-text-content"><section class="pa-info-block"><h3>Was diese Datei / dieses Thema macht</h3><p>' + inline(p.lead) + '</p></section>' +
      '<section class="pa-info-block"><h3>Schritt für Schritt – wirklich erklärt</h3><ol class="pa-deep-steps">' +
      (p.steps || []).map(function (s) { return '<li>' + inline(s) + '</li>'; }).join('') + '</ol></section></div>';
  }
  function code(p) {
    var source = fullSources[p.group + '/' + p.file];
    if (!source) return '<section class="pa-info-block"><h3>Vollständiger Quellcode</h3><p>' +
      (sourceError ? 'Ladefehler: ' + esc(sourceError) :
        sourceLoaded ? 'Dieser Eintrag ist ein Erklärartikel, keine Quelldatei.' :
        'Die vollständigen Quelldateien werden geladen …') + '</p></section>';
    var lines = source.text.split(/\r?\n/);
    var markers = highlights[p.file] || [];
    var rendered = lines.map(function (line, index) {
      var important = markers.some(function (term) { return line.includes(term); });
      return '<div class="pa-code-line' + (important ? ' pa-code-highlight' : '') +
        '"><span class="pa-line-num" aria-hidden="true">' + (index + 1) +
        '</span><span class="pa-line-content">' + (line ? esc(line) : ' ') + '</span></div>';
    }).join('');
    return '<section class="pa-info-block pa-full-source"><h3>Kompletter Quellcode · ' +
      esc(p.file) + '</h3><p class="pa-source-origin">' + esc(source.origin) +
      '</p><div class="pa-code-toolbar"><span>' + lines.length +
      ' Zeilen · markierte Zeilen sind besonders relevant</span>' +
      '<button type="button" data-guide="copy">Gesamte Datei kopieren</button></div>' +
      '<div class="pa-code-complete" role="region" aria-label="Vollständiger Quellcode" tabindex="0"><code>' +
      rendered + '</code></div><p class="pa-code-note">Ungekürzte Datei mit Imports, Klassen und Methoden. Die Markierungen verändern den Code nicht.</p></section>';
  }
  function mistakes(p) {
    return '<section class="pa-info-block"><h3>Typische Fehler und versteckte Fallen</h3>' +
      '<div class="pa-note-list">' + (p.notes || []).map(function (n) {
        return '<div class="pa-note"><span aria-hidden="true">⚠</span><p>' + inline(n) + '</p></div>';
      }).join('') + '</div></section>';
  }
  function transfer(p) {
    return '<section class="pa-info-block"><h3>Wenn die Aufgabe morgen ganz anders heißt …</h3><p>Die Mechanik bleibt häufig dieselbe. Übertrage diese Regeln, nicht blind die Namen:</p><div class="pa-transfer-list">' +
      (p.transfer || []).map(function (n) { return '<p>' + inline(n) + '</p>'; }).join('') +
      '</div></section>';
  }
  function tabs(p) {
    var isFile = /\.(cs|xaml|csproj|sln)$/i.test(p.file);
    var items = [['explain', '📖 Erklärung']];
    if (isFile) items.push(['code', '♯ Vollständiger Code']);
    items.push(['mistakes', '⚠ Fehlerfallen'], ['transfer', '↗ Transfer']);
    return items.map(function (pair) {
      return '<button type="button" role="tab" aria-selected="' + (tab === pair[0]) +
        '" class="' + (tab === pair[0] ? 'active' : '') +
        '" data-guide="tab" data-tab="' + pair[0] + '">' + pair[1] + '</button>';
    }).join('');
  }
  function guideMain() {
    var p = find();
    var index = pages.indexOf(p);
    var prior = pages[index - 1], next = pages[index + 1];
    return '<div class="pa-doc-top"><span class="pa-kicker">PA 2024 + 2025 · C# / WPF / MULTITHREADING</span>' +
      '<h1>Brückenbeispiel <em>/ Cheat Sheet</em></h1><p>Deine echte Projektstruktur, ausführlich erklärt. Datei öffnen, Konzept verstehen, Code prüfen, Fehler finden und auf neue Angabe übertragen.</p>' +
      '<div class="pa-proof"><span>' + pages.length + ' Kapitel</span><span>Brücken · Aufzug · Airport · Produktion · WPF</span><span>Ohne XP · Ohne Tokens · Ohne Speichern</span></div></div>' +
      '<div class="pa-explorer-layout">' +
      '<aside class="pa-explorer" aria-label="Datei-Explorer"><div class="pa-explorer-heading">EXPLORER <span>PA REFERENCE</span></div>' +
      '<label class="pa-search-label" for="pa-guide-search">Suchen in allen Kapiteln</label><input id="pa-guide-search" class="pa-guide-search" type="search" value="' + esc(search) + '" placeholder="Datei, Thema, Fehler …" autocomplete="off"/>' +
      '<div class="pa-tree">' + tree() + '</div></aside>' +
      '<section class="pa-editor"><div class="pa-editor-breadcrumb">STUDYVERSE / SHARPVERSE / ' + esc(p.group) + '</div>' +
      '<div class="pa-editor-filetitle"><span class="pa-editor-icon">' + (p.file.endsWith('.cs') ? '♯' : '▤') + '</span><span>' + esc(p.file) + '</span><small>Lesemodus</small></div>' +
      '<div class="pa-editor-body"><span class="pa-section-tag">' + esc(p.group) + '</span><h2>' + esc(p.title) + '</h2>' +
      '<div class="pa-tabs" role="tablist" aria-label="Dateiansicht">' + tabs(p) + '</div>' +
      '<div class="pa-tab-content">' + (tab === 'code' ? code(p) : tab === 'mistakes' ? mistakes(p) : tab === 'transfer' ? transfer(p) : explanation(p)) + '</div>' +
      '<div class="pa-editor-footer"><button type="button" ' + (!prior ? 'disabled' : 'data-guide="file" data-id="' + esc(prior ? prior.id : '') + '"') + '>← Vorherige Datei</button>' +
      '<span>' + (index + 1) + ' / ' + pages.length + '</span><button type="button" ' + (!next ? 'disabled' : 'data-guide="file" data-id="' + esc(next ? next.id : '') + '"') + '>Nächste Datei →</button></div>' +
      '</div></section></div>';
  }
  function render() { return guideMain(); }
  function refresh() {
    var main = document.getElementById('main');
    if (!main || !main.querySelector('.pa-explorer-layout')) return;
    var explorer = main.querySelector('.pa-explorer');
    var treeElement = main.querySelector('.pa-tree');
    var oldExplorerScroll = explorer ? explorer.scrollTop : 0;
    var oldTreeScroll = treeElement ? treeElement.scrollTop : 0;
    var oldWindowScroll = window.scrollY;
    main.innerHTML = guideMain();
    var newExplorer = main.querySelector('.pa-explorer');
    var newTree = main.querySelector('.pa-tree');
    if (newExplorer) newExplorer.scrollTop = oldExplorerScroll;
    if (newTree) newTree.scrollTop = oldTreeScroll;
    if (Math.abs(window.scrollY - oldWindowScroll) > 1) window.scrollTo(0, oldWindowScroll);
  }
  function setSources(bundle) {
    fullSources = bundle.sources || Object.create(null);
    highlights = bundle.highlights || Object.create(null);
    pages = pages.concat(bundle.pages || []).filter(p => p.id !== 'faq');
    sourceLoaded = true;
    refresh();
  }
  function setError(message) {
    sourceError = String(message || 'Unbekannter Fehler');
    refresh();
  }
  if (window.PA_GUIDE_COMPLETE_BUNDLE) setSources(window.PA_GUIDE_COMPLETE_BUNDLE);
  if (window.PA_GUIDE_SOURCE_ERROR) setError(window.PA_GUIDE_SOURCE_ERROR);
  document.addEventListener('click', function (ev) {
    var target = ev.target.closest('[data-guide]');
    if (!target) return;
    var action = target.getAttribute('data-guide');
    if (action === 'file') {
      selected = target.getAttribute('data-id') || 'overview';
      tab = 'explain';
      refresh();
      // Dateinavigation bleibt an ihrer aktuellen Scrollposition.
    }
    if (action === 'copy') {
      var page = find();
      var src = fullSources[page.group + '/' + page.file];
      if (src && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(src.text).then(function () {
          var button = document.querySelector('[data-guide="copy"]');
          if (button) button.textContent = '✓ Kopiert';
        }).catch(function () {});
      }
      return;
    }
    if (action === 'tab') { tab = target.getAttribute('data-tab') || 'explain'; refresh(); }
    if (action === 'group') { var g = target.getAttribute('data-group'); expanded[g] = !expanded[g]; refresh(); }
  });
  document.addEventListener('input', function (ev) {
    if (ev.target.id !== 'pa-guide-search') return;
    search = ev.target.value;
    var treeEl = document.querySelector('.pa-tree');
    if (treeEl) treeEl.innerHTML = tree();
  });
  window.PA_BRIDGE_GUIDE = {render:render, setSources:setSources, setError:setError};
})();