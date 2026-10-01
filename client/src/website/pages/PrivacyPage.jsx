import React from 'react';
import PageHeader from '../components/PageHeader';
import { ShieldCheck, ChatDots, Envelope, MapPin, PhoneCall } from '@phosphor-icons/react';

export default function PrivacyPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-slate-50 font-['Plus_Jakarta_Sans',sans-serif]">
      <PageHeader
        title="Privacy Policy"
        subtitle="How Jagtap Travels handles and protects your inquiry and communication data."
        breadcrumb="Privacy Policy"
        badge="Data Protection & Privacy"
        onNavigateHome={() => onNavigate('home')}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-md border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} weight="bold" className="text-red-700" />
              <span>1. Who We Are</span>
            </h2>
            <p>
              Jagtap Travels is a licensed private passenger transport and tour planning service based in Bhekrai Nagar, Pune, Maharashtra. We operate our own fleet of commercial vehicles and coordinate customized travel circuits across Maharashtra and adjoining regions.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <ChatDots size={20} weight="bold" className="text-red-700" />
              <span>2. Information We Collect</span>
            </h2>
            <p>
              We only collect information that you voluntarily provide when submitting a tour inquiry or contact request through our website:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Contact Information:</strong> Your full name, mobile phone number, and optional email address.</li>
              <li><strong>Trip Requirements:</strong> Travel date, pickup location, travel destination, passenger count, and preferred vehicle class (Sedan, Ertiga, Innova Crysta, Urbania, or Bus).</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <PhoneCall size={20} weight="bold" className="text-red-700" />
              <span>3. How We Use Information & Mobile / RCS Messaging</span>
            </h2>
            <p>
              Your contact details are used exclusively to process your travel inquiry and fulfill trip coordination:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Responding to your itinerary inquiry with availability and route details.</li>
              <li>Sending operational notifications (assigned driver contact details, vehicle plate number, arrival and journey updates) via RCS (Rich Communication Services), SMS, phone call, or WhatsApp.</li>
            </ul>
            <p className="mt-2 text-slate-600">
              By submitting your phone number on our website, you provide consent to receive these operational communications directly related to your travel request.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} weight="bold" className="text-red-700" />
              <span>4. Opt-Out & Strict No-Sharing Policy</span>
            </h2>
            <div className="p-4 rounded-md bg-slate-50 border border-slate-200 space-y-2">
              <p className="font-bold text-slate-900">
                • Strict Zero-Sharing Commitment:
              </p>
              <p className="text-slate-600">
                We strictly do <strong>not</strong> sell, rent, lease, trade, or share your mobile phone number or personal details with any third-party marketing agencies or external entities under any circumstances.
              </p>
              <p className="font-bold text-slate-900 pt-1">
                • How to Opt Out:
              </p>
              <p className="text-slate-600">
                You can revoke your messaging consent at any time. Simply reply <strong>STOP</strong> to any message received on RCS or SMS, or contact us directly at <span className="font-semibold text-slate-800">bookings@jagtaptravels.com</span>, and you will be unsubscribed promptly.
              </p>
            </div>
          </div>

          {/* Section 5: Contact */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <h2 className="text-sm font-bold text-slate-900">
              Contact & Privacy Inquiries
            </h2>
            <p className="text-slate-600">
              If you have any questions about our privacy practices, please contact our administrative desk:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-1 text-slate-700 font-medium text-xs">
              <span className="flex items-center gap-1.5">
                <Envelope size={15} className="text-red-700" />
                bookings@jagtaptravels.com
              </span>
              <span className="flex items-center gap-1.5">
                <PhoneCall size={15} className="text-red-700" />
                +91 90115 07220 / +91 88880 94770
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-red-700 shrink-0" />
                Siddhi Niwas, Purandhar Colony, Bhekrai Nagar, Pune - 412308
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
