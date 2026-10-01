import React from 'react';
import PageHeader from '../components/PageHeader';
import { FileText, Car, ChatDots, UserCheck, Scales } from '@phosphor-icons/react';

export default function TermsPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHeader
        title="Terms and Conditions"
        subtitle="Terms governing your travel inquiries and service coordination with Jagtap Travels."
        breadcrumb="Terms & Conditions"
        badge="Service Terms"
        onNavigateHome={() => onNavigate('home')}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-md border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText size={20} weight="bold" className="text-red-700" />
              <span>1. Overview & Acceptance</span>
            </h2>
            <p>
              Welcome to Jagtap Travels. By accessing our website, browsing our travel itineraries, or submitting an inquiry form, you agree to comply with and be bound by these standard Terms and Conditions.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Car size={20} weight="bold" className="text-red-700" />
              <span>2. Travel Inquiries & Operational Scope</span>
            </h2>
            <p>
              Jagtap Travels arranges chauffeur-driven passenger vehicles, outstation tours, airport transfers, and group charters across Maharashtra:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Submitting an inquiry on this website constitutes a travel planning request and does not guarantee vehicle dispatch until reviewed and confirmed by our reservation desk based on fleet and chauffeur availability.</li>
              <li>Official trip confirmation and assigned chauffeur details are communicated directly by our reservation manager.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <ChatDots size={20} weight="bold" className="text-red-700" />
              <span>3. RCS & Mobile Communication Terms</span>
            </h2>
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
              <p>
                By providing your mobile phone number on our website forms, you consent to receive communication regarding your requested travel arrangements via RCS (Rich Communication Services), SMS, WhatsApp, or voice calls:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><strong>Message Frequency:</strong> Messages are limited strictly to your specific travel inquiry and confirmed trip logistics (vehicle plate details, driver contact number, trip start/end alerts).</li>
                <li><strong>Carrier Rates:</strong> Standard message and data rates from your mobile network provider may apply for RCS/SMS.</li>
                <li><strong>Assistance & Opt-Out:</strong> You can reply <strong>HELP</strong> to any message for support or reply <strong>STOP</strong> at any time to immediately cancel mobile messages.</li>
              </ul>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck size={20} weight="bold" className="text-red-700" />
              <span>4. Passenger Guidelines & Safety</span>
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Passengers must ensure that all contact and pickup information supplied is accurate to prevent journey delays.</li>
              <li>Passengers must carry valid government-issued photo identification during transit as required by state and regional highway authorities.</li>
              <li>All travelers must strictly adhere to statutory vehicle seating limits as certified by the Regional Transport Office (RTO).</li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Scales size={20} weight="bold" className="text-red-700" />
              <span>5. Governing Law & Jurisdiction</span>
            </h2>
            <p>
              These Terms and Conditions are governed by and construed in accordance with the laws of India. Any disputes arising out of or related to our travel services shall be subject to the exclusive jurisdiction of the competent courts in Pune, Maharashtra.
            </p>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
            <p>
              For questions regarding our service terms or trip coordination, contact Jagtap Travels at <span className="font-semibold text-slate-700">bookings@jagtaptravels.com</span> or call <span className="font-semibold text-slate-700">+91 90115 07220</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
