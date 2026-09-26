import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Component', () => {
  const statuses = [
    { input: 'POSTED', text: 'Posted', classSuffix: 'posted' },
    { input: 'MATCHED', text: 'Matched', classSuffix: 'matched' },
    { input: 'DRIVER ASSIGNED', text: 'Driver Assigned', classSuffix: 'driver-assigned' },
    { input: 'PICKED UP', text: 'Picked Up', classSuffix: 'picked-up' },
    { input: 'DELIVERED', text: 'Delivered', classSuffix: 'delivered' },
    { input: 'CANCELLED', text: 'Cancelled', classSuffix: 'cancelled' }
  ];

  statuses.forEach(({ input, text, classSuffix }) => {
    it(`renders correctly for status: "${input}"`, () => {
      render(<StatusBadge status={input} />);
      const badge = screen.getByTestId('status-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent(text);
      expect(badge.className).toContain(`status-${classSuffix}`);
      expect(badge).toHaveAttribute('data-status', input);
    });
  });

  it('handles lowercase status gracefully', () => {
    render(<StatusBadge status="delivered" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Delivered');
    expect(badge.className).toContain('status-delivered');
  });

  it('handles unknown or empty status with fallback', () => {
    render(<StatusBadge status="" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Posted');
  });
});
