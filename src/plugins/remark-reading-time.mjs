import { toString } from 'mdast-util-to-string';

/**
 * Injecte un temps de lecture dans le frontmatter dérivé de chaque page
 * Markdown, disponible via `remarkPluginFrontmatter.minutes`.
 * Base : 220 mots/minute, moyenne pour du français en lecture d'écran.
 */
export function remarkReadingTime() {
  return (tree, file) => {
    const words = toString(tree).trim().split(/\s+/).filter(Boolean).length;
    file.data.astro.frontmatter.minutes = Math.max(1, Math.round(words / 220));
    file.data.astro.frontmatter.words = words;
  };
}
