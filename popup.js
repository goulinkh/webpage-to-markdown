document.addEventListener('DOMContentLoaded', function() {
  const convertBtn = document.getElementById('convertBtn');
  const output = document.getElementById('output');
  const previewBtn = document.getElementById('previewBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  // Check if TurndownService is available
  if (typeof TurndownService === 'undefined') {
    output.value = 'Error: Turndown library not loaded. Please reload the extension.';
    convertBtn.disabled = true;
    return;
  }

  // Add preview button functionality
  previewBtn.addEventListener('click', function() {
    if (output.value.trim() === '') {
      alert('No markdown content to preview. Please convert a page first.');
      return;
    }
    
    // Encode the markdown content for URL
    const encodedContent = encodeURIComponent(output.value);
    
    // Open preview in new tab
    const previewUrl = chrome.runtime.getURL('preview.html') + '?content=' + encodedContent;
    chrome.tabs.create({ url: previewUrl });
  });

  convertBtn.addEventListener('click', async function() {
    try {
      // Show loading state
      convertBtn.textContent = 'Converting...';
      convertBtn.disabled = true;
      output.value = 'Converting webpage to Markdown...';
      
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Execute content script to get HTML content
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getPageContent
      });

      // Display the result
      if (results && results[0] && results[0].result) {
        const pageData = results[0].result;
        
        // Initialize TurndownService with options
        const turndownService = new TurndownService({
          headingStyle: 'atx',
          codeBlockStyle: 'fenced',
          emDelimiter: '*',
          strongDelimiter: '**',
          linkStyle: 'inlined',
          linkReferenceStyle: 'full'
        });

        // Convert HTML to Markdown
        const markdown = turndownService.turndown(pageData.html);
        
        // Add title and URL as header
        const fullMarkdown = `# ${pageData.title}\n\n**Source:** ${pageData.url}\n\n---\n\n${markdown}`;
        
        output.value = fullMarkdown;
      } else {
        output.value = 'Failed to convert page to markdown.';
      }
    } catch (error) {
      output.value = 'Error: ' + error.message;
    } finally {
      // Reset button state
      convertBtn.textContent = 'Convert to Markdown';
      convertBtn.disabled = false;
    }
  });

  // Add copy button functionality
  copyBtn.addEventListener('click', function() {
    output.select();
    document.execCommand('copy');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy to Clipboard';
    }, 2000);
  });
  
  // Add download button functionality
  downloadBtn.addEventListener('click', function() {
    if (output.value.trim() === '') {
      alert('No markdown content to download. Please convert a page first.');
      return;
    }
    
    // Create a blob with the markdown content
    const blob = new Blob([output.value], { type: 'text/markdown' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate filename from page title or use default
    let filename = 'webpage.md';
    try {
      const titleMatch = output.value.match(/^# (.+)$/m);
      if (titleMatch && titleMatch[1]) {
        // Clean the title to make it a valid filename
        filename = titleMatch[1]
          .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
          .replace(/\s+/g, '_') // Replace spaces with underscores
          .substring(0, 50) + '.md'; // Limit length
      }
    } catch (e) {
      // If there's any error, use default filename
      filename = 'webpage.md';
    }
    
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show feedback
    downloadBtn.textContent = 'Downloaded!';
    setTimeout(() => {
      downloadBtn.textContent = 'Download Markdown File';
    }, 2000);
  });
});

// Function to be injected into the page to get HTML content
function getPageContent() {
  // Clone the document to avoid modifying the original
  const clone = document.cloneNode(true);
  
  // Remove script, style, and other non-content elements
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
    const elements = clone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });
  
  // Remove elements with common UI class names
  const uiClasses = [
    'btn', 'button', 'dropdown', 'modal', 'tooltip', 'popup',
    'notification', 'alert', 'badge', 'label', 'icon',
    'avatar', 'profile', 'user-info', 'search', 'filter',
    'sort', 'pagination', 'breadcrumb', 'tabs', 'accordion'
  ];
  
  uiClasses.forEach(className => {
    const elements = clone.querySelectorAll(`.${className}`);
    elements.forEach(el => {
      // Only remove if it's not a main content element
      if (!el.closest('main, article, .content, .post, .entry')) {
        el.remove();
      }
    });
  });
  
  // Get the main content area with improved selectors
  let content = clone.body;
  const mainSelectors = [
    'main',
    '[role="main"]',
    '.main',
    '#main',
    '.content',
    '#content',
    '.post',
    '.article',
    'article',
    '.entry',
    '.entry-content',
    '.post-content',
    '.article-content'
  ];
  
  for (const selector of mainSelectors) {
    const element = clone.querySelector(selector);
    if (element) {
      content = element;
      break;
    }
  }
  
  // Clean up any remaining UI elements within the content
  const remainingUI = content.querySelectorAll('.btn, .button, .dropdown, .modal, .tooltip, .popup, .notification, .alert, .badge, .label, .icon, .avatar, .profile, .user-info, .search, .filter, .sort, .pagination, .breadcrumb, .tabs, .accordion');
  remainingUI.forEach(el => el.remove());
  
  return {
    title: document.title,
    url: window.location.href,
    html: content.innerHTML
  };
} 