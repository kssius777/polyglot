import { describe, expect, it } from 'vitest'

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

const FILES = import.meta.glob<Dialogue[]>('../../data/dialogues/*.json', { eager: true, import: 'default' })
const load = (lang: string): Dialogue[] => FILES[`../../data/dialogues/${lang}.json`] ?? []

describe.each(['ar', 'ru', 'ka'])('dialogues %s', (lang) => {
  const all = load(lang)

  it('a assez de dialogues, A1 puis A2', () => {
    expect(all.length).toBeGreaterThanOrEqual(25)
    expect(all.some((d) => d.level === 1)).toBe(true)
    expect(all.some((d) => d.level === 2)).toBe(true)
    expect(new Set(all.map((d) => d.id)).size).toBe(all.length)
  })

  it.each(all.map((d) => [d.id, d] as const))('%s est bien formé', (_, d) => {
    expect([1, 2]).toContain(d.level)
    expect(d.title.trim()).not.toBe('')
    expect(d.situation.trim()).not.toBe('')
    expect(d.speakers).toHaveLength(2)
    expect(d.lines.length).toBeGreaterThanOrEqual(4)
    expect(d.lines.length).toBeLessThanOrEqual(8)
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
