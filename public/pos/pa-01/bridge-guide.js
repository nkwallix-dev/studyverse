/* Bridge + Elevator PA Reference: UI-only, reads static teaching texts. No storage, XP, Tokens, or cloud. */
(function () {
  'use strict';
  var pages = [].concat(window.PA_GUIDE_PAGES || [], window.PA_GUIDE_EXTRA || []);
  var selected = 'overview';
  var tab = 'explain';
  var search = '';
  var expanded = Object.create(null);
  var groups = ['START', 'BRÜCKEN 2024', 'AUFZUG 2025', 'WPF TOOLBOX', 'THREADING', 'DEBUGGING', 'TRANSFER'];
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
    return '<section class="pa-info-block"><h3>Wichtiger Codeausschnitt / Muster</h3><p>Die Ausschnitte sind die zentralen Stellen der hochgeladenen Projekte oder ausdrücklich als Muster gekennzeichnet. Der komplette Originalcode bleibt in deiner ZIP.</p><pre class="pa-code"><code>' + esc(p.code) + '</code></pre><p class="pa-code-note">Bei einer neuen PA muss der Code an die genauen Regeln, Klassennamen und vorhandenen Dateien angepasst werden.</p></section>';
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
  function tabs() {
    return [['explain', '📖 Erklärung'], ['code', '♯ Code'], ['mistakes', '⚠ Fehlerfallen'], ['transfer', '↗ Transfer']].map(function (pair) {
      return '<button type="button" role="tab" aria-selected="' + (tab === pair[0]) + '" class="' + (tab === pair[0] ? 'active' : '') + '" data-guide="tab" data-tab="' + pair[0] + '">' + pair[1] + '</button>';
    }).join('');
  }
  function guideMain() {
    var p = find();
    var index = pages.indexOf(p);
    var prior = pages[index - 1], next = pages[index + 1];
    return '<div class="pa-doc-top"><span class="pa-kicker">PA 2024 + 2025 · C# / WPF / MULTITHREADING</span>' +
      '<h1>Brückenbeispiel <em>/ Cheat Sheet</em></h1><p>Deine echte Projektstruktur, ausführlich erklärt. Datei öffnen, Konzept verstehen, Code prüfen, Fehler finden und auf neue Angabe übertragen.</p>' +
      '<div class="pa-proof"><span>33 Kapitel</span><span>Brücken + Aufzug</span><span>Ohne XP · Ohne Tokens · Ohne Speichern</span></div></div>' +
      '<div class="pa-explorer-layout">' +
      '<aside class="pa-explorer" aria-label="Datei-Explorer"><div class="pa-explorer-heading">EXPLORER <span>PA REFERENCE</span></div>' +
      '<label class="pa-search-label" for="pa-guide-search">Suchen in allen Kapiteln</label><input id="pa-guide-search" class="pa-guide-search" type="search" value="' + esc(search) + '" placeholder="Datei, Thema, Fehler …" autocomplete="off"/>' +
      '<div class="pa-tree">' + tree() + '</div></aside>' +
      '<section class="pa-editor"><div class="pa-editor-breadcrumb">STUDYVERSE / SHARPVERSE / ' + esc(p.group) + '</div>' +
      '<div class="pa-editor-filetitle"><span class="pa-editor-icon">' + (p.file.endsWith('.cs') ? '♯' : '▤') + '</span><span>' + esc(p.file) + '</span><small>Lesemodus</small></div>' +
      '<div class="pa-editor-body"><span class="pa-section-tag">' + esc(p.group) + '</span><h2>' + esc(p.title) + '</h2>' +
      '<div class="pa-tabs" role="tablist" aria-label="Dateiansicht">' + tabs() + '</div>' +
      '<div class="pa-tab-content">' + (tab === 'code' ? code(p) : tab === 'mistakes' ? mistakes(p) : tab === 'transfer' ? transfer(p) : explanation(p)) + '</div>' +
      '<div class="pa-editor-footer"><button type="button" ' + (!prior ? 'disabled' : 'data-guide="file" data-id="' + esc(prior ? prior.id : '') + '"') + '>← Vorherige Datei</button>' +
      '<span>' + (index + 1) + ' / ' + pages.length + '</span><button type="button" ' + (!next ? 'disabled' : 'data-guide="file" data-id="' + esc(next ? next.id : '') + '"') + '>Nächste Datei →</button></div>' +
      '</div></section></div>';
  }
  function render() { return guideMain(); }
  function refresh() {
    var main = document.getElementById('main');
    if (main && main.querySelector('.pa-explorer-layout')) {
      main.innerHTML = guideMain();
    }
  }
  document.addEventListener('click', function (ev) {
    var target = ev.target.closest('[data-guide]');
    if (!target) return;
    var action = target.getAttribute('data-guide');
    if (action === 'file') {
      selected = target.getAttribute('data-id') || 'overview';
      tab = 'explain';
      refresh();
      var editor = document.querySelector('.pa-editor');
      if (editor) editor.scrollIntoView({block:'start',behavior:'auto'});
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
  window.PA_BRIDGE_GUIDE = {render:render};
})();