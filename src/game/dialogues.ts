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
  level: 1 | 2
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

export const DIALOGUE_LEVELS = { 1: 'Niveau 1 · A1', 2: 'Niveau 2 · A2' }

export interface Choice {
  key: string
  line: DialogueLine
}

export interface DialogueQuestion {
  /** Indice de la réplique à retrouver ; celle d'avant sert d'indice. */
  index: number
  answer: Choice
  choices: Choice[]
}

export const QUIZ_SIZE = 3

/**
 * Exercice après la lecture : retrouver des répliques manquantes, dans l'ordre du dialogue.
 * Les fausses réponses viennent d'autres dialogues du même niveau, de longueur proche pour ne pas être trop évidentes.
 */
export function dialogueQuiz(d: Dialogue, all: Dialogue[], rng: Rng, size = QUIZ_SIZE): DialogueQuestion[] {
  const pool: Choice[] = all
    .filter((o) => o.id !== d.id && o.level === d.level)
    .flatMap((o) => o.lines.map((line, i) => ({ key: `${o.id}:${i}`, line })))
  const indexes = shuffle(
    d.lines.map((_, i) => i).filter((i) => i > 0),
    rng,
  )
    .slice(0, size)
    .sort((a, b) => a - b)
  return indexes.map((index) => {
    const line = d.lines[index]
    const answer = { key: `${d.id}:${index}`, line }
    const near = shuffle(
      pool.filter((c) => c.line.ar !== line.ar),
      rng,
    )
      .slice(0, 12)
      .sort((a, b) => Math.abs(a.line.ar.length - line.ar.length) - Math.abs(b.line.ar.length - line.ar.length))
      .slice(0, 3)
    return { index, answer, choices: shuffle([answer, ...near], rng) }
  })
}
