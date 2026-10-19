import { useState } from 'react'
import { OutcomeText } from '../components/OutcomeText'
import { QuestionView } from '../components/QuestionView'
import { answerReview, finishReview, makeQuestion, questionTypeFor, reviewSession, type Outcome, type Save } from '../game/rules'
import { Progress } from './Placement'
import type { Card } from '../game/cards'
import { Copy, HeartCrack } from 'lucide-react'
import { plural, SessionSummary } from '../components/SessionSummary'

interface Props {
  save: Save
  setSave: (s: Save) => void
  onExit: () => void
  onAgain: () => void
  /** Cartes imposées (ex. les cartes à travailler) au lieu de la séance habituelle. */
  cards?: Card[]
}

export function ReviewScreen({ save, setSave, onExit, onAgain, cards }: Props) {
  const [questions] = useState(() =>
    (cards ?? reviewSession(save, Date.now(), Math.random)).map((c) =>
      makeQuestion(c, questionTypeFor(save.owned[c.id]), Math.random),
    ),
  )
  const [i, setI] = useState(0)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const done = i >= questions.length

  function answer(correct: boolean) {
    const r = answerReview(save, questions[i].card, correct, Date.now(), Math.random)
    setSave(r.save)
    setOutcomes((o) => [...o, r.outcome])
  }

  function next() {
    if (i + 1 >= questions.length) setSave(finishReview(save))
    setI(i + 1)
  }

  if (done) {
    const good = outcomes.filter((o) => o.kind === 'progress')
    const gained = good.filter((o) => o.kind === 'progress' && o.gainedCopy).length
    const lost = outcomes.length - good.length
    // Les cartes ratées, à relire tout de suite : c'est le meilleur moment pour les retenir.
    const missed = outcomes.filter((o) => o.kind !== 'progress').map((o) => o.card)
    return (
      <SessionSummary
        title="Révision terminée"
        onClose={onExit}
        good={good.length}
        total={outcomes.length}
        lines={[
          ...(gained > 0
            ? [{ icon: <Copy size={16} aria-hidden />, text: plural(gained, 'exemplaire', 'gagné'), tone: 'good' as const }]
            : []),
          ...(lost > 0
            ? [
                {
                  icon: <HeartCrack size={16} aria-hidden />,
                  text: `${plural(lost, 'carte', 'oubliée')} : un exemplaire perdu pour chacune`,
                  tone: 'bad' as const,
                },
              ]
            : []),
        ]}
        groups={[{ title: 'À retenir', cards: missed }]}
      >
        <button className="btn primary big" onClick={onAgain}>
          Nouvelle séance
        </button>
        <button className="btn ghost" onClick={onExit}>
          Retour à l'accueil
        </button>
      </SessionSummary>
    )
  }

  const q = questions[i]
  const outcome = outcomes[i] ?? null
  return (
    <div className="screen quiz-screen">
      <Progress value={i + (outcome ? 1 : 0)} max={questions.length} label={cards ? 'À travailler' : 'Révision'} />
      <QuestionView
        key={q.card.id}
        question={q}
        copies={save.owned[q.card.id]?.copies ?? 0}
        onAnswer={answer}
        feedback={outcome && <OutcomeText outcome={outcome} />}
        onNext={next}
        nextLabel={i + 1 < questions.length ? 'Suivante' : 'Terminer'}
      />
      <button className="btn ghost small quit" onClick={onExit}>
        Arrêter
      </button>
    </div>
  )
}
