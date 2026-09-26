import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CreateDonationPage from '../CreateDonationPage';
import { AppProvider } from '../../../context/AppContext';

function renderWithProviders(ui) {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        {ui}
      </AppProvider>
    </BrowserRouter>
  );
}

describe('CreateDonationPage - Form & Creation Workflow', () => {
  it('validates required fields and shows inline error messages', async () => {
    renderWithProviders(<CreateDonationPage />);

    // Click submit without entering food name
    const submitBtn = screen.getByTestId('submit-donation-btn');
    await userEvent.click(submitBtn);

    expect(screen.getByText(/Food title or name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity is required/i)).toBeInTheDocument();
  });

  it('renders dietary classification selectors and allows selection', async () => {
    renderWithProviders(<CreateDonationPage />);

    const vegBtn = screen.getByTestId('diet-btn-vegetarian');
    const eggBtn = screen.getByTestId('diet-btn-eggetarian');
    const nonVegBtn = screen.getByTestId('diet-btn-non-vegetarian');
    const veganBtn = screen.getByTestId('diet-btn-vegan');

    expect(vegBtn).toBeInTheDocument();
    expect(eggBtn).toBeInTheDocument();
    expect(nonVegBtn).toBeInTheDocument();
    expect(veganBtn).toBeInTheDocument();

    // Select Non-Vegetarian
    await userEvent.click(nonVegBtn);
    expect(nonVegBtn).toHaveStyle({ fontWeight: '600' });
  });

  it('successfully creates donation and displays confirmation view with dietary badge', async () => {
    renderWithProviders(<CreateDonationPage />);

    // Select Vegetarian
    const vegBtn = screen.getByTestId('diet-btn-vegetarian');
    await userEvent.click(vegBtn);

    // Fill form fields
    const foodNameInput = screen.getByLabelText(/Food Item \/ Title/i);
    await userEvent.type(foodNameInput, 'Hearty Vegetable Stew');

    const quantityInput = screen.getByLabelText(/Quantity Amount/i);
    await userEvent.type(quantityInput, '35');

    const locationInput = screen.getByLabelText(/Pickup Location/i);
    await userEvent.clear(locationInput);
    await userEvent.type(locationInput, '77 Market St Kitchen');

    const expiryInput = screen.getByLabelText(/Available Until/i);
    await userEvent.type(expiryInput, '2026-09-24T20:00');

    const descInput = screen.getByLabelText(/Food Description/i);
    await userEvent.type(descInput, 'Thermal insulated containers, kept at 145F.');

    const contactInput = screen.getByLabelText(/Dispatch Contact/i);
    await userEvent.clear(contactInput);
    await userEvent.type(contactInput, 'Chef Dan (555) 345-6789');

    // Submit
    const submitBtn = screen.getByTestId('submit-donation-btn');
    await userEvent.click(submitBtn);

    // Assert confirmation
    const successMsg = await screen.findByTestId('donation-success-message', {}, { timeout: 4000 });
    expect(successMsg).toBeInTheDocument();
    expect(await screen.findByText(/Donation Posted Successfully!/i)).toBeInTheDocument();
    expect(screen.getByText(/Hearty Vegetable Stew/i)).toBeInTheDocument();
    expect(screen.getByTestId('dietary-badge')).toHaveTextContent(/Vegetarian/i);
  });
});
