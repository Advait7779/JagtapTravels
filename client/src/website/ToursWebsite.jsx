import React, { useState, useEffect } from 'react';
import WebsiteNavbar from './WebsiteNavbar';
import HomePage from './pages/HomePage';
import PackagesPage from './pages/PackagesPage';
import WhyUsPage from './pages/WhyUsPage';
import ContactPage from './pages/ContactPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import WebsiteFooter from './WebsiteFooter';
import FloatingActions from './FloatingActions';

const VALID_PAGES = ['home', 'packages', 'why-us', 'contact', 'privacy', 'terms'];

export default function ToursWebsite({ onOpenAdmin }) {
  const [currentPage, setCurrentPage] = useState(() => {
    const rawHash = (window.location.hash || '').replace('#', '').toLowerCase();
    return VALID_PAGES.includes(rawHash) ? rawHash : 'home';
  });

  const [selectedTourPackage, setSelectedTourPackage] = useState(null);

  // Sync with browser hash changes (e.g. back/forward button navigation)
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = (window.location.hash || '').replace('#', '').toLowerCase();
      if (VALID_PAGES.includes(rawHash)) {
        setCurrentPage(rawHash);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (pageId) => {
    if (!VALID_PAGES.includes(pageId)) return;
    setCurrentPage(pageId);
    window.location.hash = `#${pageId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookPackage = (pkg) => {
    setSelectedTourPackage(pkg);
    handleNavigate('contact');
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-red-700 selection:text-white flex flex-col justify-between">
      {/* Fixed Header with strictly the 5 Navigation Items */}
      <WebsiteNavbar
        onOpenAdmin={onOpenAdmin}
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

      {/* Main Multi-Page Body Content */}
      <main className="flex-1 w-full">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'packages' && (
          <PackagesPage onNavigate={handleNavigate} onBookPackage={handleBookPackage} />
        )}
        {currentPage === 'why-us' && <WhyUsPage onNavigate={handleNavigate} />}
        {currentPage === 'contact' && <ContactPage onNavigate={handleNavigate} />}
        {currentPage === 'privacy' && <PrivacyPage onNavigate={handleNavigate} />}
        {currentPage === 'terms' && <TermsPage onNavigate={handleNavigate} />}
      </main>

      {/* Shared Footer with Multi-Page Navigation */}
      <WebsiteFooter onOpenAdmin={onOpenAdmin} onNavigate={handleNavigate} />

      {/* 24/7 Floating WhatsApp & Call Buttons */}
      <FloatingActions />
    </div>
  );
}
