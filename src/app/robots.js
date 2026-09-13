export default function robots() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://menyphis.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/checkout/success'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
