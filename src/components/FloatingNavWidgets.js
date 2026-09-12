'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function FloatingNavWidgets() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen: isCartOpen } = useCart();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const currentY = window.scrollY || window.pageYOffset || 0;
      const totalDocHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      setIsScrolled(currentY > 40);

      if (totalDocHeight > 0) {
        const progress = Math.min(100, Math.max(0, (currentY / totalDocHeight) * 100));
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    }
  };

  const handleScrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (!mounted) return null;

  // Don't render inside iframe embeds or if print mode
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div className={`floating-nav-dock ${isCartOpen ? 'cart-open-hidden' : ''}`} role="region" aria-label="Page Navigation Shortcuts">
      {/* Back Button */}
      <button
        type="button"
        onClick={handleBack}
        className="floating-widget-btn back-btn"
        aria-label="Go Back"
        title="Go to previous page"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="widget-icon"
        >
          <path d="M19 12H5" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span className="floating-widget-tooltip">Go Back</span>
      </button>

      {/* Back to Top Button */}
      <button
        type="button"
        onClick={handleScrollToTop}
        className={`floating-widget-btn top-btn ${isScrolled ? 'is-active' : 'at-top'}`}
        aria-label="Scroll Back to Top"
        title="Scroll to top"
      >
        {/* SVG Circular Progress Ring */}
        <svg className="progress-ring" width="46" height="46" viewBox="0 0 46 46">
          <circle
            className="progress-ring-track"
            cx="23"
            cy="23"
            r={radius}
            strokeWidth="3"
            fill="none"
          />
          <circle
            className="progress-ring-fill"
            cx="23"
            cy="23"
            r={radius}
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="widget-icon top-arrow-icon"
        >
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>

        <span className="floating-widget-tooltip">
          {Math.round(scrollProgress)}% • Back to Top
        </span>
      </button>
    </div>
  );
}
