import { useState } from 'react'
import { ACTIVE_LANGS, LANG, LANGS, switchLang, TEXT_ATTRS, type LangId } from '../game/lang'
import { CARDS } from '../game/cards'
import { applyPlacement, START_BOOSTERS, type PlacementResult, type Save } from '../game/rules'
import { GOALS } from '../game/storage'
import { Placement } from './Placement'

type Step = 'lang' | 'reason' | 'goal' | 'level' | 'test'

const STEP_KEY = 'polyglot-onboarding-step'

/** Après un changement de langue, la page se recharge : on reprend l'accueil là où on l'avait laissé. */
function savedStep(): Step | null {
  try {
    const s = sessionStorage.getItem(STEP_KEY)
    sessionStorage.removeItem(STEP_KEY)
    return s === 'reason' ? 'reason' : null
  } catch {
    return null
  }
}

const REASONS: Record<LangId | 'all', [id: string, icon: string, label: string][]> = {
  all: [
    ['voyage', '✈️', 'Voyager'],
    ['culture', '🎬', 'Films, musique, culture'],
    ['proches', '👪', 'Parler avec mes proches'],
    ['travail', '💼', 'Pour le travail'],
    ['etudes', '🎓', 'Pour mes études'],
    ['cerveau', '🧠', 'Faire travailler ma tête'],
  ],
  ar: [['religion', '🕌', 'Comprendre les textes religieux']],
  ru: [['litterature', '📚', 'Lire les classiques russes']],
  ka: [['racines', '🍇', 'Mes racines géorgiennes']],
  zh: [['caracteres', '🖌️', 'La beauté des caractères']],
}

const GOAL_INFO: Record<number, [label: string, time: string]> = {
  10: ['Tranquille', '5 min par jour'],
  20: ['Régulier', '10 min par jour'],
  30: ['Sérieux', '15 min par jour'],
  50: ['Intense', '25 min par jour'],
}

interface Props {
  save: Save
  /** Une partie existe déjà dans une autre langue : on saute l'accueil et le choix de langue. */
  returning: boolean
  onDone: (save: Save) => void
  onAccount: () => void
  onLanding: () => void
}

/** L'accueil des nouveaux : la langue, la motivation, l'objectif du jour, le niveau, puis un premier booster. */
export function Onboarding({ save, returning, onDone, onAccount, onLanding }: Props) {
  const [step, setStep] = useState<Step>(() => savedStep() ?? (returning ? 'reason' : 'lang'))
  const [reason, setReason] = useState('')
  const [goal, setGoal] = useState(20)

  const order: Step[] = ['lang', 'reason', 'goal', 'level']
  const progress = (order.indexOf(step === 'test' ? 'level' : step) + 1) / order.length

  function back() {
    const i = order.indexOf(step === 'test' ? 'level' : step)
    if (step === 'test') return setStep('level')
    if (i > 0 && !(returning && step === 'reason')) setStep(order[i - 1])
  }

  function pickLang(id: LangId) {
    if (id === LANG.id) return setStep('reason')
    try {
      sessionStorage.setItem(STEP_KEY, 'reason')
    } catch {
      // Ignoré : on repartira de l'accueil.
    }
    switchLang(id)
  }

  function finish(level: Save['level'], results: PlacementResult[] = []) {
    const base: Save = {
      ...save,
      goal,
      reason,
      boosters: save.boosters + START_BOOSTERS,
    }
    onDone(
      results.length
        ? {
            ...applyPlacement(base, results, Date.now()),
            boosters: base.boosters,
          }
        : { ...base, level },
    )
  }

  if (step === 'test') return <Placement onDone={(results) => finish(1, results)} />

  return (
    <div className="screen onb">
      <header className="onb-top">
        <button
          className="onb-back"
          onClick={back}
          aria-label="Retour"
          disabled={step === 'lang' || (returning && step === 'reason')}
        >
          ←
        </button>
        <div className="bar onb-bar">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      {step === 'lang' && (
        <Ask text="Salut ! Quelle langue veux-tu apprendre ?">
          <div className="onb-grid">
            {ACTIVE_LANGS.map((id) => LANGS[id]).map((l) => (
              <button key={l.id} className={`onb-option big ${l.id === LANG.id ? 'on' : ''}`} onClick={() => pickLang(l.id)}>
                <span className="onb-flag">{l.flag}</span>
                <b>{l.name}</b>
                <small lang={l.id} dir={l.dir}>
                  {l.native}
                </small>
              </button>
            ))}
          </div>
          <p className="onb-lead">Ouvre des boosters, gagne des cartes en les comprenant, garde-les en les révisant.</p>
          <div className="onb-links">
            <button className="btn ghost" onClick={onAccount}>
              J'ai déjà un compte
            </button>
            <button className="btn ghost" onClick={onLanding}>
              Découvrir Polyglot
            </button>
          </div>
        </Ask>
      )}

      {step === 'reason' && (
        <Ask text={`Pourquoi apprends-tu ${LANG.the} ?`}>
          <div className="onb-list">
            {[...REASONS.all.slice(0, 2), ...REASONS[LANG.id], ...REASONS.all.slice(2)].map(([id, icon, label]) => (
              <button key={id} className={`onb-option ${reason === id ? 'on' : ''}`} onClick={() => setReason(id)}>
                <span className="onb-icon">{icon}</span>
                <b>{label}</b>
              </button>
            ))}
          </div>
          <button className="btn primary big onb-next" disabled={!reason} onClick={() => setStep('goal')}>
            Continuer
          </button>
        </Ask>
      )}

      {step === 'goal' && (
        <Ask text="Quel est ton objectif du jour ?">
          <div className="onb-list">
            {GOALS.map((g) => (
              <button key={g} className={`onb-option row ${goal === g ? 'on' : ''}`} onClick={() => setGoal(g)}>
                <b>{GOAL_INFO[g][0]}</b>
                <span>
                  {g} réponses · {GOAL_INFO[g][1]}
                </span>
              </button>
            ))}
          </div>
          <p className="onb-hint">Tu pourras le changer quand tu veux.</p>
          <button className="btn primary big onb-next" onClick={() => setStep('level')}>
            Continuer
          </button>
        </Ask>
      )}

      {step === 'level' && (
        <Ask text={`Tu connais déjà un peu ${LANG.the} ?`}>
          <div className="onb-list">
            <button className="onb-option" onClick={() => finish(1)}>
              <span className="onb-icon">🌱</span>
              <span className="onb-two">
                <b>Je pars de zéro</b>
                <small>On commence par les mots les plus utiles.</small>
              </span>
            </button>
            <button className="onb-option" onClick={() => setStep('test')}>
              <span className="onb-icon">🎯</span>
              <span className="onb-two">
                <b>Je connais quelques bases</b>
                <small>Un petit test de 12 cartes pour trouver ton niveau.</small>
              </span>
            </button>
          </div>
          <p className="onb-hint">
            Ensuite, ton premier booster s'ouvre : 10 cartes parmi {CARDS.length.toLocaleString('fr-FR')}{' '}
            <span {...TEXT_ATTRS}>{LANG.glyph}</span>
          </p>
        </Ask>
      )}
    </div>
  )
}

/** La mascotte pose la question dans une bulle. */
function Ask({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <section className="onb-step">
      <div className="onb-ask">
        <span className="onb-mascot" aria-hidden>
          🦊
        </span>
        <p className="onb-bubble">{text}</p>
      </div>
      {children}
    </section>
  )
}
