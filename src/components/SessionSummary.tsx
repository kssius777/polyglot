import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Card } from '../game/cards'
import { GameCard } from './GameCard'

export interface SummaryLine {
  icon: ReactNode
  text: string
  tone?: 'good' | 'bad'
}

interface Props {
  title: string
  good: number
  total: number
  lines: SummaryLine[]
  groups: { title: string; cards: Card[] }[]
  children: ReactNode
  /** Sortie : bouton en haut à gauche et touche Échap. */
  onClose: () => void
  closeLabel?: string
}

/** Écran de fin de séance (révision ou booster) : le score, ce qui a changé, puis les cartes à revoir en grand. */
export function SessionSummary({ title, good, total, lines, groups, children, onClose, closeLabel = 'Accueil' }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const ratio = total ? good / total : 0
  const mood =
    ratio === 1
      ? 'Parfait !'
      : ratio >= 0.7
        ? 'Bien joué !'
        : ratio >= 0.4
          ? 'Ça vient, continue.'
          : 'On s’accroche, ça va rentrer.'
  return (
    <div className="screen center session-end">
      <button className="btn ghost small end-close" onClick={onClose}>
        <X size={16} aria-hidden />
        {closeLabel}
      </button>
      <div className="end-ring">
        <svg viewBox="0 0 44 44" aria-hidden>
          <circle cx="22" cy="22" r="19" className="ring-bg" />
          <circle cx="22" cy="22" r="19" className="ring-fg" strokeDasharray={`${ratio * 119.4} 119.4`} />
        </svg>
        <b>
          {good}
          <small>/{total}</small>
        </b>
      </div>
      <p className="end-kicker">{title}</p>
      <h2>{mood}</h2>
      {lines.length > 0 && (
        <ul className="end-lines">
          {lines.map((l) => (
            <li key={l.text} className={l.tone ?? ''}>
              {l.icon}
              {l.text}
            </li>
          ))}
        </ul>
      )}
      {groups
        .filter((g) => g.cards.length)
        .map((g) => (
          <section key={g.title} className="end-cards">
            <h3>{g.title}</h3>
            <div className="end-card-row">
              {g.cards.map((c) => (
                <GameCard key={c.id} card={c} width="var(--ew)" />
              ))}
            </div>
          </section>
        ))}
      {/* Les boutons restent toujours visibles, en bas de l'écran, même avec beaucoup de cartes au-dessus. */}
      <div className="end-bar">
        <div className="end-actions">{children}</div>
      </div>
    </div>
  )
}

export const plural = (n: number, word: string, suffix = '') =>
  `${n} ${word}${n > 1 ? 's' : ''}${suffix ? ` ${suffix}${n > 1 ? 's' : ''}` : ''}`
