import { useEffect, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'

interface Props {
  tone: 'good' | 'bad'
  /** La bonne réponse, montrée quand on s'est trompé. */
  answer?: ReactNode
  detail?: ReactNode
  onNext: () => void
  nextLabel: string
}

const TITLES = { good: 'Bonne réponse !', bad: 'Mauvaise réponse' }

/** Bandeau du bas après une réponse : vert ou rouge sur toute la largeur, avec le bouton pour continuer. */
export function Verdict({ tone, answer, detail, onNext, nextLabel }: Props) {
  // Sur ordinateur, Entrée ou Espace passe à la suite.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onNext])

  return (
    <div className={`verdict ${tone}`} role="status">
      <div className="verdict-inner">
        <span className="verdict-icon" aria-hidden>
          {tone === 'good' ? <Check size={26} strokeWidth={3} /> : <X size={26} strokeWidth={3} />}
        </span>
        <div className="verdict-text">
          <b>{TITLES[tone]}</b>
          {answer && <span className="verdict-answer">La bonne réponse : {answer}</span>}
          {detail && <div className="verdict-detail">{detail}</div>}
        </div>
        <button className="verdict-next" onClick={onNext} autoFocus>
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
