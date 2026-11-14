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
 * Only current work: each project appears through several different views
 * (landing, catalogue, admin, tools), mixed with drawn vignettes (a chart, a
 * schema, a flow) so the board reads as "software being built" at a glance.
 * Hero.astro deals this list into five hands, so 55 entries is the minimum that
 * keeps two copies of a picture at least five lanes apart.
 *
 * The board is served as one atlas image per screen size, built from this list:
 * after changing it (or any of its pictures) run `npm run atlas` and commit the
 * files it writes to src/assets/hero. The build fails if they are out of date.
 */
export const heroShots: Shot[] = [
  { file: 'VolleyManager.webp', label: 'Volley Manager', href: '#volley-manager' },
  { file: 'ExpoLogic.webp', label: 'ExpoLogic', href: '#expologic' },
  { file: 'tile-court.webp', label: 'Scouting', href: '#volley-manager' },
  { file: 'tecnoleg.webp', label: 'Tecnoleg', href: '#projects' },
  { file: 'tile-bars.webp', label: 'Analytics', href: '#volley-manager' },
  { file: 'expologic-map.webp', label: 'Stand map', href: '#expologic' },
  { file: 'volley-heatmap.webp', label: 'Heat map', href: '#volley-manager' },
  { file: 'CAW.webp', label: 'CAW Tech', href: '#projects' },
  { file: 'tile-flow.webp', label: 'Workflows', href: '#experience' },
  { file: 'legacy-ux-helper.webp', label: 'Legacy UX Helper', href: '#tools' },
  { file: 'TxtGen.webp', label: 'TxtGent', href: '#tools' },
  { file: 'CBA.webp', label: 'CBA VolleyStar', href: '#projects' },
  { file: 'tile-schema.webp', label: 'Data model', href: '#experience' },
  { file: 'cancha-manager.webp', label: 'Cancha Manager', href: '#projects' },
  { file: 'shot-tecnoleg-1.webp', label: 'Tecnoleg catalogue', href: '#projects' },
  { file: 'volley-athlete.webp', label: 'Athlete profile', href: '#volley-manager' },
  { file: 'expologic-panel.webp', label: 'Organizer panel', href: '#expologic' },
  { file: 'tile-code.webp', label: 'Code', href: '#tools' },
  { file: 'shot-caw-1.webp', label: 'CAW solutions', href: '#projects' },
  { file: 'la-leyenda.webp', label: 'La Leyenda', href: '#projects' },
  { file: 'shot-cba-1.webp', label: 'CBA services', href: '#projects' },
  { file: 'tile-donut.webp', label: 'KPIs', href: '#volley-manager' },
  { file: 'mvp-to-pro.webp', label: 'MVP to Pro', href: '#talks' },
  { file: 'shot-cancha-1.webp', label: 'Court booking', href: '#projects' },
  { file: 'volley-ai.webp', label: 'AI assistant', href: '#volley-manager' },
  { file: 'Reaction.webp', label: 'Reaction', href: '#projects' },
  { file: 'tile-arch.webp', label: 'Architecture', href: '#experience' },
  { file: 'shot-txtgent-1.webp', label: 'TxtGent builder', href: '#tools' },
  { file: 'expologic-reservas.webp', label: 'Reservations', href: '#expologic' },
  { file: 'yt-ia-portfolio.jpg', label: 'Latest video', href: '#talks' },
  { file: 'shot-caw-2.webp', label: 'CAW engineering', href: '#projects' },
  { file: 'tile-api.webp', label: 'APIs', href: '#experience' },
  { file: 'futcam.webp', label: 'FutCam', href: '#projects' },
  { file: 'shot-cba-2.webp', label: 'CBA events', href: '#projects' },
  { file: 'txtgen-workspace.png', label: 'Templates', href: '#tools' },
  { file: 'shot-tecnoleg-2.webp', label: 'Tecnoleg stores', href: '#projects' },
  { file: 'tile-map.webp', label: 'Floor plan', href: '#expologic' },
  { file: 'better-audio-ux.png', label: 'Better Audio UX', href: '#tools' },
  { file: 'shot-reaction-2.webp', label: 'Reaction modes', href: '#projects' },
  { file: 'legacy-ux-helper-colors.png', label: 'Overlay styles', href: '#tools' },
  { file: 'profile.png', label: 'About me', href: '#about' },
  { file: 'tile-line.webp', label: 'Growth', href: '#about' },
  { file: 'shot-cancha-2.webp', label: 'Cancha Manager tour', href: '#projects' },
  { file: 'CAW-3.webp', label: 'CAW', href: '#projects' },
  { file: 'shot-cba-3.webp', label: 'CBA programmes', href: '#projects' },
  { file: 'social-github.png', label: 'GitHub', href: '#contact' },
  { file: 'tile-kanban.webp', label: 'Delivery', href: '#experience' },
  { file: 'shot-txtgent-2.webp', label: 'TxtGent features', href: '#tools' },
  { file: 'shot-caw-3.webp', label: 'CAW team', href: '#projects' },
  { file: 'social-youtube.png', label: 'YouTube channel', href: '#talks' },
  { file: 'shot-tecnoleg-3.webp', label: 'Tecnoleg categories', href: '#projects' },
  { file: 'tile-terminal.webp', label: 'Deploys', href: '#tools' },
  { file: 'shot-reaction-1.webp', label: 'Reaction guide', href: '#projects' },
  { file: 'social-linkedin.png', label: 'LinkedIn', href: '#contact' },
  { file: 'cv-en.png', label: 'Résumé', href: '#contact' },
];
