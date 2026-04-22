export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/auth/', '/api/upgrade/'],
    },
    sitemap: 'https://pinplaced.com/sitemap.xml',
  }
}
