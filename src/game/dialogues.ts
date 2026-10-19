import { LANG } from './lang'
import { shuffle, type Rng } from './rules'

export interface DialogueLine {
  /** Qui parle : 0 ou 1, l'indice dans `speakers`. */
  s: 0 | 1
  ar: string
  translit: string
  fr: string
}

export interface Dialogue {
  id: string
  /** 1 à 5 : A1, A2, B1, B2, C1, comme les niveaux des cartes. */
  level: 1 | 2 | 3 | 4 | 5
  situation: string
  title: string
  speakers: [string, string]
  lines: DialogueLine[]
}

// Chargés à la demande : seule la langue apprise est téléchargée.
const FILES = import.meta.glob<Dialogue[]>('../../data/dialogues/*.json', { import: 'default' })
const FILE = FILES[`../../data/dialogues/${LANG.id}.json`]

export const HAS_DIALOGUES = !!FILE

export function loadDialogues(): Promise<Dialogue[]> {
  return FILE ? FILE() : Promise.resolve([])
}

export const DIALOGUE_LEVELS = {
  1: 'A1 · Débutant',
  2: 'A2 · Élémentaire',
  3: 'B1 · Intermédiaire',
  4: 'B2 · Avancé',
  5: 'C1 · Expert',
}

export interface Choice {
  key: string
  line: DialogueLine
}

export interface DialogueQuestion {
  /** Indice de la réplique à retrouver ; celle d'avant sert d'indice. */
  index: number
  /** « reply » : que répond X ? ; « missing » (B2 et plus) : la réplique manque entre celle d'avant et celle d'après. */
  mode: 'reply' | 'missing'
  answer: Choice
  choices: Choice[]
}

/** L'exercice s'allonge avec le niveau : 3 questions en A1-A2, 4 en B1, 5 en B2-C1. */
export const quizSize = (level: number) => (level <= 2 ? 3 : level === 3 ? 4 : 5)

/**
 * Exercice après la lecture : retrouver des répliques manquantes, dans l'ordre du dialogue.
 * Les fausses réponses viennent d'autres dialogues du même niveau, de longueur proche pour ne pas être trop évidentes.
 */
export function dialogueQuiz(d: Dialogue, all: Dialogue[], rng: Rng, size = quizSize(d.level)): DialogueQuestion[] {
  const pool: Choice[] = all
    .filter((o) => o.id !== d.id && o.level === d.level)
    .flatMap((o) => o.lines.map((line, i) => ({ key: `${o.id}:${i}`, line })))
  const indexes = shuffle(
    d.lines.map((_, i) => i).filter((i) => i > 0),
    rng,
  )
    .slice(0, size)
    .sort((a, b) => a - b)
  // En B2 et plus, une question sur deux montre aussi la réplique d'après : il faut trouver celle qui manque au milieu.
  return indexes.map((index, n) => {
    const mode: DialogueQuestion['mode'] = d.level >= 4 && n % 2 === 0 && index < d.lines.length - 1 ? 'missing' : 'reply'
    const line = d.lines[index]
    const answer = { key: `${d.id}:${index}`, line }
    const near = shuffle(
      pool.filter((c) => c.line.ar !== line.ar),
      rng,
    )
      .slice(0, 12)
      .sort((a, b) => Math.abs(a.line.ar.length - line.ar.length) - Math.abs(b.line.ar.length - line.ar.length))
      .slice(0, 3)
    return { index, mode, answer, choices: shuffle([answer, ...near], rng) }
  })
}
