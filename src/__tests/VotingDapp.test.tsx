import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { sorobanSimulator } from '../lib/sorobanSim';

describe('Stellar Soroban Voting Portal Frontend Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sorobanSimulator.resetAll();
    sorobanSimulator.disconnectWallet();

    // Mock global fetch to respond instantly with simulated ledger/account data during tests
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/accounts/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            balances: [
              { asset_type: 'native', balance: '450.75' }
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          _embedded: { records: [] }
        })
      });
    }) as any;

    // Mock window.freighterApi for direct wallet connection flow
    (window as any).freighterApi = {
      requestAccess: () => Promise.resolve({
        address: "GDALICE" + "A".repeat(49) + "ALICE"
      })
    };
  });

  test('should render the main dashboard layouts and default text', () => {
    render(<App />);
    expect(screen.getByText('Stellar Soroban Voting Portal')).toBeInTheDocument();
    expect(screen.getByText('Election Ballot Box')).toBeInTheDocument();
    expect(screen.getByText('Stellar Wallet Disconnected')).toBeInTheDocument();
  });

  test('should successfully connect simulated wallet and update connection state', async () => {
    render(<App />);
    
    // Click Connect Wallet to trigger direct mocked connection
    const connectBtn = screen.getByText('Connect Wallet');
    fireEvent.click(connectBtn);

    // Wait until wallet is connected and UI updates
    await waitFor(() => {
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    // Verify it is a freighter wallet and Alice is connected
    expect(screen.getByText(/freighter/i)).toBeInTheDocument();
    expect(screen.getByText(/GDALICE/i)).toBeInTheDocument();
    expect(screen.getByText(/Stellar Testnet Balance/i)).toBeInTheDocument();
  });

  test('should show correct voting callout message when time clock changes', async () => {
    // Set time warp offset to 10 hours from now to expire the poll
    // Default poll expires in 2 hours
    const tenHoursMs = 10 * 60 * 60 * 1000;
    sorobanSimulator.setTimeWarpOffset(tenHoursMs);

    render(<App />);

    // Check callout message updating to expired election notice
    expect(screen.getByText(/This election has ended./i)).toBeInTheDocument();
  });

  test('should prevent vote submission and disable buttons outside of voting intervals', async () => {
    // Warp time past end of voting interval
    const tenHoursMs = 10 * 60 * 60 * 1000;
    sorobanSimulator.setTimeWarpOffset(tenHoursMs);

    render(<App />);

    // Connect wallet
    const connectBtn = screen.getByText('Connect Wallet');
    fireEvent.click(connectBtn);

    await waitFor(() => {
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    // Check that button is disabled
    const firstVoteBtn = screen.getAllByText(/Voting window is not active/i)[0];
    expect(firstVoteBtn).toBeDisabled();
  });
});
