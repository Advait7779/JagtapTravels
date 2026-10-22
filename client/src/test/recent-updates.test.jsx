import React from 'react';
import { it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import QuotationModal from '../components/quotations/QuotationModal';
import QuotationPrintView, { quoteMessage } from '../components/quotations/QuotationPrintView';
import CorporateQuotationPrintView from '../components/corporate/CorporateQuotationPrintView';

it('shows the base fare as the tour quote total and lists extra charges', async () => {
  const { container } = render(<QuotationModal isOpen onClose={vi.fn()} onSave={vi.fn()} />);
  const fare = screen.getByText('Estimated Base Package Cost (₹)').parentElement.querySelector('input');
  fireEvent.change(fare, { target: { value: '100000' } });
  await waitFor(() => expect(screen.getByText('₹1,00,000.00')).toBeTruthy());
  expect(container.textContent).toContain('GST (18%) and Toll/Parking charges are charged extra');

  const quote = {
    quotationNumber: 'Q-1', customerName: 'Customer', tourTitle: 'Pune tour',
    vehicleType: 'Innova', durationDays: 2, pickupLocation: 'Pune',
    dropLocation: 'Mumbai', baseAmount: 100000, totalAmount: 100000,
    company: { companyName: 'Jagtap Tours and Travels', phone: '9011507220' },
  };
  const message = quoteMessage(quote, quote.company);
  expect(message).toContain('Greetings from Jagtap Travels!');
  expect(message).toContain('Total Estimate: ₹1,00,000.00');
  expect(message).toContain('TOLL & PARKING CHARGES EXTRA');
  expect(message).toContain('GST CHARGES EXTRA 18%');

  render(<QuotationPrintView quote={quote} onClose={vi.fn()} />);
  expect(screen.getByText('TOTAL ESTIMATE:')).toBeTruthy();
  expect(screen.getByText(/GST CHARGES EXTRA 18%/)).toBeTruthy();
});

it('shows the day and per-day columns with the new brand in a corporate quotation preview', () => {
  const quotation = {
    quotationNumber: 'CQ-1', revision: 1, quotationDate: '2026-10-16',
    companyName: 'Customer Co', contactPhone: '9876543210', pricingBasis: 'daily',
    proposedStartDate: '2026-10-20', taxMode: 'nongst', gstRate: 0,
    lineItems: [{ id: 'line-1', vehicleType: 'Innova', packageDays: 26,
      dailyBaseFare: 45000, includedDailyKm: 2500, extraRatePerKm: 14 }],
    fixedDailyTotal: 45000, estimatedExcessTotal: 0,
    estimatedOtherCharges: 0, estimatedTax: 0, estimatedTotal: 45000,
    company: { companyName: 'Jagtap Tours and Travels' }, revisions: [],
  };
  const { container } = render(<CorporateQuotationPrintView quotation={quotation}
    onClose={vi.fn()} />);
  expect(screen.getByRole('columnheader', { name: 'Per Day Package km' })).toBeTruthy();
  expect(screen.getByRole('columnheader', { name: 'Per Day Package Amount' })).toBeTruthy();
  expect(screen.getByRole('columnheader', { name: 'Days' })).toBeTruthy();
  expect(screen.getByRole('cell', { name: '26' })).toBeTruthy();
  expect(screen.queryByRole('columnheader', { name: /month/i })).toBeNull();
  expect(screen.getByText('1day charges')).toBeTruthy();
  expect(screen.getByText('TOTAL AMOUNT')).toBeTruthy();
  expect(screen.getByText('Date: 16 Oct 2026')).toBeTruthy();
  expect(container.textContent).toContain('Jagtap Travels');
  expect(container.textContent).not.toContain('Jagtap Tours and Travels');
});
