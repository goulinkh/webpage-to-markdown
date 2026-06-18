// Create context menu item on install
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: 'copyAsMarkdown',
    title: 'Copy page as Markdown',
    contexts: ['page'],
    icons: { '16': 'icons/icon16.png', '32': 'icons/icon32.png' }
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(async function(info, tab) {
  if (info.menuItemId !== 'copyAsMarkdown') return;

  try {
    // First inject Turndown library into the page
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['turndown.js']
    });

    // Then inject and run the conversion + copy logic
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractConvertAndCopy
    });
  } catch (error) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: showToast,
        args: ['Error: ' + error.message, true]
      });
    } catch (_) {
      // tab may have been closed or is a restricted page
    }
  }
});

// Injected into the page: extract content, convert to markdown, copy to clipboard
function extractConvertAndCopy() {
  // --- Extract page content ---
  const clone = document.cloneNode(true);

  const elementsToRemove = [
    'script', 'style', 'noscript', 'iframe', 'embed', 'object',
    'nav', 'header', 'footer', 'aside', 'menu', 'menuitem',
    '.navigation', '.nav', '.header', '.footer', '.sidebar',
    '.menu', '.breadcrumb', '.pagination', '.social-share',
    '.advertisement', '.ads', '.banner', '.popup', '.modal',
    '.tooltip', '.dropdown', '.modal', '.overlay',
    '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
    '[role="search"]', '[role="menubar"]', '[role="toolbar"]'
  ];

  elementsToRemove.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });

  const uiClasses = [
    'btn', 'button', 'dropdown', 'modal', 'tooltip', 'popup',
    'notification', 'alert', 'badge', 'label', 'icon',
    'avatar', 'profile', 'user-info', 'search', 'filter',
    'sort', 'pagination', 'breadcrumb', 'tabs', 'accordion'
  ];

  uiClasses.forEach(className => {
    clone.querySelectorAll(`.${className}`).forEach(el => {
      if (!el.closest('main, article, .content, .post, .entry')) {
        el.remove();
      }
    });
  });

  let content = clone.body;
  const mainSelectors = [
    'main', '[role="main"]', '.main', '#main',
    '.content', '#content', '.post', '.article',
    'article', '.entry', '.entry-content',
    '.post-content', '.article-content'
  ];

  for (const selector of mainSelectors) {
    const element = clone.querySelector(selector);
    if (element) {
      content = element;
      break;
    }
  }

  content.querySelectorAll('.btn, .button, .dropdown, .modal, .tooltip, .popup, .notification, .alert, .badge, .label, .icon, .avatar, .profile, .user-info, .search, .filter, .sort, .pagination, .breadcrumb, .tabs, .accordion')
    .forEach(el => el.remove());

  // --- Convert to Markdown ---
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full'
  });

  const markdown = turndownService.turndown(content.innerHTML);
  const fullMarkdown = `# ${document.title}\n\n**Source:** ${window.location.href}\n\n---\n\n${markdown}`;

  // --- Copy to clipboard ---
  navigator.clipboard.writeText(fullMarkdown).then(() => {
    showCopyToast('Copied as Markdown!');
  }).catch(() => {
    const textArea = document.createElement('textarea');
    textArea.value = fullMarkdown;
    textArea.style.cssText = 'position:fixed;left:0;top:0;opacity:0;';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showCopyToast('Copied as Markdown!');
    } catch (_) {
      showCopyToast('Failed to copy to clipboard.');
    }
    document.body.removeChild(textArea);
  });

  function showCopyToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#333;color:#fff;padding:12px 24px;border-radius:8px;font:14px/1.4 -apple-system,sans-serif;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.3);transition:opacity .3s;';
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; }, 1800);
    setTimeout(() => { toast.remove(); }, 2200);
  }
}

// Injected into the page: show an error toast
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#e74c3c;color:#fff;padding:12px 24px;border-radius:8px;font:14px/1.4 -apple-system,sans-serif;z-index:2147483647;box-shadow:0 4px 12px rgba(0,0,0,.3);transition:opacity .3s;';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
  setTimeout(() => { toast.remove(); }, 3000);
}
