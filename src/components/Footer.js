'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { MailIcon, PhoneIcon, MapPinIcon } from '@/components/Icons';

export default function Footer() {
  const pathname = usePathname();
  const { get } = useSiteSettings();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-brand-name">{get('site_name', 'Menyphis')}</div>
          <p>{get('footer_tagline', 'Premium streetwear brand crafting bold, unique designs for those who dare to stand out.')}</p>
          <div className="footer-socials">
            {get('social_instagram') && (
              <a href={get('social_instagram')} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
            )}
            {get('social_twitter') && (
              <a href={get('social_twitter')} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
            {get('social_tiktok') && (
              <a href={get('social_tiktok')} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="TikTok">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.92 2.92 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 15.64 6.33 6.33 0 0 0 9.37 22a6.33 6.33 0 0 0 6.38-6.36V9.15a8.16 8.16 0 0 0 3.84.96V6.69z"/>
                </svg>
              </a>
            )}
            {get('social_youtube') && (
              <a href={get('social_youtube')} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.75 12 19.75 12 19.75s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
                </svg>
              </a>
            )}
            {get('social_facebook') && (
              <a href={get('social_facebook')} target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Facebook">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="footer-column">
          <h4>Shop</h4>
          <Link href="/shop?category=shirts">Shirts</Link>
          <Link href="/shop?category=hoodies">Hoodies</Link>
          <Link href="/shop?category=limited-edition">Limited Edition</Link>
          <Link href="/shop?category=new-arrivals">New Arrivals</Link>
          <Link href="/shop">All Products</Link>
        </div>

        <div className="footer-column">
          <h4>Help</h4>
          <a href="#">Size Guide</a>
          <a href="#">Shipping Info</a>
          <a href="#">Returns</a>
          <Link href="/track">Track Order</Link>
          <a href="#">FAQ</a>
        </div>

        <div className="footer-column">
          <h4>Contact Us</h4>
          {get('contact_email') && (
            <a href={`mailto:${get('contact_email')}`} style={{ wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MailIcon size={15} /> {get('contact_email')}
            </a>
          )}
          {get('contact_phone') && (
            <a href={`tel:${get('contact_phone')}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhoneIcon size={15} /> {get('contact_phone')}
            </a>
          )}
          {get('contact_address') && (
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.6', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <MapPinIcon size={15} style={{ marginTop: '3px' }} /> {get('contact_address')}
            </span>
          )}
        </div>

        <div className="footer-column">
          <h4>Company</h4>
          <Link href="/become-a-seller" style={{ color: 'var(--color-primary, #3b82f6)', fontWeight: 600 }}>Become a Seller</Link>
          <a href="#">About Us</a>
          <a href="#">Our Story</a>
          <a href="#">Careers</a>
        </div>

        <div className="footer-column">
          <h4>Legal</h4>
          {get('privacy_policy_url') && <a href={get('privacy_policy_url')}>Privacy Policy</a>}
          {get('terms_url') && <a href={get('terms_url')}>Terms of Service</a>}
          {get('returns_policy_url') && <a href={get('returns_policy_url')}>Returns Policy</a>}
          <a href="#">Cookie Policy</a>
          <a href="#">Accessibility</a>
        </div>
      </div>

      <div className="footer-bottom">
        <span>{get('footer_copyright', '© 2026 Menyphis. All rights reserved.')}</span>
        <span>We accept Visa, Mastercard, PayPal & more</span>
      </div>
    </footer>
  );
}
