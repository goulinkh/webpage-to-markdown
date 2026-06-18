// Sanitize HTML by stripping dangerous elements and attributes
function sanitizeHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove dangerous elements
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button', 'link', 'meta', 'base', 'applet'];
  dangerousTags.forEach(tag => {
    doc.querySelectorAll(tag).forEach(el => el.remove());
  });

  // Remove event handler attributes and javascript: URIs from all elements
  doc.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('on') || (attr.name === 'href' && attr.value.trim().toLowerCase().startsWith('javascript:')) || (attr.name === 'src' && attr.value.trim().toLowerCase().startsWith('javascript:'))) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return doc.body.innerHTML;
}

// Escape a string for safe insertion as text in HTML
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Validate and sanitize a URL, returning null if unsafe
function sanitizeURL(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch (e) {
    // invalid URL
  }
  return null;
}

// Get markdown content from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const markdown = urlParams.get('content');

if (markdown) {
  try {
    // Parse the markdown content and sanitize the output
    const rawHtml = marked.parse(markdown);
    const html = sanitizeHTML(rawHtml);

    // Extract title and source info if available
    const titleMatch = markdown.match(/^# (.+)$/m);
    const sourceMatch = markdown.match(/\*\*Source:\*\* (.+)$/m);

    // Build content safely using DOM APIs
    const contentDiv = document.getElementById('content');
    contentDiv.textContent = '';

    const previewDiv = document.createElement('div');
    previewDiv.className = 'preview-content';

    // Add source info if available
    if (sourceMatch) {
      const sourceDiv = document.createElement('div');
      sourceDiv.className = 'source-info';
      const strong = document.createElement('strong');
      strong.textContent = 'Source: ';
      sourceDiv.appendChild(strong);

      const safeUrl = sanitizeURL(sourceMatch[1]);
      if (safeUrl) {
        const link = document.createElement('a');
        link.href = safeUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = sourceMatch[1];
        sourceDiv.appendChild(link);
      } else {
        const span = document.createElement('span');
        span.textContent = sourceMatch[1];
        sourceDiv.appendChild(span);
      }

      previewDiv.appendChild(sourceDiv);
    }

    // Add the sanitized main content
    const articleDiv = document.createElement('div');
    articleDiv.innerHTML = html;
    previewDiv.appendChild(articleDiv);

    contentDiv.appendChild(previewDiv);

    // Set up the markdown source view (already uses textContent — safe)
    const markdownSourceDiv = document.getElementById('markdownSource');
    markdownSourceDiv.textContent = markdown;

    // Update page title if available
    if (titleMatch) {
      document.title = titleMatch[1] + ' - Markdown Preview';
    }

    // Add event listeners for buttons
    document.getElementById('copyBtn').addEventListener('click', function() {
      copyToClipboard(markdown);
      showMessage('copyMessage');
    });

    document.getElementById('downloadBtn').addEventListener('click', function() {
      downloadMarkdown(markdown, titleMatch ? titleMatch[1] : 'markdown');
      showMessage('downloadMessage');
    });

    // Add toggle functionality
    const toggleBtn = document.getElementById('toggleBtn');
    const previewContent = document.querySelector('.preview-content');
    const markdownSource = document.getElementById('markdownSource');

    toggleBtn.addEventListener('click', function() {
      const isShowingMarkdown = markdownSource.classList.contains('show');

      if (isShowingMarkdown) {
        markdownSource.classList.remove('show');
        previewContent.classList.remove('hide');
        toggleBtn.textContent = 'Show Markdown';
        toggleBtn.classList.remove('active');
      } else {
        markdownSource.classList.add('show');
        previewContent.classList.add('hide');
        toggleBtn.textContent = 'Show Preview';
        toggleBtn.classList.add('active');
      }
    });

  } catch (error) {
    const contentDiv = document.getElementById('content');
    contentDiv.textContent = '';
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    const strong = document.createElement('strong');
    strong.textContent = 'Error rendering preview: ';
    errorDiv.appendChild(strong);
    errorDiv.appendChild(document.createTextNode(error.message));
    contentDiv.appendChild(errorDiv);
  }
} else {
  const contentDiv = document.getElementById('content');
  contentDiv.textContent = '';
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  const strong = document.createElement('strong');
  strong.textContent = 'No content provided.';
  errorDiv.appendChild(strong);
  errorDiv.appendChild(document.createTextNode(' Please convert a webpage first.'));
  contentDiv.appendChild(errorDiv);
}

// Function to copy text to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
  }
}

// Fallback copy function
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
  } catch (err) {
    // copy failed silently
  }

  document.body.removeChild(textArea);
}

// Function to download markdown as file
function downloadMarkdown(content, filename) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Function to show success message
function showMessage(messageId) {
  const message = document.getElementById(messageId);
  message.classList.add('show');
  setTimeout(() => {
    message.classList.remove('show');
  }, 2000);
}
