import './globals.css';
import { sql } from '@/lib/db';
import Script from 'next/script';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { FlashSaleProvider } from '@/context/FlashSaleContext';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Footer from '@/components/Footer';
import MaintenanceOverlay from '@/components/MaintenanceOverlay';

export async function generateMetadata() {
  try {
    const res = await sql.query("SELECT key, value FROM site_settings WHERE key IN ('seo_title', 'seo_description', 'seo_og_image', 'site_name')");
    const rows = Array.isArray(res) ? res : (res.rows || res);
    const settings = {};
    for (const row of rows) settings[row.key] = row.value;
    return {
      title: settings.seo_title || settings.site_name || 'Menyphis',
      description: settings.seo_description || '',
      openGraph: {
        images: settings.seo_og_image ? [settings.seo_og_image] : [],
      }
    };
  } catch {
    return { title: 'Menyphis' };
  }
}

export default async function RootLayout({ children }) {
  let gaId = '';
  try {
    const res = await sql.query("SELECT value FROM site_settings WHERE key = 'google_analytics_id'");
    const rows = Array.isArray(res) ? res : (res.rows || res);
    gaId = rows[0]?.value || '';
  } catch {}

  return (
    <html lang="en">
      <body>
        {gaId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
        <AuthProvider>
          <SiteSettingsProvider>
            <CurrencyProvider>
              <FlashSaleProvider>
                <CartProvider>
                  <WishlistProvider>
                    <MaintenanceOverlay />
                    <Navbar />
                    <CartDrawer />
                    <main>{children}</main>
                    <Footer />
                  </WishlistProvider>
                </CartProvider>
              </FlashSaleProvider>
            </CurrencyProvider>
          </SiteSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
