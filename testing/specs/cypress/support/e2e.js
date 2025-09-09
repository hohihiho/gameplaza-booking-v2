// Cypress support file
// This file is processed and loaded automatically before your test files.

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log for better readability
// Cypress.Commands.add('hideRequestsFromLog', () => {
//   const app = window.top;
//   if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
//     const style = app.document.createElement('style');
//     style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
//     style.setAttribute('data-hide-command-log-request', '');
//     app.document.head.appendChild(style);
//   }
// });

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on uncaught exceptions
  // that are not related to the test itself
  return false;
});

// Console log filter
Cypress.on('window:before:load', (win) => {
  // Suppress console errors that are not relevant to testing
  const originalError = win.console.error;
  win.console.error = (...args) => {
    const errorMessage = args.join(' ');
    
    // Suppress common Next.js hydration warnings
    if (errorMessage.includes('Warning: Text content did not match') ||
        errorMessage.includes('Warning: Expected server HTML to contain') ||
        errorMessage.includes('hydration failed')) {
      return;
    }
    
    originalError.apply(win.console, args);
  };
});