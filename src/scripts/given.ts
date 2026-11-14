/**
 * Scroll that the pinned product scenes have taken out of the page once it was
 * used up (see scenes.ts), in viewport heights per scene. The header's
 * progress line adds it back, so the line never jumps backwards when a scene
 * shortens itself.
 */
export const given = new Map<HTMLElement, number>();
