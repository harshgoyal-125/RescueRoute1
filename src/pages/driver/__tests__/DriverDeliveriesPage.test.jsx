import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockBackend, testDriver, testDelivery } from '../../../test/liveApiFixtures';
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

beforeEach(() => { localStorage.setItem('rescueroute_token', 'test-token'); mockBackend({ user: testDriver, deliveries: [testDelivery] }); });
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe('DriverDeliveriesPage', () => {
  it('renders page header, search bar, and filter buttons', () => {
    renderWithProviders(<DriverDeliveriesPage />);

    expect(screen.getByText(/Delivery Route History/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search pickups, shelters, or food.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^ALL$/i })).toBeInTheDocument();
  });

  it('filters deliveries by status button selection', async () => {
    renderWithProviders(<DriverDeliveriesPage />);

    await screen.findByText('Test Donor');
    const deliveredFilterBtn = screen.getByRole('button', { name: /^DELIVERED$/i });
    await userEvent.click(deliveredFilterBtn);

    // The only mocked delivery is active, so the delivered filter shows no rows.
    expect(await screen.findByText(/No deliveries match criteria/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^DELIVERED$/i })).toBeInTheDocument();
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
