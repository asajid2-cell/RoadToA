/**
 * Wix Mode - Visual Page Editor (Robust Version)
 * Allows users to edit, move, delete, and add elements directly on the page
 */

(function() {
    'use strict';

    // Check if Wix mode is enabled
    const isWixModeEnabled = () => localStorage.getItem('wix-mode-enabled') === 'true';

    // State management
    let selectedElement = null;
    let dragState = {
        isDragging: false,
        element: null,
        startX: 0,
        startY: 0,
        initialX: 0,
        initialY: 0
    };

    // Initialize Wix mode if enabled
    function initWixMode() {
        if (!isWixModeEnabled()) return;

        console.log('Initializing Wix Mode...');

        // Add Wix mode UI
        addWixModeUI();

        // Load saved changes
        loadSavedChanges();

        // Make elements editable (after loading saved changes)
        setTimeout(() => {
            makeElementsEditable();
        }, 100);

        // Add global event listeners
        document.addEventListener('mousedown', handleMouseDown, true);
        document.addEventListener('mousemove', handleMouseMove, true);
        document.addEventListener('mouseup', handleMouseUp, true);
        document.addEventListener('click', handleClick, true);
        document.addEventListener('keydown', handleKeyPress);

        console.log('Wix Mode activated');
    }

    // Add Wix mode toolbar
    function addWixModeUI() {
        // Remove existing toolbar if present
        const existingToolbar = document.getElementById('wix-toolbar');
        if (existingToolbar) existingToolbar.remove();

        const toolbar = document.createElement('div');
        toolbar.id = 'wix-toolbar';
        toolbar.innerHTML = `
            <div class="wix-toolbar-content">
                <div class="wix-toolbar-title">
                    ✏️ Edit Mode Active
                </div>
                <div class="wix-toolbar-buttons">
                    <button class="wix-btn" onclick="WixMode.addTextElement()" title="Add Text">
                        <span>T</span> Add Text
                    </button>
                    <button class="wix-btn" onclick="WixMode.addShapeElement('rectangle')" title="Add Rectangle">
                        <span>▭</span> Add Box
                    </button>
                    <button class="wix-btn" onclick="WixMode.addShapeElement('circle')" title="Add Circle">
                        <span>○</span> Add Circle
                    </button>
                    <button class="wix-btn" onclick="WixMode.addImageElement()" title="Add Image">
                        <span>🖼️</span> Add Image
                    </button>
                    <button class="wix-btn wix-btn-danger" onclick="WixMode.deleteSelected()" title="Delete Selected (Del)">
                        <span>🗑️</span> Delete
                    </button>
                    <button class="wix-btn wix-btn-success" onclick="WixMode.saveChanges()" title="Save Changes">
                        <span>💾</span> Save
                    </button>
                    <button class="wix-btn wix-btn-warning" onclick="WixMode.resetChanges()" title="Reset All Changes">
                        <span>↺</span> Reset All
                    </button>
                    <button class="wix-btn wix-btn-secondary" onclick="WixMode.exitWixMode()" title="Exit Edit Mode">
                        <span>✕</span> Exit
                    </button>
                </div>
                <div class="wix-toolbar-help">
                    💡 Click to select • Drag to move • Double-click text to edit • Delete to remove
                </div>
            </div>
        `;
        document.body.appendChild(toolbar);
    }

    // Make elements editable
    function makeElementsEditable() {
        // Target small text elements and images
        const editableSelectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p',
            'button', '.btn-cta', '.btn-primary',
            'img:not(nav img):not(footer img)'
        ];

        editableSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Skip protected elements
                if (isProtectedElement(element)) return;

                // Skip already processed elements
                if (element.classList.contains('wix-editable') ||
                    element.classList.contains('wix-element')) {
                    return;
                }

                // Check size constraints
                const rect = element.getBoundingClientRect();
                if (rect.width > 800 || rect.height > 800) return;

                // Mark as editable
                element.classList.add('wix-editable');

                // Add unique ID
                if (!element.hasAttribute('data-wix-id')) {
                    element.setAttribute('data-wix-id', generateUniqueId());
                }

                // Make text editable on double-click
                if (isTextElement(element)) {
                    element.addEventListener('dblclick', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        makeTextEditable(element);
                    });
                }
            });
        });

        console.log('Made elements editable');
    }

    // Check if element is protected
    function isProtectedElement(element) {
        return element.closest('nav') ||
               element.closest('footer') ||
               element.closest('#wix-toolbar') ||
               element.id === 'wix-toolbar';
    }

    // Check if element is a text element
    function isTextElement(element) {
        const textTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON'];
        return textTags.includes(element.tagName);
    }

    // Handle mouse down (start drag or select)
    function handleMouseDown(e) {
        // Ignore if clicking toolbar
        if (e.target.closest('#wix-toolbar')) return;

        // Find editable element
        const target = e.target.closest('.wix-editable, .wix-element');
        if (!target) return;

        // Don't start drag if element is being edited
        if (target.contentEditable === 'true' && target.isContentEditable) return;

        // Select element
        selectElement(target);

        // Check if draggable (not too large)
        const rect = target.getBoundingClientRect();
        if (rect.width >= 600 || rect.height >= 400) return;

        // Start drag
        e.preventDefault();
        e.stopPropagation();

        // Ensure element has absolute positioning for dragging
        if (!target.style.position || target.style.position === 'static') {
            const computedStyle = window.getComputedStyle(target);
            const currentLeft = target.offsetLeft;
            const currentTop = target.offsetTop;

            target.style.position = 'absolute';
            target.style.left = currentLeft + 'px';
            target.style.top = currentTop + 'px';
            target.style.margin = '0';
        }

        dragState.isDragging = true;
        dragState.element = target;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        dragState.initialX = parseFloat(target.style.left) || 0;
        dragState.initialY = parseFloat(target.style.top) || 0;

        target.classList.add('wix-dragging');
        target.style.cursor = 'grabbing';
        target.style.zIndex = '9999';

        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
    }

    // Handle mouse move (drag)
    function handleMouseMove(e) {
        if (!dragState.isDragging || !dragState.element) return;

        e.preventDefault();
        e.stopPropagation();

        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;

        const newX = dragState.initialX + deltaX;
        const newY = dragState.initialY + deltaY;

        dragState.element.style.left = newX + 'px';
        dragState.element.style.top = newY + 'px';
    }

    // Handle mouse up (end drag)
    function handleMouseUp(e) {
        if (!dragState.isDragging) return;

        e.preventDefault();
        e.stopPropagation();

        if (dragState.element) {
            dragState.element.classList.remove('wix-dragging');
            dragState.element.style.cursor = 'move';

            // Auto-save after drag
            saveChanges();
        }

        // Reset drag state
        dragState.isDragging = false;
        dragState.element = null;

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    // Handle click (selection)
    function handleClick(e) {
        // Ignore if dragging
        if (dragState.isDragging) return;

        // Ignore toolbar clicks
        if (e.target.closest('#wix-toolbar')) return;

        // Find editable element (direct click only)
        if (e.target.classList.contains('wix-editable') ||
            e.target.classList.contains('wix-element')) {
            selectElement(e.target);
        } else {
            // Deselect if clicking elsewhere
            deselectElement();
        }
    }

    // Select element
    function selectElement(element) {
        if (selectedElement === element) return;

        // Deselect previous
        deselectElement();

        // Select new
        selectedElement = element;
        element.classList.add('wix-selected');

        // Set cursor
        const rect = element.getBoundingClientRect();
        if (rect.width < 600 && rect.height < 400) {
            element.style.cursor = 'move';
        } else {
            element.style.cursor = 'text';
        }
    }

    // Deselect element
    function deselectElement() {
        if (selectedElement) {
            selectedElement.classList.remove('wix-selected');
            selectedElement = null;
        }
    }

    // Make text editable
    function makeTextEditable(element) {
        // Prevent dragging while editing
        element.contentEditable = true;
        element.style.cursor = 'text';
        element.focus();

        // Select all text
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Handle blur (finish editing)
        const handleBlur = () => {
            element.contentEditable = false;

            const rect = element.getBoundingClientRect();
            if (rect.width < 600 && rect.height < 400) {
                element.style.cursor = 'move';
            }

            element.removeEventListener('blur', handleBlur);
            saveChanges();
        };

        element.addEventListener('blur', handleBlur, { once: true });

        // Handle Enter key (finish editing)
        const handleEnter = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                element.blur();
            }
        };

        element.addEventListener('keydown', handleEnter);
        element.addEventListener('blur', () => {
            element.removeEventListener('keydown', handleEnter);
        }, { once: true });
    }

    // Handle keyboard shortcuts
    function handleKeyPress(e) {
        // Delete key
        if (e.key === 'Delete' && selectedElement) {
            e.preventDefault();
            deleteElement(selectedElement);
        }

        // Escape key - deselect
        if (e.key === 'Escape') {
            if (selectedElement && selectedElement.contentEditable === 'true') {
                selectedElement.blur();
            }
            deselectElement();
        }

        // Ctrl+S - save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveChanges();
            showNotification('Changes saved! ✅');
        }
    }

    // Add text element
    function addTextElement() {
        const textElement = document.createElement('div');
        textElement.className = 'wix-element wix-text-element';
        textElement.setAttribute('data-wix-id', generateUniqueId());
        textElement.textContent = 'Double-click to edit';

        // Position in center of viewport
        const viewportX = window.scrollX + window.innerWidth / 2;
        const viewportY = window.scrollY + window.innerHeight / 2;

        textElement.style.cssText = `
            position: absolute;
            left: ${viewportX - 100}px;
            top: ${viewportY - 50}px;
            padding: 1rem 1.5rem;
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #C06C4F;
            border-radius: 12px;
            min-width: 200px;
            cursor: move;
            z-index: 1000;
            font-family: 'Inter', sans-serif;
            font-size: 1rem;
            color: #2C1E1A;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(textElement);

        // Make it editable
        textElement.classList.add('wix-editable');
        textElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            makeTextEditable(textElement);
        });

        // Select and focus
        selectElement(textElement);
        setTimeout(() => makeTextEditable(textElement), 100);

        saveChanges();
    }

    // Add shape element
    function addShapeElement(shapeType) {
        const shapeElement = document.createElement('div');
        shapeElement.className = 'wix-element wix-shape-element';
        shapeElement.setAttribute('data-wix-id', generateUniqueId());
        shapeElement.setAttribute('data-shape-type', shapeType);

        // Position in center of viewport
        const viewportX = window.scrollX + window.innerWidth / 2;
        const viewportY = window.scrollY + window.innerHeight / 2;

        let shapeStyles = `
            position: absolute;
            left: ${viewportX - 100}px;
            top: ${viewportY - 100}px;
            width: 200px;
            height: 200px;
            cursor: move;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            transition: transform 0.2s;
        `;

        if (shapeType === 'rectangle') {
            shapeStyles += `
                background: linear-gradient(135deg, #8FAA8B 0%, #7BA58C 100%);
                border-radius: 15px;
            `;
        } else if (shapeType === 'circle') {
            shapeStyles += `
                background: linear-gradient(135deg, #D97555 0%, #C06C4F 100%);
                border-radius: 50%;
            `;
        }

        shapeElement.style.cssText = shapeStyles;
        document.body.appendChild(shapeElement);

        // Select it
        selectElement(shapeElement);
        saveChanges();
    }

    // Add image element
    function addImageElement() {
        const imageUrl = prompt('Enter image URL:');
        if (!imageUrl) return;

        const imgElement = document.createElement('img');
        imgElement.className = 'wix-element wix-image-element wix-editable';
        imgElement.setAttribute('data-wix-id', generateUniqueId());
        imgElement.src = imageUrl;
        imgElement.alt = 'Custom image';

        // Position in center of viewport
        const viewportX = window.scrollX + window.innerWidth / 2;
        const viewportY = window.scrollY + window.innerHeight / 2;

        imgElement.style.cssText = `
            position: absolute;
            left: ${viewportX - 150}px;
            top: ${viewportY - 150}px;
            max-width: 300px;
            cursor: move;
            z-index: 1000;
            border: 2px solid #C06C4F;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(imgElement);
        selectElement(imgElement);
        saveChanges();
    }

    // Delete element
    function deleteElement(element) {
        if (!element) return;

        const confirmed = confirm('Delete this element?');
        if (!confirmed) return;

        element.remove();
        selectedElement = null;
        saveChanges();
        showNotification('Element deleted');
    }

    // Delete selected element
    function deleteSelected() {
        if (!selectedElement) {
            alert('Please select an element to delete');
            return;
        }
        deleteElement(selectedElement);
    }

    // Generate unique ID
    function generateUniqueId() {
        return 'wix-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Save changes
    function saveChanges() {
        const pageKey = 'wix-changes-' + window.location.pathname;

        const changes = {
            modified: [],
            added: []
        };

        // Save modified elements
        document.querySelectorAll('.wix-editable[data-wix-id]:not(.wix-element)').forEach(element => {
            changes.modified.push({
                id: element.getAttribute('data-wix-id'),
                html: element.innerHTML,
                styles: element.getAttribute('style') || ''
            });
        });

        // Save added elements
        document.querySelectorAll('.wix-element[data-wix-id]').forEach(element => {
            changes.added.push({
                id: element.getAttribute('data-wix-id'),
                tagName: element.tagName,
                className: element.className,
                html: element.innerHTML,
                styles: element.getAttribute('style') || '',
                attributes: {
                    'data-shape-type': element.getAttribute('data-shape-type'),
                    'src': element.getAttribute('src'),
                    'alt': element.getAttribute('alt')
                }
            });
        });

        localStorage.setItem(pageKey, JSON.stringify(changes));
        console.log('Changes saved:', changes);
    }

    // Load saved changes
    function loadSavedChanges() {
        const pageKey = 'wix-changes-' + window.location.pathname;
        const savedChanges = localStorage.getItem(pageKey);

        if (!savedChanges) return;

        try {
            const changes = JSON.parse(savedChanges);

            // Restore modified elements
            if (changes.modified) {
                changes.modified.forEach(change => {
                    const element = document.querySelector(`[data-wix-id="${change.id}"]`);
                    if (element) {
                        element.innerHTML = change.html;
                        if (change.styles) {
                            element.setAttribute('style', change.styles);
                        }
                    }
                });
            }

            // Restore added elements
            if (changes.added) {
                changes.added.forEach(change => {
                    const element = document.createElement(change.tagName.toLowerCase());
                    element.className = change.className;
                    element.setAttribute('data-wix-id', change.id);
                    element.innerHTML = change.html;

                    if (change.styles) {
                        element.setAttribute('style', change.styles);
                    }

                    // Restore attributes
                    if (change.attributes) {
                        Object.entries(change.attributes).forEach(([attr, value]) => {
                            if (value) element.setAttribute(attr, value);
                        });
                    }

                    document.body.appendChild(element);

                    // Make text elements editable
                    if (element.classList.contains('wix-text-element')) {
                        element.addEventListener('dblclick', (e) => {
                            e.stopPropagation();
                            makeTextEditable(element);
                        });
                    }
                });
            }

            console.log('Loaded saved changes:', changes);
        } catch (error) {
            console.error('Error loading saved changes:', error);
        }
    }

    // Reset all changes
    function resetChanges() {
        const confirmed = confirm('Reset ALL changes? This cannot be undone!');
        if (!confirmed) return;

        const pageKey = 'wix-changes-' + window.location.pathname;
        localStorage.removeItem(pageKey);

        // Remove all wix elements
        document.querySelectorAll('.wix-element').forEach(el => el.remove());

        showNotification('All changes reset. Reloading...');
        setTimeout(() => window.location.reload(), 1000);
    }

    // Exit Wix mode
    function exitWixMode() {
        localStorage.setItem('wix-mode-enabled', 'false');
        window.location.reload();
    }

    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2C1E1A;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    // Public API
    window.WixMode = {
        init: initWixMode,
        addTextElement,
        addShapeElement,
        addImageElement,
        deleteSelected,
        saveChanges,
        resetChanges,
        exitWixMode,
        isEnabled: isWixModeEnabled
    };

    // Auto-initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWixMode);
    } else {
        initWixMode();
    }

})();
