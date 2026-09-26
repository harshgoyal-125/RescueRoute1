import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockBackend, testDriver, testDelivery } from '../../../test/liveApiFixtures';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DriverDashboardPage from '../DriverDashboardPage';
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

describe('DriverDashboardPage', () => {
  it('renders active delivery route card and details', async () => {
    renderWithProviders(<DriverDashboardPage />);

    expect(await screen.findByTestId('active-delivery-card')).toBeInTheDocument();
    expect(screen.getByText(/Current Active Rescue Route/i)).toBeInTheDocument();
    expect(screen.getByText(/1. Pickup Origin/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Shelter Destination/i)).toBeInTheDocument();
    expect(screen.getByTestId('driver-route-map-container')).toBeInTheDocument();
    expect(screen.getByTestId('rescue-route-map')).toBeInTheDocument();
  });

  it('updates delivery status dynamically when Mark Picked Up and Mark Delivered are clicked', async () => {
    renderWithProviders(<DriverDashboardPage />);

    // Initially active delivery DEL-301 is 'DRIVER ASSIGNED'
    const markPickedUpBtn = await screen.findByTestId('mark-picked-up-btn');
    expect(markPickedUpBtn).toBeInTheDocument();

    await userEvent.click(markPickedUpBtn);

    // After picking up DEL-301, button changes to 'Mark Delivered' and status badge is 'Picked Up'
    const markDeliveredBtn = await screen.findByTestId('mark-delivered-btn');
    expect(markDeliveredBtn).toBeInTheDocument();
    expect(screen.getByText('Picked Up')).toBeInTheDocument();

    await userEvent.click(markDeliveredBtn);

    // A completed delivery no longer appears as an active route.
    expect(await screen.findByText(/All assigned pickups completed/i)).toBeInTheDocument();
  });

  it('opens and closes delivery details modal', async () => {
    renderWithProviders(<DriverDashboardPage />);

    const viewBtn = await screen.findByTestId('view-delivery-btn');
    await userEvent.click(viewBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Delivery Details —/i)).toBeInTheDocument();

    const closeBtn = screen.getAllByRole('button', { name: /close/i })[0];
    await userEvent.click(closeBtn);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
