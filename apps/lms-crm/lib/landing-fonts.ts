import { Manrope, Newsreader } from 'next/font/google';

/**
 * Police du site public / auth — instance UNIQUE, importée partout (layouts +
 * tout composant portalé hors de [data-landing], ex. Sheet de pré-inscription)
 * pour que `--font-landing-sans` / `--font-landing-serif` restent définies même
 * quand Radix portale le contenu vers `document.body`.
 */
export const landingFontSans = Manrope({
  variable: '--font-landing-sans',
  subsets: ['latin'],
});

export const landingFontSerif = Newsreader({
  variable: '--font-landing-serif',
  subsets: ['latin'],
  style: ['normal', 'italic'],
});

export const landingFontVariables = `${landingFontSans.variable} ${landingFontSerif.variable}`;
