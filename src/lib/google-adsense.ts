export const GOOGLE_ADSENSE_PUBLISHER_ID = 'pub-3814997299935267'
export const GOOGLE_ADSENSE_ACCOUNT = `ca-${GOOGLE_ADSENSE_PUBLISHER_ID}`
export const GOOGLE_ADSENSE_SCRIPT_SRC =
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(GOOGLE_ADSENSE_ACCOUNT)}`

export type GoogleAdSenseSlotPosition = 'top' | 'bottom'

function getValidatedGoogleAdSenseSlotId(slotId: string | undefined) {
  const trimmed = slotId?.trim()

  return trimmed && /^\d+$/.test(trimmed) ? trimmed : null
}

const GOOGLE_ADSENSE_SLOT_IDS: Record<GoogleAdSenseSlotPosition, string | null> = {
  top: getValidatedGoogleAdSenseSlotId(import.meta.env.VITE_GOOGLE_ADSENSE_TOP_SLOT_ID),
  bottom: getValidatedGoogleAdSenseSlotId(import.meta.env.VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID),
}

export function getGoogleAdSenseSlotId(position: GoogleAdSenseSlotPosition) {
  return GOOGLE_ADSENSE_SLOT_IDS[position]
}
