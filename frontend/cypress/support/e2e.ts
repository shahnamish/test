import './commands';

Cypress.on('uncaught:exception', (err) => {
  // Prevent Cypress from failing tests due to unrelated errors
  console.error('Uncaught exception', err);
  return false;
});
