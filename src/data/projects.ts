import type { Content } from '../i18n/content';

type ToolKey = keyof Content['tools']['items'];
type ProjectKey = keyof Content['projects']['kinds'];

export interface Tool {
  key: ToolKey;
  name: string;
  image: string;
  stack: string[];
  href: string;
  /** "repo" links to source code, "open" to a running app. */
  link: 'repo' | 'open';
}

export const tools: Tool[] = [
  {
    key: 'legacy',
    name: 'Legacy UX Helper',
    image: 'legacy-ux-helper.webp',
    stack: ['Chrome MV3', 'JavaScript'],
    href: 'https://github.com/NicLen17/legacy-ux-helper',
    link: 'repo',
  },
  {
    key: 'txtgent',
    name: 'TxtGent',
    image: 'TxtGen.webp',
    stack: ['React', 'TypeScript', 'Vite'],
    href: 'https://www.txtgent.tech/',
    link: 'open',
  },
  {
    key: 'audio',
    name: 'Better Audio UX',
    image: 'better-audio-ux.png',
    stack: ['C#', 'WPF', '.NET 10'],
    href: 'https://github.com/NicLen17/better-audio-ux',
    link: 'repo',
  },
];

export interface Project {
  key: ProjectKey;
  name: string;
  image: string;
  year: string;
  href: string;
  wip?: boolean;
}

export const projects: Project[] = [
  { key: 'tecnoleg', name: 'Tecnoleg', image: 'tecnoleg.webp', year: '2026', href: 'https://www.tecnoleg.com.ar/' },
  { key: 'caw', name: 'CAW Tech', image: 'CAW.webp', year: '2026', href: 'https://www.caw.com.ar' },
  { key: 'leyenda', name: 'La Leyenda', image: 'la-leyenda.webp', year: '2026', href: 'https://la-leyenda-counter-strike.vercel.app' },
  { key: 'cba', name: 'CBA VolleyStar', image: 'CBA.webp', year: '2026', href: 'https://cba-volleystar.vercel.app' },
  { key: 'cancha', name: 'Cancha Manager', image: 'cancha-manager.webp', year: '2026', href: 'https://la-diagonal.vercel.app' },
  { key: 'reaction', name: 'Reaction', image: 'Reaction.webp', year: '2026', href: 'https://reaction-app-alpha.vercel.app/' },
  { key: 'futcam', name: 'FutCam', image: 'futcam.webp', year: '2026', href: 'https://github.com/NicLen17/fut-camara', wip: true },
];

export const talks = {
  video: {
    id: 'jjnaNbFrWe4',
    title: 'Ponemos a prueba a la IA: GPT vs Claude vs Gemini. ¿Cuál diseña mejor el portafolio?',
    image: 'yt-ia-portfolio.jpg',
  },
  deck: { href: 'https://niclen17.github.io/Lightning-Talk-MVP-to-PRO/', image: 'mvp-to-pro.webp' },
  clips: [
    'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7472681732555726848?compact=1',
    'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7358968134524907520?compact=1',
    'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7490145726661033984?compact=1',
  ],
};
