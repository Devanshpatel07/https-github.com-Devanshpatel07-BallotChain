import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../App';
import { sorobanSimulator } from '../lib/sorobanSim';

describe('Stellar Soroban Voting Portal Frontend Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sorobanSimulator.resetAll();
    sorobanSimulator.disconnectWallet();
  });

  test('should render the main dashboard layouts and default text', () => {
    render(<App />);
    expect(screen.getByText('Stellar Soroban Voting Portal')).toBeInTheDocument();
    expect(screen.getByText('Election Ballot Box')).toBeInTheDocument();
    expect(screen.getByText('Stellar Wallet Disconnected')).toBeInTheDocument();
  });

  test('should successfully connect simulated wallet and update connection state', async () => {
    render(<App />);
    
    // Open connect wallet modal
    const connectBtn = screen.getByText('Connect Wallet');
    fireEvent.click(connectBtn);

    // Click Sandbox option to connect mock keypair
    const sandboxTxt = screen.getByText('Simulated Sandbox Vault (Recommended)');
    fireEvent.click(sandboxTxt);

    // Wait until wallet is connected and modal closes
    await waitFor(() => {
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    // Verify it is a simulated wallet and Alice is connected by default
    expect(screen.getByText('simulated')).toBeInTheDocument();
    expect(screen.getByText(/GDALICE/i)).toBeInTheDocument();
    expect(screen.getByText('Stellar Testnet Balance')).toBeInTheDocument();
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
    const sandboxTxt = screen.getByText('Simulated Sandbox Vault (Recommended)');
    fireEvent.click(sandboxTxt);

    await waitFor(() => {
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    // Check that button is disabled
    const firstVoteBtn = screen.getAllByText(/Voting window is not active/i)[0];
    expect(firstVoteBtn).toBeDisabled();
  });
});
