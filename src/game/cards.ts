import { LANG, type LangId } from './lang'

export type Rarity = 1 | 2 | 3 | 4 | 5

export interface Card {
  id: string
  /** Le mot ou la phrase dans la langue apprise (arabe, russe ou géorgien, malgré le nom historique du champ). */
  ar: string
  translit: string
  fr: string
  theme: string
  kind: 'mot' | 'phrase'
  rarity: Rarity
}

// Seules les cartes de la langue choisie sont téléchargées.
const LOADERS: Record<LangId, () => Promise<{ default: unknown }>> = {
  ar: () => import('../../data/cartes.json'),
  ru: () => import('../../data/ru.json'),
  ka: () => import('../../data/ka.json'),
  zh: () => import('../../data/zh.json'),
}

export const CARDS = (await LOADERS[LANG.id]()).default as Card[]
export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]))
export const TOTAL = CARDS.length

const INDEX = new Map(CARDS.map((c, i) => [c, i]))

export function cardNumber(card: Card): string {
  return `${String((INDEX.get(card) ?? 0) + 1).padStart(3, '0')}/${TOTAL}`
}

export interface ThemeInfo {
  label: string
  icon: string
  color: string
  light: string
}

/**
 * Teinte « pierre précieuse » du fond de carte, par thème : une douzaine de tons riches mais doux, pour que le classeur soit varié
 * sans être criard. Les thèmes proches partagent une teinte.
 */
const JEWEL = {
  ambre: '#c7742c',
  emeraude: '#1f9467',
  mousse: '#5f8f2e',
  rose: '#c94c80',
  rubis: '#b83b55',
  saphir: '#2f67c9',
  sarcelle: '#138a8c',
  corail: '#d2604b',
  violet: '#7052cc',
  or: '#b88a1e',
  indigo: '#4553bd',
  prune: '#9b43b0',
  azur: '#1c86b3',
}
export const THEME_JEWEL: Record<string, string> = {
  nourriture: JEWEL.ambre,
  restaurant: JEWEL.ambre,
  courses: JEWEL.ambre,
  nature: JEWEL.emeraude,
  animaux: JEWEL.mousse,
  famille: JEWEL.rose,
  expressions: JEWEL.rose,
  emotions: JEWEL.rubis,
  couleurs: JEWEL.rubis,
  voyage: JEWEL.saphir,
  transport: JEWEL.saphir,
  verbes: JEWEL.saphir,
  maison: JEWEL.sarcelle,
  vetements: JEWEL.sarcelle,
  outils: JEWEL.sarcelle,
  corps: JEWEL.corail,
  sante: JEWEL.corail,
  travail: JEWEL.violet,
  metiers: JEWEL.violet,
  tech: JEWEL.violet,
  religion: JEWEL.or,
  phrases: JEWEL.or,
  salutations: JEWEL.or,
  temps: JEWEL.indigo,
  nombres: JEWEL.indigo,
  questions: JEWEL.indigo,
  pronoms: JEWEL.indigo,
  loisirs: JEWEL.prune,
  adjectifs: JEWEL.prune,
  ecole: JEWEL.azur,
  societe: JEWEL.azur,
  ville: JEWEL.azur,
}

