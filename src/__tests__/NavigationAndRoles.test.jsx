import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockBackend, testDriver, testShelter } from '../test/liveApiFixtures';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AppProvider } from '../context/AppContext';
import { LanguageProvider } from '../context/LanguageContext';
import { ThemeProvider } from '../context/ThemeContext';

function renderAppAtRoute(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <LanguageProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('Role Navigation and Route Handling', () => {
  beforeEach(() => {
    localStorage.clear();
    mockBackend();
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows the public home page with food request and account links', () => {
    renderAppAtRoute('/');
    expect(screen.getByRole('heading', { name: /A clearer path from extra food/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open the food request form/i })).toHaveAttribute('href', '/request-food');
    expect(screen.getByRole('link', { name: /Join as a donor, shelter or driver/i })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: /^Sign in$/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Track request/i })).toHaveAttribute('href', '/track-request');
  });

  it('shows public tracking form without a login', () => {
    renderAppAtRoute('/track-request');
    expect(screen.getByRole('heading', { name: /Track your food request/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check status/i })).toBeInTheDocument();
  });

  it('requires registered credentials to sign in and rejects unregistered account', async () => {
    renderAppAtRoute('/login');

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByTestId('login-submit-btn');

    await userEvent.type(emailInput, 'unregistered@test.org');
    await userEvent.type(passwordInput, 'wrongpassword');
    await userEvent.click(submitBtn);

    expect(await screen.findByText(/Invalid email or password/i)).toBeInTheDocument();
  });

  it('allows authenticated registered driver to access driver portal', async () => {
    const driverUser = testDriver;
    mockBackend({ user: driverUser });
    localStorage.setItem('rescueroute_user', JSON.stringify(driverUser));
    localStorage.setItem('rescueroute_token', 'valid-jwt-token');

    renderAppAtRoute('/driver');
    expect(await screen.findByText(/Volunteer Dispatch:/i)).toBeInTheDocument();
  });

  it('allows authenticated registered shelter to access shelter portal', async () => {
    const shelterUser = testShelter;
    mockBackend({ user: shelterUser });
    localStorage.setItem('rescueroute_user', JSON.stringify(shelterUser));
    localStorage.setItem('rescueroute_token', 'valid-jwt-token');

    renderAppAtRoute('/shelter');
    expect(await screen.findByText(/Real-Time Shelter Capacity/i)).toBeInTheDocument();
  });

  it('renders 404 fallback page on non-existent route', () => {
    renderAppAtRoute('/unknown-nonexistent-route');
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('blocks unauthenticated access to /donor and redirects to /login with notification', () => {
    renderAppAtRoute('/donor');
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
    expect(screen.getByText(/Authentication required/i)).toBeInTheDocument();
  });

  it('blocks unauthenticated direct access to /driver', () => {
    renderAppAtRoute('/driver');
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
  });

  it('blocks unauthenticated direct access to /shelter', () => {
    renderAppAtRoute('/shelter');
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
  });

  it('renders theme options on the login page and switches between light and dark modes', async () => {
    renderAppAtRoute('/login');

    const darkBtn = screen.getByTestId('login-theme-dark-btn');
    const lightBtn = screen.getByTestId('login-theme-light-btn');
    const footerToggleBtn = screen.getByTestId('login-theme-toggle-btn');

    expect(darkBtn).toBeInTheDocument();
    expect(lightBtn).toBeInTheDocument();
    expect(footerToggleBtn).toBeInTheDocument();

    // Switch to dark mode
    await userEvent.click(darkBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('rr_theme')).toBe('dark');

    // Switch to light mode
    await userEvent.click(lightBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('rr_theme')).toBe('light');

    // Toggle via footer button
    await userEvent.click(footerToggleBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('rr_theme')).toBe('dark');
  });
});
