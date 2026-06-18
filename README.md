# Website to Markdown Browser Extension

A Chrome browser extension that converts web pages to Markdown format using the [Turndown](https://github.com/mixmark-io/turndown) library.

## Features

- **HTML to Markdown Conversion**: Converts web page content to clean Markdown format
- **Smart Content Detection**: Automatically detects main content areas using common selectors
- **Clean Output**: Removes scripts, styles, and unnecessary elements
- **Copy to Clipboard**: One-click copying of converted Markdown
- **Loading States**: Visual feedback during conversion process
- **Error Handling**: Graceful error handling with user-friendly messages

## Installation

### For Development

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your toolbar

### For Users

1. Download the extension from the Chrome Web Store (when published)
2. Click "Add to Chrome" to install

## Usage

1. Navigate to any webpage you want to convert to Markdown
2. Click the extension icon in your browser toolbar
3. Click "Convert to Markdown" in the popup
4. Wait for the conversion to complete
5. Use "Copy to Clipboard" to copy the Markdown content
6. Paste the Markdown into your preferred editor or platform

## How It Works

The extension uses the [Turndown](https://github.com/mixmark-io/turndown) library to convert HTML to Markdown. Here's the process:

1. **Content Extraction**: The extension injects a script into the current page to extract the HTML content
2. **Content Cleaning**: Removes scripts, styles, and other non-content elements
3. **Smart Selection**: Tries to find the main content area using common selectors like `main`, `article`, `.content`, etc.
4. **Markdown Conversion**: Uses Turndown with optimized settings for clean Markdown output
5. **Formatting**: Adds page title, source URL, and formatting to the output

## Configuration

The extension uses the following Turndown configuration:

```javascript
{
  headingStyle: 'atx',        // Uses # for headings
  codeBlockStyle: 'fenced',   // Uses ``` for code blocks
  emDelimiter: '*',           // Uses * for emphasis
  strongDelimiter: '**',      // Uses ** for strong text
  linkStyle: 'inlined',       // Inline links
  linkReferenceStyle: 'full'  // Full reference style for links
}
```

## File Structure

```
website_to_markdown/
├── manifest.json      # Extension manifest
├── popup.html         # Extension popup interface
├── popup.js           # Main conversion logic
├── turndown.js        # Turndown library (local copy)
├── content.js         # Content script (minimal)
├── background.js      # Background service worker
├── test.html          # Test page for verification
└── README.md          # This file
```

## Troubleshooting

### "TurndownService is not defined" Error

If you encounter this error:

1. **Reload the extension**: Go to `chrome://extensions/`, find the extension, and click the reload button
2. **Check file structure**: Ensure `turndown.js` is in the same directory as `popup.html`
3. **Clear browser cache**: Clear your browser cache and reload the extension
4. **Check console**: Open the extension popup, right-click and "Inspect" to check for any JavaScript errors

### Extension Not Working

1. **Check permissions**: Ensure the extension has the necessary permissions (`activeTab`, `scripting`)
2. **Test on different sites**: Some sites may have security restrictions
3. **Check manifest version**: Ensure you're using Manifest V3 (Chrome 88+)

### Poor Conversion Quality

1. **Content detection**: The extension tries to find main content areas. If it's not working well on a specific site, the content might be in an unusual structure
2. **Complex layouts**: Very complex layouts with lots of nested elements might not convert perfectly
3. **Dynamic content**: Content loaded via JavaScript might not be captured

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension manifest)
- **Permissions**: `activeTab`, `scripting` (minimal permissions)
- **Content Scripts**: Runs on all URLs for basic functionality
- **Background**: Service worker for extension lifecycle management

## Browser Compatibility

- Chrome 88+ (Manifest V3 support)
- Edge 88+ (Chromium-based)
- Other Chromium-based browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- [Turndown](https://github.com/mixmark-io/turndown) - The HTML to Markdown converter library
- Chrome Extensions API - For browser integration