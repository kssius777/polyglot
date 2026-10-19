import { useEffect, type ReactNode } from 'react'
import { Check, Sparkles, X } from 'lucide-react'

interface Props {
  tone: 'good' | 'bad' | 'new'
  /** La bonne réponse, montrée quand on s'est trompé. */
  answer?: ReactNode
  detail?: ReactNode
  onNext: () => void
  nextLabel: string
}

const TITLES = { good: 'Bonne réponse !', bad: 'Pas tout à fait', new: 'Nouvelle carte' }

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
          {tone === 'good' ? (
            <Check size={26} strokeWidth={3} />
          ) : tone === 'bad' ? (
            <X size={26} strokeWidth={3} />
          ) : (
            <Sparkles size={24} />
          )}
        </span>
        <div className="verdict-text">
          <b>{TITLES[tone]}</b>
          {answer && <span className="verdict-answer">Réponse : {answer}</span>}
          {detail && <div className="verdict-detail">{detail}</div>}
        </div>
        <button className="verdict-next" onClick={onNext} autoFocus>
          {nextLabel}
        </button>
      </div>
    </div>
  )
}
