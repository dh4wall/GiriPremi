const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim()
export const API_BASE_URL = rawBase.replace(/\/+$/, '')

export const landingMedia = {
  logo: import.meta.env.VITE_LANDING_LOGO_URL || '',
  hero: import.meta.env.VITE_LANDING_HERO_URL || '',
  gear: import.meta.env.VITE_LANDING_GEAR_URL || '',
  oxygen: import.meta.env.VITE_LANDING_OXYGEN_URL || '',
}
