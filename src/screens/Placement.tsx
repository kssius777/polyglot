import { AlphabetToggle } from '../components/Alphabet'
import { useMemo, useState } from 'react'
import { GameCard } from '../components/GameCard'
import { QuestionView } from '../components/QuestionView'
import { RARITIES } from '../game/cards'
import { makeQuestion, placementCards, placementLevel, type PlacementResult } from '../game/rules'

export function Placement({ onDone }: { onDone: (results: PlacementResult[]) => void }) {
  const questions = useMemo(() => placementCards(Math.random).map((c) => makeQuestion(c, 'ar-fr', Math.random)), [])
  const [i, setI] = useState(0)
  const [results, setResults] = useState<PlacementResult[]>([])
  const finished = results.length === questions.length && i >= questions.length

  if (finished) {
    const level = placementLevel(results)
    const won = results.filter((r) => r.correct)
    return (
      <div className="screen center placement-end">
        <h2>Test terminé !</h2>
        <p>
          {won.length} bonne{won.length > 1 ? 's' : ''} réponse{won.length > 1 ? 's' : ''} sur {results.length}. Ton niveau :{' '}
          <b style={{ color: RARITIES[level].color }}>
            {RARITIES[level].symbol} {RARITIES[level].name}
          </b>
        </p>
        {won.length > 0 && (
          <>
            <p>Les cartes que tu as reconnues sont à toi :</p>
            <div className="card-row">
              {won.map((r) => (
                <GameCard key={r.card.id} card={r.card} copies={1} width="120px" />
              ))}
            </div>
          </>
        )}
        <p>Tu reçois aussi 3 boosters pour démarrer ta collection.</p>
        <div className="end-bar">
          <div className="end-actions">
            <button className="btn primary big" onClick={() => onDone(results)}>
              C'est parti !
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[i]
  return (
    <div className="screen quiz-screen">
      <Progress value={i} max={questions.length} label="Test de niveau" />
      <QuestionView
        key={q.card.id}
        question={q}
        onAnswer={(correct) => setResults((r) => [...r, { card: q.card, correct }])}
        feedback={!results[i]?.correct && <p>Ce n'est pas grave, c'est juste pour trouver ton niveau.</p>}
        onNext={() => setI(i + 1)}
        nextLabel={i + 1 === questions.length ? 'Voir mon niveau' : 'Suivante'}
      />
    </div>
  )
}

export function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="progress">
      <span className="progress-label">{label}</span>
      <div className="bar">
        <div style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span>
        {value}/{max}
      </span>
      <AlphabetToggle />
    </div>
  )
}
