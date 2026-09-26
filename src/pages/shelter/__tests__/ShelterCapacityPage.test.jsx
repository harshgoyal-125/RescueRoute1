import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ShelterCapacityPage from '../ShelterCapacityPage';
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

describe('ShelterCapacityPage', () => {
  it('allows updating capacity numbers and saves to state', async () => {
    renderWithProviders(<ShelterCapacityPage />);

    const currentCapInput = screen.getByLabelText(/Current Filled Capacity/i);
    expect(currentCapInput).toBeInTheDocument();

    await userEvent.clear(currentCapInput);
    await userEvent.type(currentCapInput, '80');

    const saveBtn = screen.getByTestId('save-capacity-btn');
    await userEvent.click(saveBtn);

    expect(await screen.findByTestId('capacity-save-success')).toBeInTheDocument();
  });

  it('validates that current capacity cannot exceed max capacity', async () => {
    renderWithProviders(<ShelterCapacityPage />);

    const currentCapInput = screen.getByLabelText(/Current Filled Capacity/i);
    const maxCapInput = screen.getByLabelText(/Maximum Storage Capacity/i);

    await userEvent.clear(currentCapInput);
    await userEvent.type(currentCapInput, '150');

    await userEvent.clear(maxCapInput);
    await userEvent.type(maxCapInput, '100');

    const saveBtn = screen.getByTestId('save-capacity-btn');
    await userEvent.click(saveBtn);

    expect(await screen.findByText(/Current capacity cannot exceed maximum capacity/i)).toBeInTheDocument();
  });
});
