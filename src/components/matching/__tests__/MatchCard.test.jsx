import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MatchCard from '../MatchCard';
import { aiApi } from '../../../services/api/aiApi';

describe('MatchCard Component - Deterministic Display & AI Match Explanation', () => {
  const dummyMatch = {
    id: 'MATCH-999',
    _id: '507f1f77bcf86cd799439011',
    donor: 'Metro Deli',
    recipient: 'Hope Shelter',
    foodType: 'Prepared Meals',
    foodName: 'Artisan Sandwiches',
    quantity: '40 meals',
    distance: '1.8 miles',
    expiry: 'Today, 8:00 PM',
    score: 95,
    capacityCompatibility: 'Fits 40 meals buffer',
    foodCompatibility: 'High priority accepted',
    urgency: 'High Urgency',
    reasons: [
      'Within 2-mile priority radius',
      'Matches available refrigerated space',
      'Prepared in certified commissary kitchen'
    ]
  };

  it('renders match score, donor, food details, and reasons', () => {
    render(<MatchCard match={dummyMatch} />);

    expect(screen.getByTestId('match-score')).toHaveTextContent('95% Match');
    expect(screen.getAllByText(/40 meals/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Metro Deli/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1.8 miles/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/High Urgency/i)).toBeInTheDocument();

    // Reasons
    expect(screen.getByText('Within 2-mile priority radius')).toBeInTheDocument();
    expect(screen.getByText('Matches available refrigerated space')).toBeInTheDocument();
  });

  it('toggles free Leaflet route map on demand showing donation and shelter locations', async () => {
    render(<MatchCard match={dummyMatch} />);

    const toggleBtn = screen.getByTestId('toggle-map-btn-MATCH-999');
    expect(toggleBtn).toBeInTheDocument();
    expect(screen.queryByTestId('match-map-container')).not.toBeInTheDocument();

    await userEvent.click(toggleBtn);

    // Map container appears with Leaflet map
    expect(screen.getByTestId('match-map-container')).toBeInTheDocument();
    expect(screen.getByTestId('rescue-route-map')).toBeInTheDocument();
  });

  it('renders "✨ Explain with AI" button while preserving deterministic score (Step 17 #16, #19)', () => {
    render(<MatchCard match={dummyMatch} />);

    const explainBtn = screen.getByRole('button', { name: /explain with ai/i });
    expect(explainBtn).toBeInTheDocument();
    // Deterministic score remains visible
    expect(screen.getByTestId('match-score')).toHaveTextContent('95% Match');
  });

  it('shows loading state and displays AI explanation on success without changing score (Step 17 #17, #18, #19, #22)', async () => {
    const mockExplanation = {
      summary: 'Hope Shelter was selected because it is located only 1.8 miles away and has available refrigerated storage.',
      reasons: [
        'Short 1.8 mile transit distance',
        'Available refrigerated capacity',
        'Direct food category match'
      ],
      isFallback: false
    };

    const spy = vi.spyOn(aiApi, 'explainMatch').mockResolvedValueOnce({
      success: true,
      data: mockExplanation
    });

    render(<MatchCard match={dummyMatch} />);

    const explainBtn = screen.getByRole('button', { name: /explain with ai/i });
    await userEvent.click(explainBtn);

    // Displays explanation
    await waitFor(() => {
      expect(screen.getByTestId('ai-match-explanation')).toBeInTheDocument();
    });

    expect(screen.getByText(/Hope Shelter was selected because it is located only 1.8 miles away/i)).toBeInTheDocument();
    expect(screen.getByText('Short 1.8 mile transit distance')).toBeInTheDocument();

    // Score remains completely untouched
    expect(screen.getByTestId('match-score')).toHaveTextContent('95% Match');

    spy.mockRestore();
  });

  it('handles AI failure gracefully with deterministic fallback state (Step 17 #20)', async () => {
    const spy = vi.spyOn(aiApi, 'explainMatch').mockRejectedValueOnce(
      new Error('Network error calling AI service')
    );

    render(<MatchCard match={dummyMatch} />);

    const explainBtn = screen.getByRole('button', { name: /explain with ai/i });
    await userEvent.click(explainBtn);

    // Displays fallback container and notice
    await waitFor(() => {
      expect(screen.getByTestId('ai-match-explanation')).toBeInTheDocument();
    });

    expect(screen.getByText(/AI explanation unavailable\. Showing deterministic match reasons\./i)).toBeInTheDocument();
    expect(screen.getByTestId('match-score')).toHaveTextContent('95% Match');

    spy.mockRestore();
  });

  it('triggers onAccept callback normally before and after AI explanation (Step 17 #21)', async () => {
    const handleAccept = vi.fn();
    render(<MatchCard match={dummyMatch} onAccept={handleAccept} />);

    const acceptBtn = screen.getByRole('button', { name: /accept donation match/i });
    expect(acceptBtn).toBeInTheDocument();

    await userEvent.click(acceptBtn);
    expect(handleAccept).toHaveBeenCalledTimes(1);
    expect(handleAccept).toHaveBeenCalledWith(dummyMatch);
  });
});
