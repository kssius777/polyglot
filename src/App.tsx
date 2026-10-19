import {
  BookOpen,
  ChartColumn,
  Coins,
  HeartCrack,
  Landmark,
  Languages,
  LibraryBig,
  MessagesSquare,
  PackageOpen,
  Sparkles,
  Trophy,
  UserRound,
} from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GameCard } from './components/GameCard'
import { CARDS, RARITIES, type Card, type Rarity } from './game/cards'
import { FIGURE_BOOSTER_PRICE, FIGURES } from './game/figures'
import {
  applyPlacement,
  cardsToWork,
  dueCount,
  REVIEW_SIZE,
  hasWon,
  levelGoal,
  levelUp,
  maxLevel,
  todayAnswers,
  weekXp,
  newSave,
  rescue,
  stats,
  type Save,
  START_BOOSTERS,
} from './game/rules'
import { clearSave, loadSave, playedOtherLang, requestPersistence, storeSave } from './game/storage'
import { cachedProfile, fetchProfile, getSession, markChanged, pull, push, pushScore, readSessionFromUrl } from './game/cloud'
import { Onboarding } from './screens/Onboarding'
import { SignupScreen } from './screens/SignupScreen'
import { LeaderboardScreen } from './screens/LeaderboardScreen'
import { BackupScreen } from './screens/BackupScreen'
import { StatsScreen } from './screens/StatsScreen'
import { Binder } from './screens/Binder'
import { BoosterScreen } from './screens/BoosterScreen'
import { Landing } from './screens/Landing'
import { LangPicker } from './components/LangPicker'
import { LANG, LANG_PAUSED, TEXT_ATTRS } from './game/lang'
import { Placement } from './screens/Placement'
import { FiguresScreen } from './screens/FiguresScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { DialoguesScreen } from './screens/DialoguesScreen'
import { HAS_DIALOGUES } from './game/dialogues'

type Screen =
  | 'placement'
  | 'signup'
  | 'board'
  | 'home'
  | 'booster'
  | 'review'
  | 'binder'
  | 'rules'
  | 'figures'
  | 'landing'
  | 'backup'
  | 'stats'
  | 'dialogues'

