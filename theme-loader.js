// Theme Loader - Applies saved theme from localStorage
(function() {
    const colors = [
        'bg-cream',
        'white',
        'sage-green',
        'terracotta',
        'ocean-blue',
        'light-blue',
        'text-dark',
        'text-light'
    ];

    // Load and apply theme colors from localStorage
    colors.forEach(colorKey => {
        const savedColor = localStorage.getItem(`theme-${colorKey}`);
        if (savedColor) {
            document.documentElement.style.setProperty(`--${colorKey}`, savedColor);
        }
    });
})();
