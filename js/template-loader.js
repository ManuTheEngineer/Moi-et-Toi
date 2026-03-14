// ===== COMPONENT TEMPLATE LOADER (#22) =====
// Lazy-loads page templates from separate HTML files.
// Templates are loaded on first navigation to the page, reducing initial HTML payload.
//
// Usage:
//   1. Extract a <div class="pg" id="pg-mood">...</div> section from index.html
//   2. Save it as templates/mood.html (just the inner content)
//   3. Replace the section in index.html with: <div class="pg" id="pg-mood" data-template="mood"></div>
//   4. The template-loader will fetch and inject the content on first visit
//
// For development: templates are fetched via HTTP
// For production: the build plugin inlines them at build time

const _templateCache = {};
const _templateLoading = {};

async function loadTemplate(name) {
  // Already loaded
  if (_templateCache[name]) return _templateCache[name];
  // Currently loading (prevent duplicate fetches)
  if (_templateLoading[name]) return _templateLoading[name];

  _templateLoading[name] = fetch('templates/' + name + '.html')
    .then(function (r) {
      if (!r.ok) throw new Error('Template ' + name + ' not found');
      return r.text();
    })
    .then(function (html) {
      _templateCache[name] = html;
      delete _templateLoading[name];
      return html;
    })
    .catch(function (e) {
      console.warn('Template load failed:', name, e);
      delete _templateLoading[name];
      return '';
    });

  return _templateLoading[name];
}

// Hook into page navigation to lazy-load templates
var _origGo = typeof go === 'function' ? go : null;

function initTemplateLoader() {
  // Check if any pages use data-template
  var templatePages = document.querySelectorAll('[data-template]');
  if (!templatePages.length) return;

  // Patch the go() function to load templates before showing pages
  if (typeof go === 'function' && !go._templatePatched) {
    var origGo = go;
    window.go = async function (p) {
      var pageEl = document.getElementById('pg-' + p);
      if (pageEl && pageEl.dataset.template && !pageEl.dataset.templateLoaded) {
        var html = await loadTemplate(pageEl.dataset.template);
        if (html) {
          pageEl.innerHTML = html;
          pageEl.dataset.templateLoaded = 'true';
        }
      }
      return origGo.apply(this, arguments);
    };
    window.go._templatePatched = true;
  }
}

// Preload templates for pages the user is likely to visit
function preloadTemplates() {
  var common = ['games', 'fitness', 'settings', 'nutrition', 'dreamhome', 'calendar', 'knowyou', 'memories', 'achievements', 'values', 'lists', 'wakeup'];
  common.forEach(function (name) {
    var el = document.getElementById('pg-' + name);
    if (el && el.dataset.template && !el.dataset.templateLoaded) {
      loadTemplate(name); // fire and forget
    }
  });
}

// Initialize after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    initTemplateLoader();
    preloadTemplates();
  });
} else {
  initTemplateLoader();
  preloadTemplates();
}
