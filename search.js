// Global search suggestions (shared across all pages)
(function(){
  const SEARCH_KEYWORDS = [
    'pdf ai',
    'firstpage pdf',
    'pdf converter',
    'website report',
    'pdf to ppt',
    'pdf to ppt converter',
    'text to file converter',
    'text to pdf converter',
    'text to doc converter',
    'text to document converter',
    'text to rich text file converter'
  ];

  const SEARCH_MAP = {
    'pdf ai': { label: 'AI Document Generator', href: 'ai-generator.html' },
    'firstpage pdf': { label: 'AI Document Generator', href: 'ai-generator.html' },
    'pdf converter': { label: 'PDF to PPT / Converters', href: 'pdf-to-ppt.html' },
    'website report': { label: 'Website Report Generator', href: 'website-report.html' },
    'pdf to ppt': { label: 'PDF to PPT Converter', href: 'pdf-to-ppt.html' },
    'pdf to ppt converter': { label: 'PDF to PPT Converter', href: 'pdf-to-ppt.html' },
    'text to file converter': { label: 'Text → Document tools', href: 'index.html' },
    'text to pdf converter': { label: 'Export to PDF', href: 'index.html' },
    'text to doc converter': { label: 'Export to DOC', href: 'index.html' },
    'text to document converter': { label: 'Export to Document', href: 'index.html' },
    'text to rich text file converter': { label: 'Rich Text / Formatting', href: 'index.html' }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('siteSearch');
    const suggestionsBox = document.getElementById('searchSuggestions');
    if (!searchInput || !suggestionsBox) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        suggestionsBox.style.display = 'none';
        return;
      }
      const matches = SEARCH_KEYWORDS.filter(kw => kw.includes(query));
      if (matches.length === 0) {
        suggestionsBox.style.display = 'none';
        return;
      }
      suggestionsBox.innerHTML = matches.map(m => {
        const item = SEARCH_MAP[m] || { label: m, href: 'index.html' };
        return `<div style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #e5e7eb;color:#1e293b" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='#fff'" onclick="window.location.href='${item.href}'"><strong style="color:#2563eb">${item.label}</strong><br><small style="color:#64748b">${m}</small></div>`;
      }).join('');
      suggestionsBox.style.display = 'block';
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => { suggestionsBox.style.display = 'none'; }, 200);
    });
  });
})();