export const THEMES: Record<string, ThemeInfo> = {
  salutations: {
    label: 'Salutations',
    icon: '👋',
    color: '#e8a33d',
    light: '#fbe3b8',
  },
  pronoms: { label: 'Pronoms', icon: '👤', color: '#8e7cc3', light: '#e2dbf5' },
  famille: { label: 'Famille', icon: '👪', color: '#e06c8c', light: '#f9d4de' },
  nourriture: {
    label: 'Nourriture',
    icon: '🍞',
    color: '#e4572e',
    light: '#fbd2c4',
  },
  maison: { label: 'Maison', icon: '🏠', color: '#a9744f', light: '#ecd9c9' },
  corps: { label: 'Corps', icon: '✋', color: '#f08a5d', light: '#fcdccd' },
  nature: { label: 'Nature', icon: '🌿', color: '#4caf50', light: '#cdeccf' },
  animaux: { label: 'Animaux', icon: '🐾', color: '#8d6e63', light: '#e3d6d1' },
  nombres: { label: 'Nombres', icon: '🔢', color: '#607d8b', light: '#d5e0e5' },
  couleurs: {
    label: 'Couleurs',
    icon: '🎨',
    color: '#d6409f',
    light: '#f6d0e8',
  },
  temps: { label: 'Temps', icon: '⏳', color: '#3f88c5', light: '#cfe3f3' },
  ville: { label: 'Ville', icon: '🏙️', color: '#546e7a', light: '#d3dde2' },
  adjectifs: {
    label: 'Adjectifs',
    icon: '✨',
    color: '#c9a227',
    light: '#f3e8bf',
  },
  questions: {
    label: 'Questions',
    icon: '❓',
    color: '#26a69a',
    light: '#c8ebe7',
  },
  verbes: { label: 'Verbes', icon: '⚡', color: '#f4b400', light: '#fdecb3' },
  expressions: {
    label: 'Expressions',
    icon: '🌙',
    color: '#3949ab',
    light: '#d0d5f1',
  },
  phrases: { label: 'Phrases', icon: '💬', color: '#00897b', light: '#c2e6e2' },
  outils: {
    label: 'Petits mots',
    icon: '🔗',
    color: '#78909c',
    light: '#d7dee2',
  },
  courses: {
    label: 'Au magasin',
    icon: '🛒',
    color: '#ef6c00',
    light: '#fde0c2',
  },
  voyage: { label: 'Voyage', icon: '✈️', color: '#0288d1', light: '#c3e4f6' },
  travail: {
    label: 'Au travail',
    icon: '💼',
    color: '#5d4037',
    light: '#e0d3cc',
  },
  ecole: { label: "À l'école", icon: '🎒', color: '#7b1fa2', light: '#e6cdee' },
  sante: { label: 'Santé', icon: '🩺', color: '#d32f2f', light: '#f7cfcf' },
  restaurant: {
    label: 'Au restaurant',
    icon: '🍽️',
    color: '#c0ca33',
    light: '#eff2c4',
  },
  vetements: {
    label: 'Vêtements',
    icon: '👕',
    color: '#ad1457',
    light: '#f3cadd',
  },
  emotions: {
    label: 'Émotions',
    icon: '💖',
    color: '#e91e63',
    light: '#f9cbdb',
  },
  transport: {
    label: 'Transport',
    icon: '🚆',
    color: '#546e7a',
    light: '#d3dde2',
  },
  metiers: { label: 'Métiers', icon: '👷', color: '#6d4c41', light: '#e3d6d0' },
  tech: {
    label: 'Technologie',
    icon: '📱',
    color: '#3f51b5',
    light: '#d1d6f0',
  },
  loisirs: { label: 'Loisirs', icon: '⚽', color: '#43a047', light: '#cfe9d0' },
  religion: {
    label: 'Religion',
    icon: '🕌',
    color: '#00695c',
    light: '#c0e0dc',
  },
  societe: { label: 'Société', icon: '📰', color: '#455a64', light: '#cfd8dc' },
}

export const RARITIES: Record<Rarity, { name: string; symbol: string; color: string; desc: string }> = {
  // Raretés calées sur les niveaux du cadre européen (CECRL).
  1: { name: 'A1', symbol: '●', color: '#9aa3ad', desc: 'Débutant' },
  2: { name: 'A2', symbol: '◆', color: '#43a047', desc: 'Élémentaire' },
  3: { name: 'B1', symbol: '★', color: '#1e88e5', desc: 'Intermédiaire' },
  4: {
    name: 'B2',
    symbol: '★★',
    color: '#8e24aa',
    desc: 'Intermédiaire avancé',
  },
  5: { name: 'C1', symbol: '★★★', color: '#f9a825', desc: 'Avancé' },
}
