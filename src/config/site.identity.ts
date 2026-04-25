export const siteIdentity = {
  code: process.env.NEXT_PUBLIC_SITE_CODE || 'ptrylpufvh',
  name: process.env.NEXT_PUBLIC_SITE_NAME || 'Gutsbranding',
  tagline: process.env.NEXT_PUBLIC_SITE_TAGLINE || 'Independent journalism and analysis',
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'An independent article publication covering policy, technology, business, climate, and culture through reported stories and deep analysis.',
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || 'gutsbranding.com',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://gutsbranding.com',
  ogImage: process.env.NEXT_PUBLIC_SITE_OG_IMAGE || '/og-default.png',
  googleMapsEmbedApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY || 'AIzaSyBco7dIECu3rJWjP3J0MImnR_uxlbeqAe0',

} as const

export const defaultAuthorProfile = {
  name: siteIdentity.name,
  avatar: '/placeholder.svg?height=80&width=80',
} as const

