/**
 * Development script to suppress DevTools warnings
 * Injects into console to filter out known harmless warnings
 */

// Suppress common DevTools warnings that are harmless
const originalConsoleWarn = console.warn;
console.warn = function(...args) {
    const message = args.join(' ');
    
    // Filter out known harmless warnings
    if (
        message.includes('Autofill.enable') ||
        message.includes('Autofill.setAddresses') ||
        message.includes('Request Autofill') ||
        message.includes("wasn't found")
    ) {
        return; // Suppress these warnings
    }
    
    // Let other warnings through
    originalConsoleWarn.apply(console, args);
};

console.log('🔇 DevTools warning suppression active');