export default function App() {
  const [save, setSaveState] = useState<Save>(() => rescue(loadSave()))
  const saveRef = useRef(save)
  saveRef.current = save
  const [screen, setScreen] = useState<Screen>('home')
  const [levelMsg, setLevelMsg] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [signupPending, setSignupPending] = useState(false)
  const [profile, setProfile] = useState(cachedProfile)
  const [reviewRound, setReviewRound] = useState(0)
  const [focus, setFocus] = useState<Card[] | null>(null)

  // Partie modifiée ici et pas encore envoyée sur le compte.
  const dirty = useRef(false)

  function setSave(next: Save) {
    markChanged()
    dirty.current = true
    const leveled = levelUp(rescue(next))
    if (leveled.level !== next.level && leveled.level) {
      setLevelMsg(`Niveau supérieur ! Les cartes ${RARITIES[leveled.level].name} arrivent dans tes boosters.`)
    }
    setSaveState(leveled)
  }

  useEffect(() => {
    storeSave(save)
    if (!dirty.current || !getSession()) return
    // On regroupe les envois : une seconde et demie après la dernière réponse.
    const t = setTimeout(() => {
      dirty.current = false
      push(save).catch(() => {
        dirty.current = true
      })
      pushScore(save).catch(() => {})
    }, 1500)
    return () => clearTimeout(t)
  }, [save])

  // Compte : au retour du lien de connexion, au démarrage et quand on revient sur l'onglet, on récupère la partie du compte.
  useEffect(() => {
    readSessionFromUrl()
    const sync = () => {
      if (!getSession() || dirty.current) return
      pull(saveRef.current)
        .then((remote) => remote && setSaveState(remote))
        .catch(() => {})
    }
    sync()
    // Profil public (pseudo, avatar) : créé ici au retour du lien si on l'avait choisi avant de se connecter.
    if (getSession())
      fetchProfile()
        .then((p) => {
          setProfile(p)
          if (p) pushScore(saveRef.current).catch(() => {})
        })
        .catch(() => {})
    const onVisible = () => document.visibilityState === 'visible' && sync()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
  useEffect(() => {
    requestPersistence()
  }, [])
  // Accolades obligatoires : dans les navigateurs récents scrollTo renvoie une promesse, que React prendrait pour une fonction de nettoyage.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  const home = () => {
    setFocus(null)
    setScreen('home')
  }

  if (!save.level) {
    if (screen === 'landing') return <Landing onStart={home} />
    if (screen === 'backup')
      return <BackupScreen save={save} onRestore={(s) => (setSave(s), home())} onCloud={(s) => setSaveState(s)} onExit={home} />
    return (
      <Onboarding
        save={save}
        returning={playedOtherLang() && !LANG_PAUSED}
        onLanding={() => setScreen('landing')}
        onAccount={() => setScreen('backup')}
        onDone={(s) => {
          setSave(s)
          if (!getSession()) setSignupPending(true)
          setScreen('booster')
        }}
      />
    )
  }
  if (screen === 'signup') return <SignupScreen onExit={home} />
  if (screen === 'board')
    return <LeaderboardScreen save={save} onExit={home} onAccount={() => setScreen(getSession() ? 'backup' : 'signup')} />
  if (screen === 'placement')
    return (
      <Placement
        onDone={(results) => {
          // Le test ne redonne pas de boosters : on garde ceux de départ.
          setSave({
            ...applyPlacement(save, results, Date.now()),
            boosters: save.boosters,
          })
          setScreen('home')
        }}
      />
    )
  if (screen === 'booster')
    return (
      <BoosterScreen
        save={save}
        setSave={setSave}
        onExit={() => {
          // Fin de l'accueil des nouveaux : après le premier booster, on propose de créer son profil.
          if (signupPending && !getSession()) {
            setSignupPending(false)
            setScreen('signup')
          } else home()
        }}
      />
    )
  if (screen === 'review')
    return (
      <ReviewScreen
        key={reviewRound}
        save={save}
        setSave={setSave}
        onExit={focus ? () => setScreen('stats') : home}
        onAgain={() => {
          if (focus) {
            const next = cardsToWork(save)
              .slice(0, REVIEW_SIZE)
              .map((w) => w.card)
            if (!next.length) return setScreen('stats')
            setFocus(next)
          }
          setReviewRound((n) => n + 1)
        }}
        cards={focus ?? undefined}
      />
    )
  if (screen === 'dialogues') return <DialoguesScreen save={save} setSave={setSave} onExit={home} />
  if (screen === 'binder') return <Binder save={save} onExit={home} />
  if (screen === 'rules') return <Rules onExit={home} />
  if (screen === 'landing') return <Landing returning onStart={home} />
  if (screen === 'stats')
    return (
      <StatsScreen
        save={save}
        onExit={home}
        onWork={(cards) => {
          setFocus(cards)
          setReviewRound((n) => n + 1)
          setScreen('review')
        }}
      />
    )
  if (screen === 'backup')
    return (
      <BackupScreen
        save={save}
        onRestore={(s) => {
          setSave(s)
          home()
        }}
        onCloud={(s) => setSaveState(s)}
        onExit={home}
      />
    )
  if (screen === 'figures') return <FiguresScreen save={save} setSave={setSave} onExit={home} />

  const s = stats(save)
  const due = dueCount(save, Date.now())
  const level = RARITIES[save.level]
  const next = save.level < maxLevel() ? RARITIES[(save.level + 1) as Rarity] : null
  const { tier, goal: tierGoal } = levelGoal(save.level)
  const tierOwned = tier.filter((c) => save.owned[c.id]).length
  const toWork = cardsToWork(save).length
  const showcase = CARDS.filter((c) => save.owned[c.id]).slice(-5)
  const today = todayAnswers(save, Date.now())

  return (
    <div className="screen center home">
      <header className="appbar">
        <span className="brand">
          Polyglot <span {...TEXT_ATTRS}>{LANG.brand}</span>
        </span>
        <span className="appbar-right">
          <LangPicker />
          <span className="appbar-coins" title="Pièces">
            <Coins size={16} aria-hidden /> {fr(save.coins)}
          </span>
          <button
            className="appbar-avatar"
            onClick={() => setScreen('backup')}
            aria-label="Mon compte"
            title={profile?.pseudo ?? 'Mon compte'}
          >
            {profile?.avatar ?? <UserRound size={18} aria-hidden />}
          </button>
        </span>
      </header>
      <section className="hero">
        <div className="hero-glow" aria-hidden />
        <div className="hero-main">
          <p className="hero-kicker">
            Niveau {level.name} · {level.desc}
          </p>
          <h1>
            {s.owned === 0 ? (
              'Ta collection t’attend'
            ) : due > 0 ? (
              <>
                <span className="hero-num">{fr(due)}</span> carte{due > 1 ? 's' : ''} à réviser
              </>
            ) : (
              'Tout est révisé'
            )}
          </h1>
          <p className="hero-sub">
            {s.owned === 0
              ? 'Ouvre un booster pour gagner tes premières cartes.'
              : due > 0
                ? 'Revois-les maintenant pour ne pas les perdre.'
                : 'Ouvre un booster pour gagner de nouvelles cartes.'}
          </p>
          <div className="hero-actions">
            {due > 0 ? (
              <>
                <button className="hero-cta action-review" onClick={() => setScreen('review')}>
                  <BookOpen size={20} aria-hidden /> Réviser
                </button>
                <button className="hero-alt action-booster" onClick={() => setScreen('booster')}>
                  <span className="hero-foil" aria-hidden /> Ouvrir un booster
                </button>
              </>
            ) : (
              <>
                <button className="hero-cta action-booster" onClick={() => setScreen('booster')}>
                  <span className="hero-foil" aria-hidden /> Ouvrir un booster
                </button>
                {s.owned > 0 && (
                  <button className="hero-alt action-review" onClick={() => setScreen('review')}>
                    <BookOpen size={18} aria-hidden /> Réviser quand même
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="hero-goal" title="Objectif du jour">
          <svg viewBox="0 0 44 44" aria-hidden>
            <circle cx="22" cy="22" r="19" className="ring-bg" />
            <circle
              cx="22"
              cy="22"
              r="19"
              className="ring-fg"
              strokeDasharray={`${Math.min(1, today / save.goal) * 119.4} 119.4`}
            />
          </svg>
          <b>
            {Math.min(today, save.goal)}
            <small>/{save.goal}</small>
          </b>
          <span>{today >= save.goal ? 'Objectif atteint' : 'Objectif du jour'}</span>
        </div>
      </section>

      {s.owned === 0 && (
        <button className="banner placement-offer" onClick={() => setScreen('placement')}>
          Tu connais déjà un peu {LANG.the} ? <b>Fais le test de niveau</b> pour commencer au bon niveau.
        </button>
      )}
      {hasWon(save) && <div className="banner">🏆 Collection complète et brillante ! Tu as gagné.</div>}
      {levelMsg && (
        <div className="banner" onClick={() => setLevelMsg(null)}>
          ⬆️ {levelMsg}
        </div>
      )}

      {showcase.length > 0 && (
        <section className="showcase" onClick={() => setScreen('binder')} aria-label="Tes dernières cartes">
          {showcase.map((c, k) => (
            <div key={c.id} className="showcase-card" style={{ '--k': k - (showcase.length - 1) / 2 } as CSSProperties}>
              <GameCard card={c} copies={save.owned[c.id].copies} width="var(--sw)" />
            </div>
          ))}
        </section>
      )}

      <p className="home-line">
        {fr(s.owned)} carte{s.owned > 1 ? 's' : ''} · {fr(s.brillant)} brillante{s.brillant > 1 ? 's' : ''}
        {next && (
          <>
            {' '}
            · {tierOwned}/{tierGoal} vers {next.name}
          </>
        )}
      </p>

      <nav className="dock">
        <button className="dock-item tile-binder" onClick={() => setScreen('binder')}>
          <LibraryBig size={20} aria-hidden />
          <span>Classeur</span>
        </button>
        {HAS_DIALOGUES && (
          <button className="dock-item tile-dialogues" onClick={() => setScreen('dialogues')}>
            <MessagesSquare size={20} aria-hidden />
            <span>Dialogues</span>
          </button>
        )}
        <button className="dock-item tile-board" onClick={() => setScreen('board')}>
          <Trophy size={20} aria-hidden />
          <span>Classement</span>
        </button>
        <button className="dock-item tile-stats" onClick={() => setScreen('stats')}>
          <ChartColumn size={20} aria-hidden />
          <span>Progrès</span>
        </button>
        {LANG.figures && (
          <button className="dock-item tile-figures" onClick={() => setScreen('figures')}>
            <Landmark size={20} aria-hidden />
            <span>Personnages</span>
          </button>
        )}
      </nav>

      <div className="foot-links">
        <button className="btn ghost small" onClick={() => setScreen('landing')}>
          Présentation
        </button>
        <button className="btn ghost small" onClick={() => setScreen('rules')}>
          Règles
        </button>
        {confirmReset ? (
          <>
            <span className="muted">Tout effacer ?</span>
            <button
              className="btn ghost small danger"
              onClick={() => {
                clearSave()
                setSaveState(newSave())
                setConfirmReset(false)
              }}
            >
              Oui, recommencer
            </button>
            <button className="btn ghost small" onClick={() => setConfirmReset(false)}>
              Annuler
            </button>
          </>
        ) : (
          <button className="btn ghost small" onClick={() => setConfirmReset(true)}>
            Recommencer
          </button>
        )}
      </div>
    </div>
  )
}

const fr = (n: number) => n.toLocaleString('fr-FR')

function Rules({ onExit }: { onExit: () => void }) {
  return (
    <div className="screen rules">
      <button className="btn ghost small" onClick={onExit}>
        ← Accueil
      </button>
      <h2>Règles</h2>
      <h3 className="icon-title">
        <PackageOpen size={18} aria-hidden /> Boosters
      </h3>
      <p>Chaque booster contient 10 cartes face cachée. Trouve ce que veut dire une carte pour la gagner.</p>
      <h3 className="icon-title">
        <BookOpen size={18} aria-hidden /> Révisions
      </h3>
      <p>
        Une séance tire 15 cartes de ton classeur, en priorité celles à revoir. Réviser une carte en avance entraîne ta mémoire
        mais ne la fait pas progresser : seules les réponses au bon moment comptent. Plus tu connais une carte, plus la question
        est dure : d'abord {LANG.name.toLowerCase()} → français, puis français → {LANG.name.toLowerCase()}, puis avec des choix
        qui se ressemblent. La translittération n'apparaît qu'avec la réponse.
      </p>
      <p>
        3 bonnes réponses espacées dans le temps te donnent un exemplaire de plus. Les boosters sont illimités pour l'instant.
      </p>
      {LANG.figures && (
        <>
          <h3 className="icon-title">
            <Coins size={18} aria-hidden /> Dinars et personnages
          </h3>
          <p>
            Chaque bonne réponse rapporte 10 dinars. Avec 150 dinars, tu ouvres un booster de 5 personnages : figures, lieux et
            événements du monde musulman et abrahamique, en 5 raretés (bronze, argent, or, platine, légendaire). Par respect, les
            prophètes et les compagnons ne sont jamais représentés : leur nom est calligraphié.
          </p>
        </>
      )}
      <h3 className="icon-title">
        <HeartCrack size={18} aria-hidden /> Punition
      </h3>
      <p>
        Si tu oublies une carte que tu possèdes, tu perds un exemplaire. La première fois que tu rates une carte jamais vue, pas
        de punition : regarde bien la réponse. Ensuite, si tu rates une carte que tu ne possèdes pas, tu perds un exemplaire d'une
        autre carte au hasard. Une carte ratée ou perdue revient dans tes prochains boosters (jusqu'à 3 par booster), pour que tu
        puisses la retenter.
      </p>
      <h3 className="icon-title">
        <Sparkles size={18} aria-hidden /> Brillance et victoire
      </h3>
      <p>À 3 exemplaires, une carte devient brillante. Le but : toute la collection en brillant !</p>
      <h3 className="icon-title">
        <Languages size={18} aria-hidden /> Translittération
      </h3>
      <p>{LANG.translitHelp}</p>
    </div>
  )
}
