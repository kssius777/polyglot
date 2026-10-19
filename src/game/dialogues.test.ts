import { describe, expect, it } from 'vitest'
import { dialogueQuiz, quizSize } from './dialogues'

/** Les dialogues sont vérifiés comme les cartes : écriture de la langue seulement, accents russes, français présent. */
interface Line {
  s: 0 | 1
  ar: string
  translit: string
  fr: string
}
interface Dialogue {
  id: string
  level: 1 | 2
  situation: string
  title: string
  speakers: [string, string]
  lines: Line[]
}

const SCRIPT: Record<string, RegExp> = {
  ar: /^[ء-غف-ْٰـ\s،؟!.:«»"-]+$/,
  ru: /^[А-Яа-яЁё́\s,.!?:;«»—–-]+$/,
  ka: /^[ა-ჺ\s,.!?:;«»—–-]+$/,
}

/** Nombre de répliques permis par niveau : les dialogues s'allongent avec le niveau. */
const LINES: Record<number, [number, number]> = { 1: [4, 8], 2: [4, 8], 3: [6, 12], 4: [8, 14], 5: [8, 14] }

const FILES = import.meta.glob<Dialogue[]>('../../data/dialogues/*.json', { eager: true, import: 'default' })
const load = (lang: string): Dialogue[] => FILES[`../../data/dialogues/${lang}.json`] ?? []

describe.each(['ar', 'ru', 'ka'])('dialogues %s', (lang) => {
  const all = load(lang)

  it('a assez de dialogues à chaque niveau, de A1 à C1', () => {
    expect(all.length).toBeGreaterThanOrEqual(25)
    for (const level of [1, 2]) expect(all.filter((d) => d.level === level).length).toBeGreaterThanOrEqual(10)
    for (const level of [3, 4, 5])
      expect(all.filter((d) => d.level === level).length, `niveau ${level}`).toBeGreaterThanOrEqual(10)
    expect(new Set(all.map((d) => d.id)).size).toBe(all.length)
  })

  it.each(all.map((d) => [d.id, d] as const))('%s est bien formé', (_, d) => {
    expect([1, 2, 3, 4, 5]).toContain(d.level)
    expect(d.title.trim()).not.toBe('')
    expect(d.situation.trim()).not.toBe('')
    expect(d.speakers).toHaveLength(2)
    const [min, max] = LINES[d.level]
    expect(d.lines.length).toBeGreaterThanOrEqual(min)
    expect(d.lines.length).toBeLessThanOrEqual(max)
    for (const l of d.lines) {
      expect([0, 1]).toContain(l.s)
      expect(l.ar, l.ar).toMatch(SCRIPT[lang])
      expect(l.translit, l.translit).toMatch(/^[^؀-ۿЀ-ӿႠ-ჿ]+$/)
      expect(l.fr.trim(), l.ar).not.toBe('')
      if (lang === 'ar') {
        // Fusha entièrement vocalisée : chaque mot de deux lettres ou plus porte des signes.
        for (const w of l.ar.split(/[\s،؟!.:«»"-]+/).filter((x) => x.replace(/[ً-ْٰ]/g, '').length >= 2))
          expect(w, `${w} dans « ${l.ar} »`).toMatch(/[ً-ْ]/)
      }
      if (lang === 'ru') {
        // Chaque mot de plus d'une syllabe porte son accent (ou un ё).
        for (const w of l.ar.split(/[\s,.!?:;«»—–-]+/).filter(Boolean)) {
          const vowels = (w.match(/[аеёиоуыэюяАЕЁИОУЫЭЮЯ]/g) ?? []).length
          if (vowels > 1) expect(w, `${w} dans « ${l.ar} »`).toMatch(/[́ёЁ]/)
        }
      }
    }
  })
})

describe('exercice des dialogues', () => {
  it.each(['ar', 'ru', 'ka'])("%s : questions dans l'ordre, 4 choix distincts dont la bonne réponse", (lang) => {
    const all = load(lang)
    for (const d of all) {
      const qs = dialogueQuiz(d, all, Math.random)
      expect(qs).toHaveLength(quizSize(d.level))
      if (d.level >= 4) expect(qs.some((q) => q.mode === 'missing')).toBe(true)
      for (const q of qs) {
        expect(q.index).toBeGreaterThan(0)
        expect(q.choices).toHaveLength(4)
        expect(q.choices).toContain(q.answer)
        expect(new Set(q.choices.map((c) => c.line.ar)).size).toBe(4)
      }
      const order = qs.map((q) => q.index)
      expect(order).toEqual([...order].sort((a, b) => a - b))
    }
  })
})
