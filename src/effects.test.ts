import { describe, expect, it } from 'vitest'

/**
 * Un effet React doit renvoyer rien ou une fonction de nettoyage. `useEffect(() => window.scrollTo(0, 0))` renvoie une promesse
 * sur les Chrome récents, que React appelle ensuite comme nettoyage : plantage « l is not a function ». On interdit donc les
 * effets écrits sans accolades.
 */
const SOURCES = import.meta.glob<string>('./**/*.tsx', { eager: true, query: '?raw', import: 'default' })

describe('effets React', () => {
  it.each(Object.entries(SOURCES))('%s : chaque effet a un corps entre accolades', (_, code) => {
    const bad = [...code.matchAll(/use(?:Layout)?Effect\(\s*\(\)\s*=>\s*(?!\{)\S.*/g)].map((m) => m[0])
    expect(bad).toEqual([])
  })
})
