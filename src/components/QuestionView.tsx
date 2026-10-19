import { useEffect, useState, type ReactNode } from 'react'
import { Check, Sparkles, X } from 'lucide-react'
import type { Card } from '../game/cards'
import type { Question } from '../game/rules'
import { GameCard, type Face } from './GameCard'
import { LANG, TEXT_ATTRS } from '../game/lang'
import { TargetText } from './TargetText'
import { Alphabet } from './Alphabet'

interface Props {
  question: Question
  copies?: number
  /** Appelé une seule fois quand on choisit une réponse. */
  onAnswer: (correct: boolean) => void
  /** Message affiché après la réponse (gain ou punition). */
  feedback?: ReactNode
  glow?: 'win' | 'lose' | null
  onNext: () => void
  nextLabel?: string
}

const PROMPTS = {
  'ar-fr': 'Que veut dire cette carte ?',
  'ar-fr-nt': 'Que veut dire cette carte ? (difficile)',
  'fr-ar': `Comment dit-on ${LANG.inLang} ?`,
  'fr-ar-nt': `Comment dit-on ${LANG.inLang} ? (difficile)`,
}

// La carte rétrécit sur les petits écrans pour que les réponses et le bouton « Suivante » tiennent sans défiler.
const CARD_WIDTH = 'max(150px, min(72vw, 300px, calc((100dvh - 380px) * 0.716)))'

export function QuestionView({ question, copies, onAnswer, feedback, glow, onNext, nextLabel = 'Continuer' }: Props) {
  const [chosen, setChosen] = useState<Card | null>(null)
  const { card, type, choices } = question
  const toArabic = type.startsWith('fr-ar')
  const answered = chosen !== null
  const correct = chosen?.id === card.id
  // Sans indication (test de niveau), la carte réagit simplement à la réponse.
  const reaction = glow === undefined ? (correct ? 'win' : 'lose') : glow
  const tone = correct ? 'good' : reaction === null ? 'new' : 'bad'

  // Sur ordinateur, Entrée ou Espace passe à la carte suivante.
  useEffect(() => {
    if (!answered) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answered, onNext])

  // Avant la réponse on montre le côté de la question ; après, le recto révèle tout : le mot, sa prononciation et son sens.
  const face: Face = answered || !toArabic ? 'front' : 'back'

  function choose(c: Card) {
    if (answered) return
    setChosen(c)
    onAnswer(c.id === card.id)
  }

  return (
    <div className={`question ${answered ? 'answered' : ''}`}>
      <p className="prompt">{PROMPTS[type]}</p>
      <GameCard
        card={card}
        face={face}
        translit={answered}
        copies={copies}
        glow={answered ? reaction : null}
        width={CARD_WIDTH}
      />
      <div className={`choices ${toArabic ? 'choices-ar' : ''}`}>
        {choices.map((c) => {
          const state = !answered ? '' : c.id === card.id ? 'right' : c === chosen ? 'wrong' : 'dim'
          return (
            <button key={c.id} className={`choice ${state}`} onClick={() => choose(c)} disabled={answered && state === 'dim'}>
              {toArabic ? (
                <>
                  <span className="choice-ar" {...TEXT_ATTRS}>
                    <TargetText text={c.ar} />
                  </span>
                  {answered && <span className="choice-sub">{c.translit}</span>}
                </>
              ) : (
                c.fr
              )}
            </button>
          )
        })}
      </div>
      {answered && (
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
              <b>{tone === 'good' ? 'Bonne réponse !' : tone === 'bad' ? 'Pas tout à fait' : 'Nouvelle carte'}</b>
              {!correct && (
                <span className="verdict-answer">
                  Réponse :{' '}
                  {toArabic ? (
                    <span {...TEXT_ATTRS}>
                      <TargetText text={card.ar} />
                    </span>
                  ) : (
                    card.fr
                  )}
                </span>
              )}
              {feedback && <div className="verdict-detail">{feedback}</div>}
            </div>
            <button className="verdict-next" onClick={onNext} autoFocus>
              {nextLabel}
            </button>
          </div>
        </div>
      )}
      <Alphabet />
    </div>
  )
}
