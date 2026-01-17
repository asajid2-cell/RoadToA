# Wix Mode - Visual Page Editor

## Overview
Wix Mode is a comprehensive visual editing system that allows you to edit your website directly in the browser without touching any code. All changes are saved locally and persist across sessions.

## How to Enable Wix Mode

1. Navigate to `website-settings.html`
2. Scroll to the "Wix Edit Mode" section (green gradient card)
3. Toggle the switch to **ON**
4. Navigate to any page you want to edit (index.html, team.html, etc.)
5. You'll see a toolbar at the top of the page with editing tools

## Features

### 1. **Select Elements**
- Click text elements (headings, paragraphs, buttons) to select them
- Only small text elements can be selected - large sections and backgrounds are protected
- Selected elements show an orange outline with "✓ Selected" label
- Click elsewhere to deselect

### 2. **Move Elements**
- Click and drag small elements (headings, paragraphs, buttons, images) to reposition
- Only elements smaller than 600px wide and 400px tall can be dragged
- Large sections and containers are protected from accidental movement
- Position is saved automatically

### 3. **Edit Text**
- Double-click any text (headings, paragraphs, buttons) to edit inline
- Type your changes
- Click outside the element or press Escape to finish editing
- Changes save automatically

### 4. **Add New Elements**

#### Add Text Box
- Click "T Add Text" in the toolbar
- A new text box appears in the center
- Double-click to edit the text
- Drag to reposition

#### Add Rectangle/Box
- Click "▭ Add Box" in the toolbar
- A new green gradient rectangle appears
- Drag to move it anywhere on the page

#### Add Circle
- Click "○ Add Circle" in the toolbar
- A new circular element with terracotta gradient appears
- Drag to reposition

#### Add Image
- Click "🖼️ Add Image" in the toolbar
- Enter an image URL when prompted
- The image appears and can be dragged to position

### 5. **Delete Elements**
- Select an element by clicking it
- Press the **Delete** key on your keyboard
- OR click the "🗑️ Delete" button in the toolbar
- Confirm the deletion

### 6. **Save Changes**
- Click the "💾 Save" button in the toolbar
- OR press **Ctrl+S** (Cmd+S on Mac)
- Changes are automatically saved to localStorage

### 7. **Reset All Changes**
- Click the "↺ Reset All" button
- Confirms before removing all Wix mode changes
- Page reloads to original state

### 8. **Exit Wix Mode**
- Click the "✕ Exit" button in the toolbar
- Wix mode is disabled
- You can re-enable it in website-settings.html

## Keyboard Shortcuts

- **Delete** - Delete selected element
- **Escape** - Deselect current element
- **Ctrl+S** (Cmd+S) - Save changes

## How It Works

### Storage
- All changes are saved to browser localStorage
- Each page has its own saved state
- Changes persist even after closing the browser
- No server or backend required

### What Gets Saved
1. **Modified Elements**: Changes to existing text, positioning, and styles
2. **Added Elements**: All elements you add (text, shapes, images)
3. **Element Positions**: Absolute positioning for dragged elements

### Files Involved

1. **wix-mode.js** - Main editing engine
   - Handles all editing functionality
   - Manages drag-and-drop
   - Saves/loads changes from localStorage

2. **wix-mode.css** - Visual styling
   - Toolbar styling
   - Selection outlines
   - Element highlights

3. **website-settings.html** - Control panel
   - Toggle to enable/disable Wix mode
   - Status indicator

## Adding Wix Mode to More Pages

To enable Wix mode on additional pages, add these lines to the `<head>` section:

```html
<!-- Wix Mode -->
<link rel="stylesheet" href="wix-mode.css">
<script src="wix-mode.js"></script>
```

Currently enabled on:
- ✅ index.html
- ✅ team.html
- ✅ website-settings.html

To add to other pages (blog.html, contact.html, etc.), add the same two lines.

## Important Notes

### What You CAN Edit
- ✅ Headings (H1, H2, H3, etc.) - small ones only
- ✅ Paragraphs and text content
- ✅ Buttons
- ✅ Small images (under 800px)
- ✅ Add custom text, shapes, and images

### What You CANNOT Edit
- ❌ Navigation bar (protected for site integrity)
- ❌ Footer (protected for consistency)
- ❌ The Wix mode toolbar itself
- ❌ Large sections and containers (width > 800px or height > 800px)
- ❌ Background elements and page layouts
- ❌ Large images and hero sections

### Safety Features
- **Confirmation dialogs** for destructive actions (delete, reset)
- **Protected elements** (nav, footer, large sections) can't be accidentally deleted or moved
- **Size restrictions** prevent moving large layout elements that could break the page
- **Precise selection** only targets text elements, not backgrounds or containers
- **Local storage only** - changes don't affect other users
- **Easy reset** - can always revert all changes

## Troubleshooting

### Changes Not Saving?
- Check browser console for errors
- Ensure localStorage is enabled in your browser
- Try clicking the "💾 Save" button manually

### Can't Drag Elements?
- Make sure the element is selected (orange outline)
- Some elements may need position adjustment
- Try refreshing the page

### Wix Mode Not Activating?
- Verify the toggle is ON in website-settings.html
- Check browser console for JavaScript errors
- Ensure wix-mode.js and wix-mode.css are loading

### Reset Not Working?
- Clear browser localStorage manually
- Browser DevTools → Application → Local Storage → Clear All

## Technical Details

### Browser Compatibility
- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Mobile browsers: ⚠️ Limited (drag-and-drop may not work)

### Performance
- Minimal impact on page load
- Only activates when enabled
- Efficient localStorage usage
- No server requests needed

## Future Enhancements (Optional)

Potential features to add:
- Resize handles for elements
- Undo/Redo functionality
- Copy/Paste elements
- Custom colors for shapes
- Export changes as HTML
- Multi-element selection
- Alignment guides
- Element layering (z-index control)

## Support

For issues or questions:
- Check browser console for error messages
- Verify all files are in the correct directory
- Test in different browsers
- Clear cache and reload

---

**Created for Road to A Website**
Version 1.0 - Comprehensive Visual Editor
