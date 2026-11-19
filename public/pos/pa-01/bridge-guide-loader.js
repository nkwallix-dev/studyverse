/* Loads complete local PA source pack. No progress tracking, storage or rewards. */
(function () {
  'use strict';
  async function loadCompleteSources() {
    const response = await fetch('guide-sources.pack', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Source pack: HTTP ' + response.status);
    const encoded = (await response.text()).trim();
    const bytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Der Browser unterstützt DecompressionStream noch nicht.');
    }
    const raw = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const bundle = JSON.parse(await new Response(raw).text());
    if (!bundle || !bundle.sources || !Array.isArray(bundle.pages)) {
      throw new Error('Ungültiges Quelldateien-Paket.');
    }
    window.PA_GUIDE_COMPLETE_BUNDLE = bundle;
    if (window.PA_BRIDGE_GUIDE && window.PA_BRIDGE_GUIDE.setSources) {
      window.PA_BRIDGE_GUIDE.setSources(bundle);
    }
  }
  window.PA_GUIDE_SOURCE_READY = loadCompleteSources().catch(error => {
    window.PA_GUIDE_SOURCE_ERROR = String(error && error.message || error);
    if (window.PA_BRIDGE_GUIDE && window.PA_BRIDGE_GUIDE.setError) {
      window.PA_BRIDGE_GUIDE.setError(window.PA_GUIDE_SOURCE_ERROR);
    }
    console.error('PA Nachschlagewerk:', error);
  });
})();