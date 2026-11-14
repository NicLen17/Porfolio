import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../assets/media/*.{webp,png,jpg}', { eager: true });

/** Look up an optimizable image by its file name inside src/assets/media. */
export function media(name: string): ImageMetadata {
  const hit = files[`../assets/media/${name}`];
  if (!hit) throw new Error(`Missing media asset: ${name}`);
  return hit.default;
}

export interface Shot {
  file: string;
  label: string;
  href: string;
}

/** Hero mosaic, most important first: the first ones land closest to the centre. */
export const heroShots: Shot[] = [
  { file: 'VolleyManager.webp', label: 'Volley Manager', href: '#volley-manager' },
  { file: 'ExpoLogic.webp', label: 'ExpoLogic', href: '#expologic' },
  { file: 'volley-heatmap.webp', label: 'Scouting', href: '#volley-manager' },
  { file: 'expologic-map.webp', label: 'Stand map', href: '#expologic' },
  { file: 'tecnoleg.webp', label: 'Tecnoleg', href: '#projects' },
  { file: 'legacy-ux-helper.webp', label: 'Legacy UX Helper', href: '#tools' },
  { file: 'la-leyenda.webp', label: 'La Leyenda', href: '#projects' },
  { file: 'TxtGen.webp', label: 'TxtGent', href: '#tools' },
  { file: 'CBA.webp', label: 'CBA VolleyStar', href: '#projects' },
  { file: 'cancha-manager.webp', label: 'Cancha Manager', href: '#projects' },
  { file: 'mvp-to-pro.webp', label: 'MVP to Pro', href: '#talks' },
  { file: 'mix-potrero.webp', label: 'Mix Potrero', href: '#projects' },
  { file: 'la-congreso.webp', label: 'LA Congreso', href: '#projects' },
  { file: 'Reaction.webp', label: 'Reaction', href: '#projects' },
  { file: 'CAW.webp', label: 'CAW Tech', href: '#projects' },
  { file: 'Terradeco.webp', label: 'Terradeco', href: '#projects' },
  { file: 'Sublimspace.webp', label: 'Sublimspace', href: '#projects' },
  { file: 'futcam.webp', label: 'FutCam', href: '#projects' },
  { file: 'volley-athlete.webp', label: 'Athlete profile', href: '#volley-manager' },
  { file: 'expologic-panel.webp', label: 'Organizer panel', href: '#expologic' },
  { file: 'volley-ai.webp', label: 'AI assistant', href: '#volley-manager' },
  { file: 'expologic-reservas.webp', label: 'Reservations', href: '#expologic' },
  { file: 'txtgen-workspace.png', label: 'Templates', href: '#tools' },
  { file: 'legacy-ux-helper-colors.png', label: 'Overlay styles', href: '#tools' },
  { file: 'CAW-3.webp', label: 'CAW', href: '#projects' },
  { file: 'better-audio-ux.png', label: 'Better Audio UX', href: '#tools' },
  // Earlier work: not listed below any more, but part of the road here.
  { file: 'lomas-gym.webp', label: 'Lomas Gym', href: '#projects' },
  { file: 'caw-education-landing.webp', label: 'CAW Education', href: '#projects' },
  { file: 'bullet-hell.webp', label: 'Bullet Hell', href: '#projects' },
  { file: 'EnduringEducation.webp', label: 'Enduring Education', href: '#projects' },
  { file: 'LBS.webp', label: 'Little Bite Society', href: '#projects' },
  { file: 'BOTCAMPBACK.webp', label: 'Bootcamp Back-end', href: '#projects' },
  { file: 'CEBAMATE 1.webp', label: 'Cebamate', href: '#projects' },
  { file: 'PELUQUERIA 1.webp', label: 'Moustache Gentleman', href: '#projects' },
  { file: 'TAURIE.webp', label: 'Taurie', href: '#projects' },
  { file: '15CATA.webp', label: 'Catalina XV', href: '#projects' },
  { file: '18MAURO.webp', label: 'Mateo 18', href: '#projects' },
  { file: 'cawpic.webp', label: 'CAW Motors', href: '#projects' },
  { file: 'ZETAROSS.webp', label: 'Zetaross', href: '#projects' },
  { file: 'KEIS.webp', label: 'Keis', href: '#projects' },
  { file: 'PHONEPIXEL.webp', label: 'Phone Pixel', href: '#projects' },
];
