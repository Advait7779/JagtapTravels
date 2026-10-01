import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ToursWebsite from '../website/ToursWebsite';
import VehicleCollagePattern from '../website/components/VehicleCollagePattern';

afterEach(() => {
  vi.restoreAllMocks();
  window.location.hash = '';
});

describe('ToursWebsite Multi-Page Architecture', () => {
  it('renders strictly the 4 header sections in navigation', () => {
    const { container } = render(<ToursWebsite onOpenAdmin={vi.fn()} />);

    // Verify exactly 4 main navigation links exist in the desktop nav
    const headerNav = container.querySelector('header nav div.hidden.md\\:flex');
    expect(headerNav).not.toBeNull();
    const navAnchors = headerNav.querySelectorAll('a');
    expect(navAnchors.length).toBe(4);
    const navLabels = Array.from(navAnchors).map((a) => a.textContent.trim());
    expect(navLabels).toEqual(['Home', 'Tour Packages', 'Why Us', 'Contact']);
  });

  it('navigates between all 4 pages via header clicks', async () => {
    const { container } = render(<ToursWebsite onOpenAdmin={vi.fn()} />);

    // Initially on Home page
    expect(container.textContent).toContain('Our Travel Fleet in Maharashtra');

    // 1. Navigate to Tour Packages
    const packagesLink = screen.getAllByRole('link', { name: /^Tour Packages$/i })[0];
    fireEvent.click(packagesLink);
    await waitFor(() => {
      expect(container.textContent).toContain('Tour Packages Across Maharashtra');
    });

    // 2. Navigate to Why Us
    const whyUsLink = screen.getAllByRole('link', { name: /^Why Us$/i })[0];
    fireEvent.click(whyUsLink);
    await waitFor(() => {
      expect(container.textContent).toContain('Why Choose Jagtap Travels');
    });

    // 3. Navigate to Contact
    const contactLink = screen.getAllByRole('link', { name: /^Contact$/i })[0];
    fireEvent.click(contactLink);
    await waitFor(() => {
      expect(container.textContent).toContain('Contact & 24/7 Booking Desk');
    });

    // 4. Navigate back to Home
    const homeLink = screen.getAllByRole('link', { name: /^Home$/i })[0];
    fireEvent.click(homeLink);
    await waitFor(() => {
      expect(container.textContent).toContain('Our Travel Fleet in Maharashtra');
    });
  });

  it('VehicleCollagePattern switches between vehicles and shows specs', () => {
    const { container } = render(<VehicleCollagePattern />);

    // Default vehicle is Maruti Suzuki Ertiga
    expect(container.textContent).toContain('Maruti Suzuki Ertiga');
    expect(container.textContent).toContain('6 - 7 Seater');

    // Switch to Innova Crysta
    const innovaBtn = screen.getByRole('button', { name: /Innova Crysta/i });
    fireEvent.click(innovaBtn);
    expect(container.textContent).toContain('Toyota Innova Crysta');
    expect(container.textContent).toContain('6 - 7 Seater');

    // Switch to Sedan
    const sedanBtn = screen.getByRole('button', { name: /Dzire Sedan/i });
    fireEvent.click(sedanBtn);
    expect(container.textContent).toContain('Maruti Suzuki Dzire');
    expect(container.textContent).toContain('4 Seater');
  });
});
