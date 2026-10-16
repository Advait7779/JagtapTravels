import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TyreModal from '../components/expenses/TyreModal';
import TyreManagementHub from '../components/expenses/TyreManagementHub';
import { localDate } from '../utils/formatters';

const vehicle = { id: 'vehicle-1', vehicleNumber: 'MH 12 AB 1234', name: 'Innova Crysta' };
const tyre = {
  id: 'tyre-1', tyreNumber: 'TYRE-2026-001', vehicleId: vehicle.id,
  vehicleNumber: vehicle.vehicleNumber, date: localDate(), tyreBrand: 'MRF',
  tyrePosition: 'All 4 Tyres', quantity: 4, costPerTyre: 25000,
  totalCost: 100000, amountPaid: 50000, odometerAtChange: 50000,
};

describe('tyre payment amount', () => {
  it('updates cumulative paid amount on the existing tyre record', async () => {
    const onSave = vi.fn().mockResolvedValue({});
    render(<TyreModal isOpen onClose={vi.fn()} onSave={onSave}
      tyreLogToEdit={tyre} vehicles={[vehicle]} />);

    expect(screen.getByText('₹50,000.00')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Paid (₹)'), {
      target: { value: '75000' },
    });
    expect(screen.getByText('₹25,000.00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Update Tyre Log' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0][0].amountPaid).toBe(75000);
    expect(onSave.mock.calls[0][1]).toBe(tyre.id);
  });

  it('does not guess the payment balance for older records', () => {
    const { amountPaid, ...olderTyre } = tyre;
    render(<TyreManagementHub tyreLogs={[olderTyre]} vehicles={[vehicle]}
      onAddTyreLog={vi.fn()} onEditTyreLog={vi.fn()} onDeleteTyreLog={vi.fn()} />);
    expect(screen.getByText('Paid: Not set')).toBeTruthy();
    expect(screen.getByText('Remaining: Not set')).toBeTruthy();
  });
});
