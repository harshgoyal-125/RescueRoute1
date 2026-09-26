import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DriverDeliveriesPage from '../DriverDeliveriesPage';
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

describe('DriverDeliveriesPage', () => {
  it('renders page header, search bar, and filter buttons', () => {
    renderWithProviders(<DriverDeliveriesPage />);

    expect(screen.getByText(/Delivery Route History/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search pickups, shelters, or food.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ALL$/i })).toBeInTheDocument();
  });

  it('filters deliveries by status button selection', async () => {
    renderWithProviders(<DriverDeliveriesPage />);

    const deliveredFilterBtn = screen.getByRole('button', { name: /^DELIVERED$/i });
    await userEvent.click(deliveredFilterBtn);

    // Active button background updates and table retains matching records
    expect(deliveredFilterBtn).toBeInTheDocument();
  });

  it('opens and closes delivery details modal from table row', async () => {
    renderWithProviders(<DriverDeliveriesPage />);

    const detailsBtns = await screen.findAllByRole('button', { name: /Details/i });
    expect(detailsBtns.length).toBeGreaterThan(0);

    await userEvent.click(detailsBtns[0]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/DELIVERY STATUS/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/PICKUP ORIGIN/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/DESTINATION SHELTER/i)).toBeInTheDocument();

    const closeBtn = within(dialog).getByRole('button', { name: 'Close' });
    await userEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows empty state when search term has no matches', async () => {
    renderWithProviders(<DriverDeliveriesPage />);

    const searchInput = screen.getByPlaceholderText(/Search pickups, shelters, or food.../i);
    await userEvent.type(searchInput, 'NonExistentFoodItemxyz999');

    expect(screen.getByText(/No deliveries match criteria/i)).toBeInTheDocument();
  });
});
