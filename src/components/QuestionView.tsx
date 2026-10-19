import { useState, type ReactNode } from 'react'
import type { Card } from '../game/cards'
import type { Question } from '../game/rules'
import { GameCard, type Face } from './GameCard'
import { LANG, TEXT_ATTRS } from '../game/lang'
import { TargetText } from './TargetText'
import { Alphabet } from './Alphabet'
import { Verdict } from './Verdict'

interface Props {
  question: Question
  copies?: number
  /** Appelé une seule fois quand on choisit une réponse. */
  onAnswer: (correct: boolean) => void
  /** Message affiché après la réponse (gain ou punition). */
  feedback?: ReactNode
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

export function QuestionView({ question, copies, onAnswer, feedback, onNext, nextLabel = 'Continuer' }: Props) {
  const [chosen, setChosen] = useState<Card | null>(null)
  const { card, type, choices } = question
  const toArabic = type.startsWith('fr-ar')
  const answered = chosen !== null
  const correct = chosen?.id === card.id

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
        glow={answered ? (correct ? 'win' : 'lose') : null}
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
        <Verdict
          tone={correct ? 'good' : 'bad'}
          answer={
            !correct &&
            (toArabic ? (
              <span {...TEXT_ATTRS}>
                <TargetText text={card.ar} />
              </span>
            ) : (
              card.fr
            ))
          }
          detail={feedback}
          onNext={onNext}
          nextLabel={nextLabel}
        />
      )}
      <Alphabet />
    </div>
  )
}
