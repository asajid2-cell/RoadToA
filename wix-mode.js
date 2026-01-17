/**
 * Wix Mode - Visual Page Editor
 * Allows users to edit, move, delete, and add elements directly on the page
 */

(function() {
    'use strict';

    // Check if Wix mode is enabled
    const isWixModeEnabled = () => localStorage.getItem('wix-mode-enabled') === 'true';

    // State management
    let isDragging = false;
    let currentDragElement = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let selectedElement = null;

    // Initialize Wix mode if enabled
    function initWixMode() {
        if (!isWixModeEnabled()) return;

        // Load saved changes
        loadSavedChanges();

        // Add Wix mode UI
        addWixModeUI();

        // Make elements editable
        makeElementsEditable();

        // Add event listeners
        document.addEventListener('click', handleElementSelection);
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
                    💡 Click elements to select • Drag to move • Double-click text to edit • Delete key to remove
                </div>
            </div>
        `;
        document.body.appendChild(toolbar);
    }

    // Make elements editable
    function makeElementsEditable() {
        // Only target small, text-based elements - not large containers
        const editableSelectors = [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p',
            'button', '.btn-cta',
            'img:not(nav img):not(footer img)'
        ];

        editableSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                // Skip nav and footer for safety
                if (element.closest('nav') || element.closest('footer') ||
                    element.closest('#wix-toolbar') || element.classList.contains('wix-element')) {
                    return;
                }

                // Skip very large elements (width or height > 800px)
                const rect = element.getBoundingClientRect();
                if (rect.width > 800 || rect.height > 800) {
                    return;
                }

                // Add wix-editable class
                element.classList.add('wix-editable');

                // Add data attribute for identification
                if (!element.hasAttribute('data-wix-id')) {
                    element.setAttribute('data-wix-id', generateUniqueId());
                }

                // Make text editable on double-click
                if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON'].includes(element.tagName)) {
                    element.addEventListener('dblclick', (e) => {
                        e.stopPropagation();
                        makeTextEditable(element);
                    });
                }

                // Only make small elements draggable
                if (rect.width < 600 && rect.height < 400) {
                    makeDraggable(element);
                } else {
                    // Just make it selectable, not draggable
                    element.style.cursor = 'text';
                }
            });
        });
    }

    // Make element draggable
    function makeDraggable(element) {
        element.style.cursor = 'move';

        element.addEventListener('mousedown', function(e) {
            // Don't drag if clicking inside an input or textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' ||
                e.target.isContentEditable) {
                return;
            }

            e.preventDefault();
            isDragging = true;
            currentDragElement = element;

            // Calculate offset
            const rect = element.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;

            // Make position absolute if not already
            if (getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }

            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', handleDragEnd);
        });
    }

    // Handle drag
    function handleDrag(e) {
        if (!isDragging || !currentDragElement) return;

        e.preventDefault();

        // Get parent offset
        const parent = currentDragElement.offsetParent || document.body;
        const parentRect = parent.getBoundingClientRect();

        // Calculate new position
        let newLeft = e.clientX - parentRect.left - dragOffsetX;
        let newTop = e.clientY - parentRect.top - dragOffsetY;

        currentDragElement.style.position = 'absolute';
        currentDragElement.style.left = newLeft + 'px';
        currentDragElement.style.top = newTop + 'px';
        currentDragElement.style.zIndex = '9999';
    }

    // Handle drag end
    function handleDragEnd() {
        isDragging = false;
        currentDragElement = null;
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', handleDragEnd);
    }

    // Make text editable
    function makeTextEditable(element) {
        element.contentEditable = true;
        element.focus();

        // Select all text
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        // Make it non-draggable while editing
        element.style.cursor = 'text';

        // Handle blur
        const handleBlur = () => {
            element.contentEditable = false;
            element.style.cursor = 'move';
            element.removeEventListener('blur', handleBlur);
            saveChanges();
        };

        element.addEventListener('blur', handleBlur);
    }

    // Handle element selection
    function handleElementSelection(e) {
        const target = e.target;

        // Ignore toolbar clicks
        if (target.closest('#wix-toolbar')) return;

        // Only select if the target itself is editable (not a parent)
        // This prevents selecting large containers when clicking on child elements
        let editableElement = null;

        if (target.classList.contains('wix-editable') || target.classList.contains('wix-element')) {
            editableElement = target;
        } else {
            // If clicking on a child element, don't select anything
            // This prevents background/container selection
            return;
        }

        if (!editableElement) return;

        // Deselect previous
        if (selectedElement && selectedElement !== editableElement) {
            selectedElement.classList.remove('wix-selected');
        }

        // Select new element
        selectedElement = editableElement;
        selectedElement.classList.add('wix-selected');
    }

    // Handle keyboard shortcuts
    function handleKeyPress(e) {
        // Delete key
        if (e.key === 'Delete' && selectedElement) {
            e.preventDefault();
            deleteElement(selectedElement);
        }

        // Escape key - deselect
        if (e.key === 'Escape' && selectedElement) {
            selectedElement.classList.remove('wix-selected');
            selectedElement = null;
        }

        // Ctrl+S - save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveChanges();
            alert('Changes saved! ✅');
        }
    }

    // Add text element
    function addTextElement() {
        const textElement = document.createElement('div');
        textElement.className = 'wix-element wix-text-element';
        textElement.setAttribute('data-wix-id', generateUniqueId());
        textElement.contentEditable = true;
        textElement.textContent = 'Double-click to edit text';
        textElement.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            padding: 1rem;
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid #C06C4F;
            border-radius: 8px;
            min-width: 200px;
            cursor: move;
            z-index: 1000;
        `;

        document.body.appendChild(textElement);
        makeDraggable(textElement);

        // Select it
        selectedElement = textElement;
        textElement.classList.add('wix-selected');

        // Focus for editing
        textElement.focus();
    }

    // Add shape element
    function addShapeElement(shapeType) {
        const shapeElement = document.createElement('div');
        shapeElement.className = 'wix-element wix-shape-element';
        shapeElement.setAttribute('data-wix-id', generateUniqueId());
        shapeElement.setAttribute('data-shape-type', shapeType);

        const styles = {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '200px',
            height: '200px',
            cursor: 'move',
            zIndex: '1000'
        };

        if (shapeType === 'rectangle') {
            styles.background = 'linear-gradient(135deg, #8FAA8B 0%, #7BA58C 100%)';
            styles.borderRadius = '15px';
        } else if (shapeType === 'circle') {
            styles.background = 'linear-gradient(135deg, #D97555 0%, #C06C4F 100%)';
            styles.borderRadius = '50%';
        }

        Object.assign(shapeElement.style, styles);

        document.body.appendChild(shapeElement);
        makeDraggable(shapeElement);

        // Select it
        selectedElement = shapeElement;
        shapeElement.classList.add('wix-selected');
    }

    // Add image element
    function addImageElement() {
        const imageUrl = prompt('Enter image URL:');
        if (!imageUrl) return;

        const imgElement = document.createElement('img');
        imgElement.className = 'wix-element wix-image-element';
        imgElement.setAttribute('data-wix-id', generateUniqueId());
        imgElement.src = imageUrl;
        imgElement.alt = 'Custom image';
        imgElement.style.cssText = `
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            max-width: 300px;
            cursor: move;
            z-index: 1000;
            border: 2px solid #C06C4F;
            border-radius: 8px;
        `;

        document.body.appendChild(imgElement);
        makeDraggable(imgElement);

        // Select it
        selectedElement = imgElement;
        imgElement.classList.add('wix-selected');
    }

    // Delete element
    function deleteElement(element) {
        if (!element) return;

        const confirmed = confirm('Are you sure you want to delete this element?');
        if (!confirmed) return;

        element.remove();
        selectedElement = null;
        saveChanges();
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

        // Collect all changed elements
        const changes = {
            modified: [],
            added: []
        };

        // Save modified elements
        document.querySelectorAll('.wix-editable[data-wix-id]').forEach(element => {
            const id = element.getAttribute('data-wix-id');
            changes.modified.push({
                id: id,
                html: element.innerHTML,
                styles: element.getAttribute('style') || '',
                position: {
                    left: element.style.left,
                    top: element.style.top,
                    position: element.style.position
                }
            });
        });

        // Save added elements
        document.querySelectorAll('.wix-element').forEach(element => {
            const id = element.getAttribute('data-wix-id');
            changes.added.push({
                id: id,
                tagName: element.tagName,
                className: element.className,
                html: element.innerHTML,
                styles: element.getAttribute('style') || '',
                attributes: {
                    'data-shape-type': element.getAttribute('data-shape-type'),
                    src: element.getAttribute('src'),
                    alt: element.getAttribute('alt')
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
            changes.modified?.forEach(change => {
                const element = document.querySelector(`[data-wix-id="${change.id}"]`);
                if (element) {
                    element.innerHTML = change.html;
                    if (change.styles) {
                        element.setAttribute('style', change.styles);
                    }
                }
            });

            // Restore added elements
            changes.added?.forEach(change => {
                const element = document.createElement(change.tagName.toLowerCase());
                element.className = change.className;
                element.setAttribute('data-wix-id', change.id);
                element.innerHTML = change.html;
                if (change.styles) {
                    element.setAttribute('style', change.styles);
                }

                // Restore attributes
                if (change.attributes) {
                    Object.keys(change.attributes).forEach(attr => {
                        if (change.attributes[attr]) {
                            element.setAttribute(attr, change.attributes[attr]);
                        }
                    });
                }

                document.body.appendChild(element);
                makeDraggable(element);
            });

            console.log('Loaded saved changes:', changes);
        } catch (error) {
            console.error('Error loading saved changes:', error);
        }
    }

    // Reset all changes
    function resetChanges() {
        const confirmed = confirm('Are you sure you want to reset ALL changes? This cannot be undone!');
        if (!confirmed) return;

        const pageKey = 'wix-changes-' + window.location.pathname;
        localStorage.removeItem(pageKey);

        // Remove all wix elements
        document.querySelectorAll('.wix-element').forEach(el => el.remove());

        alert('All changes have been reset. Reloading page...');
        window.location.reload();
    }

    // Exit Wix mode
    function exitWixMode() {
        localStorage.setItem('wix-mode-enabled', 'false');
        window.location.reload();
    }

    // Public API
    window.WixMode = {
        init: initWixMode,
        addTextElement: addTextElement,
        addShapeElement: addShapeElement,
        addImageElement: addImageElement,
        deleteSelected: deleteSelected,
        saveChanges: saveChanges,
        resetChanges: resetChanges,
        exitWixMode: exitWixMode,
        isEnabled: isWixModeEnabled
    };

    // Auto-initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWixMode);
    } else {
        initWixMode();
    }

})();
