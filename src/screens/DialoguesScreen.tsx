import { useCallback, useEffect, useState } from 'react'
import { Check, ChevronRight, Coins, Languages, MessagesSquare, Zap } from 'lucide-react'
import { Alphabet, AlphabetToggle } from '../components/Alphabet'
import { SessionSummary } from '../components/SessionSummary'
import { TargetText } from '../components/TargetText'
import { Verdict } from '../components/Verdict'
import {
  DIALOGUE_LEVELS,
  dialogueQuiz,
  loadDialogues,
  type Choice,
  type Dialogue,
  type DialogueLine,
  type DialogueQuestion,
} from '../game/dialogues'
import { TEXT_ATTRS } from '../game/lang'
import { answerDialogue, COINS_PER_CORRECT, finishDialogue, XP_PER_ANSWER, type Save } from '../game/rules'
import { Progress } from './Placement'

interface Props {
  save: Save
  setSave: (s: Save) => void
  onExit: () => void
}

type Step =
  | { kind: 'list' }
  | { kind: 'read'; d: Dialogue }
  | { kind: 'quiz'; d: Dialogue }
  | { kind: 'done'; d: Dialogue; good: number; total: number }

export function DialoguesScreen({ save, setSave, onExit }: Props) {
  const [all, setAll] = useState<Dialogue[] | null>(null)
  const [step, setStep] = useState<Step>({ kind: 'list' })

  useEffect(() => {
    loadDialogues().then(setAll)
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  if (!all) return <div className="screen center muted">Chargement des dialogues…</div>

  if (step.kind === 'read')
    return <Reader d={step.d} onBack={() => setStep({ kind: 'list' })} onQuiz={() => setStep({ kind: 'quiz', d: step.d })} />

  if (step.kind === 'quiz')
    return (
      <Quiz
        d={step.d}
        all={all}
        save={save}
        setSave={setSave}
        onQuit={() => setStep({ kind: 'read', d: step.d })}
        onDone={(good, total) => setStep({ kind: 'done', d: step.d, good, total })}
      />
    )

  if (step.kind === 'done') {
    const next = all[all.indexOf(step.d) + 1]
    return (
      <SessionSummary
        title={`Dialogue terminé · ${step.d.title}`}
        good={step.good}
        total={step.total}
        lines={
          step.good
            ? [
                { icon: <Zap size={16} aria-hidden />, text: `+${step.good * XP_PER_ANSWER} XP`, tone: 'good' },
                { icon: <Coins size={16} aria-hidden />, text: `+${step.good * COINS_PER_CORRECT} pièces`, tone: 'good' },
              ]
            : []
        }
        groups={[]}
      >
        {next && (
          <button className="btn primary big" onClick={() => setStep({ kind: 'read', d: next })}>
            Dialogue suivant
          </button>
        )}
        <button className="btn ghost" onClick={() => setStep({ kind: 'read', d: step.d })}>
          Relire ce dialogue
        </button>
        <button className="btn ghost" onClick={() => setStep({ kind: 'list' })}>
          Tous les dialogues
        </button>
      </SessionSummary>
    )
  }

  const done = all.filter((d) => d.id in save.dialogues).length
  return (
    <div className="screen dl-screen">
      <div className="dl-top">
        <button className="btn ghost small" onClick={onExit}>
          ← Accueil
        </button>
        <span className="dl-count">
          {done}/{all.length} faits
        </span>
      </div>
      <header className="dl-intro">
        <span className="dl-intro-icon" aria-hidden>
          <MessagesSquare size={22} />
        </span>
        <h2>Dialogues</h2>
        <p>Des scènes du quotidien à lire, puis un petit exercice : chaque bonne réponse rapporte de l'XP et des pièces.</p>
      </header>
      {([1, 2] as const).map((level) => (
        <section key={level} className="dl-level">
          <h3>{DIALOGUE_LEVELS[level]}</h3>
          <ul className="dl-list">
            {all
              .filter((d) => d.level === level)
              .map((d) => {
                const best = save.dialogues[d.id]
                return (
                  <li key={d.id}>
                    <button
                      className={`dl-item ${best !== undefined ? 'done' : ''}`}
                      onClick={() => setStep({ kind: 'read', d })}
                    >
                      <span className="dl-item-text">
                        <span className="dl-sit">{d.situation}</span>
                        <b>{d.title}</b>
                      </span>
                      {best !== undefined ? (
                        <span className="dl-best" title="Meilleur score">
                          <Check size={14} strokeWidth={3} aria-hidden />
                          {best}/3
                        </span>
                      ) : (
                        <ChevronRight size={18} className="dl-chev" aria-hidden />
                      )}
                    </button>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Bubble({
  line,
  who,
  showFr,
  onClick,
  extra = '',
}: {
  line: DialogueLine
  who: string
  showFr: boolean
  onClick?: () => void
  extra?: string
}) {
  const body = (
    <>
      <span className="dl-who">{who}</span>
      <span className="dl-target" {...TEXT_ATTRS}>
        <TargetText text={line.ar} />
      </span>
      <span className="dl-translit">{line.translit}</span>
      {showFr ? <span className="dl-fr">{line.fr}</span> : onClick && <span className="dl-fr-hint">Traduire</span>}
    </>
  )
  return (
    <li className={`dl-line s${line.s} ${extra}`}>
      {onClick ? (
        <button className="dl-bubble" onClick={onClick} aria-expanded={showFr}>
          {body}
        </button>
      ) : (
        <div className="dl-bubble">{body}</div>
      )}
    </li>
  )
}

function Reader({ d, onBack, onQuiz }: { d: Dialogue; onBack: () => void; onQuiz: () => void }) {
  const [shown, setShown] = useState<Set<number>>(() => new Set())
  const allShown = shown.size === d.lines.length
  const toggle = (i: number) =>
    setShown((s) => {
      const n = new Set(s)
      if (n.has(i)) n.delete(i)
      else n.add(i)
      return n
    })
  return (
    <div className="screen dl-screen dl-read">
      <div className="dl-top">
        <button className="btn ghost small" onClick={onBack}>
          ← Dialogues
        </button>
        <AlphabetToggle />
      </div>
      <div className="dl-body">
        <header className="dl-head">
          <span className="dl-sit">
            {d.situation} · {DIALOGUE_LEVELS[d.level]}
          </span>
          <h2>{d.title}</h2>
          <button
            className={`chip dl-all ${allShown ? 'on' : ''}`}
            onClick={() => setShown(allShown ? new Set() : new Set(d.lines.map((_, i) => i)))}
          >
            <Languages size={15} aria-hidden />
            {allShown ? 'Masquer le français' : 'Tout traduire'}
          </button>
        </header>
        <ol className="dl-lines">
          {d.lines.map((l, i) => (
            <Bubble key={i} line={l} who={d.speakers[l.s]} showFr={shown.has(i)} onClick={() => toggle(i)} />
          ))}
        </ol>
        <button className="btn primary big dl-go" onClick={onQuiz}>
          Je m'entraîne
        </button>
        <Alphabet />
      </div>
    </div>
  )
}

function Quiz({
  d,
  all,
  save,
  setSave,
  onQuit,
  onDone,
}: {
  d: Dialogue
  all: Dialogue[]
  save: Save
  setSave: (s: Save) => void
  onQuit: () => void
  onDone: (good: number, total: number) => void
}) {
  const [questions] = useState<DialogueQuestion[]>(() => dialogueQuiz(d, all, Math.random))
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<Choice | null>(null)
  const [good, setGood] = useState(0)
  const q = questions[i]
  const correct = chosen?.key === q.answer.key
  const last = i + 1 >= questions.length

  function choose(c: Choice) {
    if (chosen) return
    setChosen(c)
    const ok = c.key === q.answer.key
    if (ok) setGood((g) => g + 1)
    setSave(answerDialogue(save, ok, Date.now()))
  }

  const next = useCallback(() => {
    if (last) {
      const total = good
      setSave(finishDialogue(save, d.id, total))
      onDone(total, questions.length)
      return
    }
    setChosen(null)
    setI((n) => n + 1)
  }, [last, good, save, setSave, d.id, onDone, questions.length])

  const before = d.lines[q.index - 1]
  const missing = q.answer.line
  return (
    <div className="screen quiz-screen dl-screen dl-quiz">
      <Progress value={i + (chosen ? 1 : 0)} max={questions.length} label={d.title} />
      <div className={`question dl-body ${chosen ? 'answered' : ''}`}>
        <p className="prompt">Que répond {d.speakers[missing.s]} ?</p>
        <ol className="dl-lines">
          <Bubble line={before} who={d.speakers[before.s]} showFr />
          {chosen ? (
            <Bubble line={missing} who={d.speakers[missing.s]} showFr extra={correct ? 'glow-win' : 'glow-lose'} />
          ) : (
            <li className={`dl-line s${missing.s}`}>
              <div className="dl-bubble dl-gap">
                <span className="dl-who">{d.speakers[missing.s]}</span>
                <span className="dl-dots" aria-label="Réplique à trouver">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </li>
          )}
        </ol>
        <div className="choices choices-ar">
          {q.choices.map((c) => {
            const state = !chosen ? '' : c.key === q.answer.key ? 'right' : c === chosen ? 'wrong' : 'dim'
            return (
              <button key={c.key} className={`choice ${state}`} onClick={() => choose(c)} disabled={!!chosen && state === 'dim'}>
                <span className="choice-ar dl-choice" {...TEXT_ATTRS}>
                  <TargetText text={c.line.ar} />
                </span>
                {chosen && <span className="choice-sub">{c.line.translit}</span>}
              </button>
            )
          })}
        </div>
        {chosen && (
          <Verdict
            tone={correct ? 'good' : 'bad'}
            detail={
              <p>{correct ? `+${XP_PER_ANSWER} XP · +${COINS_PER_CORRECT} pièces` : `Il fallait dire : « ${missing.fr} »`}</p>
            }
            onNext={next}
            nextLabel={last ? 'Terminer' : 'Suivante'}
          />
        )}
        <Alphabet />
      </div>
      <button className="btn ghost small quit" onClick={onQuit}>
        Arrêter
      </button>
    </div>
  )
}
