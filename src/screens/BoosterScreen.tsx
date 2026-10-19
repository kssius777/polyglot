import { useState } from 'react'
import { RotateCcw, Sparkles } from 'lucide-react'
import { plural, SessionSummary } from '../components/SessionSummary'
import { BoosterPack } from '../components/BoosterPack'
import { OutcomeText } from '../components/OutcomeText'
import { QuestionView } from '../components/QuestionView'
import type { Card } from '../game/cards'
import { answerBooster, consumeBooster, makeQuestion, openBooster, type Outcome, type Question, type Save } from '../game/rules'
import { Progress } from './Placement'

interface Props {
  save: Save
  setSave: (s: Save) => void
  onExit: () => void
  /** Ouvrir le booster suivant directement depuis la fin de celui-ci. */
  onAgain?: () => void
}

type Stage = 'pack' | 'question' | 'summary'

export function BoosterScreen({ save, setSave, onExit, onAgain }: Props) {
  const [stage, setStage] = useState<Stage>('pack')
  const [opening, setOpening] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [i, setI] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [outcomes, setOutcomes] = useState<Outcome[]>([])

  function tear() {
    if (opening) return
    setOpening(true)
    const drawn = openBooster(save, Math.random)
    setSave(consumeBooster(save))
    setCards(drawn)
    setTimeout(() => show(drawn[0]), 1100)
  }

  // Chaque carte arrive directement avec sa question, sans clic pour la retourner.
  function show(card: Card) {
    setQuestion(makeQuestion(card, 'ar-fr', Math.random))
    setStage('question')
  }

  function answer(correct: boolean) {
    const r = answerBooster(save, cards[i], correct, Date.now(), Math.random)
    setSave(r.save)
    setOutcomes((o) => [...o, r.outcome])
  }

  function next() {
    if (i + 1 < cards.length) {
      setI(i + 1)
      show(cards[i + 1])
    } else setStage('summary')
  }

  if (stage === 'pack') {
    return (
      <div className="screen center pack-screen">
        <p className="pack-kicker">BOOSTER</p>
        <p className="pack-sub">10 cartes t'attendent. Pour garder une carte, trouve ce qu'elle veut dire.</p>
        <BoosterPack opening={opening} onOpen={tear} />
        <button className="btn primary big" onClick={tear} disabled={opening}>
          Ouvrir le booster
        </button>
        <button className="btn ghost" onClick={onExit}>
          Retour
        </button>
      </div>
    )
  }

  if (stage === 'summary') {
    const won = outcomes.filter((o) => o.kind === 'won').map((o) => o.card)
    const lost = outcomes.filter((o) => o.kind !== 'won').map((o) => o.card)
    return (
      <SessionSummary
        title="Booster ouvert"
        onClose={onExit}
        good={won.length}
        total={cards.length}
        lines={[
          ...(won.length
            ? [
                {
                  icon: <Sparkles size={16} aria-hidden />,
                  text: `${plural(won.length, 'carte', 'gagnée')}`,
                  tone: 'good' as const,
                },
              ]
            : []),
          ...(lost.length
            ? [
                {
                  icon: <RotateCcw size={16} aria-hidden />,
                  text: `${plural(lost.length, 'carte')} à revoir : elles reviendront dans un prochain booster`,
                },
              ]
            : []),
        ]}
        groups={[
          { title: 'Tes nouvelles cartes', cards: won },
          { title: 'À revoir', cards: lost },
        ]}
      >
        {onAgain && save.boosters > 0 ? (
          <>
            <button className="btn primary big" onClick={onAgain}>
              Ouvrir un autre booster ({save.boosters})
            </button>
            <button className="btn ghost" onClick={onExit}>
              Retour à l'accueil
            </button>
          </>
        ) : (
          <button className="btn primary big" onClick={onExit}>
            Retour à l'accueil
          </button>
        )}
      </SessionSummary>
    )
  }

  const outcome = outcomes[i] ?? null
  return (
    <div className="screen quiz-screen">
      <Progress value={i + (outcome ? 1 : 0)} max={cards.length} label="Booster" />
      {question && (
        <QuestionView
          key={question.card.id}
          question={question}
          onAnswer={answer}
          feedback={outcome && <OutcomeText outcome={outcome} />}
          onNext={next}
          nextLabel={i + 1 < cards.length ? 'Carte suivante' : 'Voir le résultat'}
        />
      )}
    </div>
  )
}
