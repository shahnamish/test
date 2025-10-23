describe('Authentication Flows', () => {
  const user = {
    email: 'mfa-user@example.com',
    password: 'SecurePass!123',
  };

  beforeEach(() => {
    cy.window().then((win) => {
      win.sessionStorage.clear();
      win.localStorage.clear();
    });
  });

  it('allows a user to sign up, complete MFA, and access the dashboard', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type(user.email);
    cy.get('input[name="password"]').type(user.password);
    cy.get('input[name="confirmPassword"]').type(user.password);
    cy.get('button[type="submit"]').click();

    cy.contains(/multi-factor authentication/i).should('be.visible');
    cy.get('input[name="code"]').type('123456');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/');
    cy.contains(/welcome/i).should('be.visible');
  });

  it('allows an existing user to login with MFA later', () => {
    // First sign up the user
    cy.visit('/signup');
    cy.get('input[name="email"]').type(user.email);
    cy.get('input[name="password"]').type(user.password);
    cy.get('input[name="confirmPassword"]').type(user.password);
    cy.get('button[type="submit"]').click();
    cy.get('input[name="code"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.contains(/welcome/i).should('be.visible');
    cy.contains(/sign out/i).click();

    // Attempt to login again
    cy.visit('/login');
    cy.get('input[name="email"]').type(user.email);
    cy.get('input[name="password"]').type(user.password);
    cy.get('button[type="submit"]').click();

    cy.contains(/multi-factor authentication/i).should('be.visible');
    cy.get('input[name="code"]').type('123456');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/');
    cy.contains(/account overview/i).should('be.visible');
  });
});
