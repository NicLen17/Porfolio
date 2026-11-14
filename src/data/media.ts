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

/**
 * Hero mosaic, most important first: the first ones land closest to the centre.
 * Every fourth tile is a drawn vignette (a chart, a schema, a flow) instead of
 * a screenshot, so the board reads as "software being built" at a glance.
 *
 * The board is served as one atlas image per screen size, built from this list:
 * after changing it (or any of its pictures) run `npm run atlas` and commit the
 * files it writes to src/assets/hero. The build fails if they are out of date.
 */
export const heroShots: Shot[] = [
  { file: 'VolleyManager.webp', label: 'Volley Manager', href: '#volley-manager' },
  { file: 'ExpoLogic.webp', label: 'ExpoLogic', href: '#expologic' },
  { file: 'volley-heatmap.webp', label: 'Scouting', href: '#volley-manager' },
  { file: 'tile-bars.webp', label: 'Analytics', href: '#volley-manager' },
  { file: 'expologic-map.webp', label: 'Stand map', href: '#expologic' },
  { file: 'tecnoleg.webp', label: 'Tecnoleg', href: '#projects' },
  { file: 'legacy-ux-helper.webp', label: 'Legacy UX Helper', href: '#tools' },
  { file: 'tile-flow.webp', label: 'Workflows', href: '#experience' },
  { file: 'la-leyenda.webp', label: 'La Leyenda', href: '#projects' },
  { file: 'TxtGen.webp', label: 'TxtGent', href: '#tools' },
  { file: 'CBA.webp', label: 'CBA VolleyStar', href: '#projects' },
  { file: 'tile-code.webp', label: 'Code', href: '#tools' },
  { file: 'cancha-manager.webp', label: 'Cancha Manager', href: '#projects' },
  { file: 'mvp-to-pro.webp', label: 'MVP to Pro', href: '#talks' },
  { file: 'mix-potrero.webp', label: 'Mix Potrero', href: '#projects' },
  { file: 'tile-schema.webp', label: 'Data model', href: '#experience' },
  { file: 'la-congreso.webp', label: 'LA Congreso', href: '#projects' },
  { file: 'Reaction.webp', label: 'Reaction', href: '#projects' },
  { file: 'CAW.webp', label: 'CAW Tech', href: '#projects' },
  { file: 'tile-donut.webp', label: 'KPIs', href: '#volley-manager' },
  { file: 'Terradeco.webp', label: 'Terradeco', href: '#projects' },
  { file: 'Sublimspace.webp', label: 'Sublimspace', href: '#projects' },
  { file: 'futcam.webp', label: 'FutCam', href: '#projects' },
  { file: 'tile-arch.webp', label: 'Architecture', href: '#experience' },
  { file: 'volley-athlete.webp', label: 'Athlete profile', href: '#volley-manager' },
  { file: 'expologic-panel.webp', label: 'Organizer panel', href: '#expologic' },
  { file: 'volley-ai.webp', label: 'AI assistant', href: '#volley-manager' },
  { file: 'tile-court.webp', label: 'Scouting', href: '#volley-manager' },
  { file: 'expologic-reservas.webp', label: 'Reservations', href: '#expologic' },
  { file: 'txtgen-workspace.png', label: 'Templates', href: '#tools' },
  { file: 'legacy-ux-helper-colors.png', label: 'Overlay styles', href: '#tools' },
  { file: 'tile-api.webp', label: 'APIs', href: '#experience' },
  { file: 'CAW-3.webp', label: 'CAW', href: '#projects' },
  { file: 'better-audio-ux.png', label: 'Better Audio UX', href: '#tools' },
  { file: 'lomas-gym.webp', label: 'Lomas Gym', href: '#projects' },
  { file: 'tile-map.webp', label: 'Stand map', href: '#expologic' },
  { file: 'EnduringEducation.webp', label: 'Enduring Education', href: '#projects' },
  { file: 'LBS.webp', label: 'Little Bite Society', href: '#projects' },
  { file: 'BOTCAMPBACK.webp', label: 'Bootcamp Back-end', href: '#projects' },
  { file: 'tile-line.webp', label: 'Growth', href: '#about' },
  { file: 'CEBAMATE 1.webp', label: 'Cebamate', href: '#projects' },
  { file: 'PELUQUERIA 1.webp', label: 'Moustache Gentleman', href: '#projects' },
  { file: 'TAURIE.webp', label: 'Taurie', href: '#projects' },
  { file: 'tile-kanban.webp', label: 'Delivery', href: '#experience' },
  { file: '15CATA.webp', label: 'Catalina XV', href: '#projects' },
  { file: '18MAURO.webp', label: 'Mateo 18', href: '#projects' },
  { file: 'cawpic.webp', label: 'CAW Motors', href: '#projects' },
  { file: 'tile-terminal.webp', label: 'Deploys', href: '#tools' },
  { file: 'ZETAROSS.webp', label: 'Zetaross', href: '#projects' },
  { file: 'KEIS.webp', label: 'Keis', href: '#projects' },
  { file: 'PHONEPIXEL.webp', label: 'Phone Pixel', href: '#projects' },
];
