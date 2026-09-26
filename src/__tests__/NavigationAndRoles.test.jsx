import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
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
  });

  it('redirects from root / to /login and displays login screen with custom logo', () => {
    renderAppAtRoute('/');
    expect(screen.getByText(/Turn surplus food into someone's next meal/i)).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
    const logoImg = screen.getByAltText('RescueRoute Logo');
    expect(logoImg).toBeInTheDocument();
    expect(logoImg).toHaveAttribute('src');
    expect(logoImg.getAttribute('src')).toContain('logo');
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
    const driverUser = {
      id: 'real-driver-1',
      name: 'Registered Driver',
      email: 'driver@volunteer.org',
      role: 'DRIVER'
    };
    localStorage.setItem('rescueroute_user', JSON.stringify(driverUser));
    localStorage.setItem('rescueroute_token', 'valid-jwt-token');

    renderAppAtRoute('/driver');
    expect(await screen.findByText(/Volunteer Dispatch:/i)).toBeInTheDocument();
  });

  it('allows authenticated registered shelter to access shelter portal', async () => {
    const shelterUser = {
      id: 'real-shelter-1',
      name: 'Registered Shelter',
      email: 'shelter@charity.org',
      role: 'SHELTER'
    };
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
