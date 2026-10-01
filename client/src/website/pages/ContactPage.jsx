import React from 'react';
import PageHeader from '../components/PageHeader';
import ContactSection from '../ContactSection';

export default function ContactPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHeader
        title="Contact & 24/7 Booking Desk"
        subtitle="Reserve outstation cabs, luxury Force Urbanias, and tourist buses or speak directly with our senior reservation desk in Bhekrai Nagar, Pune."
        breadcrumb="Contact & 24/7 Desk"
        badge="24 Hours / 7 Days Active"
        onNavigateHome={() => onNavigate('home')}
      />

      {/* Main Reservation Desk & Office Info Component */}
      <ContactSection />
    </div>
  );
}
