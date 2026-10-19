import { GameCard } from '../components/GameCard'
import { FigureCard } from '../components/FigureCard'
import { CARD_BY_ID, CARDS, RARITIES, THEMES, type Rarity } from '../game/cards'
import { FIGURE_BY_ID, FIGURES } from '../game/figures'
import { ACTIVE_LANGS, LANG, LANGS, switchLang, TEXT_ATTRS, type LangId } from '../game/lang'
import { LangPicker } from '../components/LangPicker'

interface Props {
  onStart: () => void
  /** Joueur déjà inscrit : le bouton ramène à son accueil au lieu du test. */
  returning?: boolean
}

const fmt = (n: number) => n.toLocaleString('fr-FR')

// Trois cartes d'exemple : des classiques en arabe, sinon les premières cartes A1 de la langue.
const SAMPLE_CARDS = (
  LANG.id === 'ar'
    ? ['c001', 'c156', 'c004'].map((id) => CARD_BY_ID.get(id)).filter((c) => !!c)
    : CARDS.filter((c) => c.rarity === 1 && c.ar.length < 14).filter((_, i) => i % 7 === 0)
).slice(0, 3)
const SAMPLE_FIGURES = ['p0011', 'p0300', 'p0500'].map((id) => FIGURE_BY_ID.get(id)).filter((f) => !!f)

const STEPS = [
  {
    n: 'I',
    title: 'Le test de niveau',
    text: 'Douze cartes, de la plus simple à la plus exigeante. Ton niveau, de A1 à C1, décide des cartes qui t’attendent.',
  },
  {
    n: 'II',
    title: 'Les boosters',
    text: 'Dix cartes par paquet. Pour en garder une, il faut savoir ce qu’elle veut dire. Sinon, elle repart.',
  },
  {
    n: 'III',
    title: 'La révision',
    text: 'Tes cartes reviennent au bon moment, de plus en plus difficiles. Oublie-les, et tu en perds un exemplaire.',
  },
]

export function Landing({ onStart, returning }: Props) {
  const cta = returning ? 'Retour à ma collection' : 'Faire le test de niveau'
  return (
    <div className="landing">
      <nav className="lnav">
        <span className="brand">
          Polyglot <span {...TEXT_ATTRS}>{LANG.brand}</span>
        </span>
        <span className="lnav-right">
          <LangPicker />
          <button className="btn primary small" onClick={onStart}>
            {returning ? 'Ma collection' : 'Commencer'}
          </button>
        </span>
      </nav>

      <header className="lhero">
        <div className="lhero-text">
          <p className="eyebrow">{LANG.eyebrow}</p>
          <h1>
            Apprends {LANG.the},
            <br />
            <em>une carte à la fois.</em>
          </h1>
          <p className="lead">
            {fmt(CARDS.length)} mots et phrases {LANG.script} à collectionner. Chaque carte se mérite : il faut la comprendre pour
            la garder, et la retenir pour ne pas la perdre.
          </p>
          <div className="lhero-cta">
            <button className="btn primary big" onClick={onStart}>
              {cta}
            </button>
            <a className="btn ghost big" href="#comment">
              Comment ça marche
            </a>
          </div>
          <div className="lhero-langs">
            {ACTIVE_LANGS.map((id) => (
              <button key={id} className={`chip ${id === LANG.id ? 'on' : ''}`} onClick={() => id !== LANG.id && switchLang(id)}>
                {LANGS[id].flag} {LANGS[id].name}
              </button>
            ))}
          </div>
        </div>
        <div className="lhero-cards" aria-hidden="true">
          {SAMPLE_CARDS.map((c, i) => (
            <div key={c.id} className={`lhero-card k${i}`}>
              <GameCard card={c} width="100%" />
            </div>
          ))}
        </div>
      </header>

      <section className="lfacts">
        <div>
          <b>{fmt(CARDS.length)}</b>
          <span>cartes de vocabulaire</span>
        </div>
        {LANG.figures && (
          <div>
            <b>{fmt(FIGURES.length)}</b>
            <span>personnages et lieux</span>
          </div>
        )}
        <div>
          <b>5</b>
          <span>niveaux du CECRL</span>
        </div>
        <div>
          <b>{Object.keys(THEMES).length}</b>
          <span>thèmes du quotidien</span>
        </div>
      </section>

      <section className="lsection" id="comment">
        <p className="eyebrow">La méthode</p>
        <h2>Trois gestes, répétés chaque jour.</h2>
        <div className="lsteps">
          {STEPS.map((s) => (
            <article key={s.n}>
              <span className="lstep-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </article>
          ))}
        </div>
      </section>

      {LANG.figures && (
        <section className="lsection lsplit">
          <div>
            <p className="eyebrow">Collection Personnages</p>
            <h2>Mille figures de l’histoire, à gagner en dinars.</h2>
            <p className="lead">
              Chaque bonne réponse rapporte des dinars. Ils ouvrent des paquets de savants, poètes, califes, lieux saints et
              grands événements, avec leur nom calligraphié et leur histoire en arabe. Par respect, les prophètes et les
              compagnons ne sont jamais représentés.
            </p>
          </div>
          <div className="lfig-cards" aria-hidden="true">
            {SAMPLE_FIGURES.map((f, i) => (
              <div key={f.id} className={`lfig k${i}`}>
                <FigureCard figure={f} width="100%" />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="lsection">
        <p className="eyebrow">Les niveaux</p>
        <h2>De tes premiers mots aux textes de presse.</h2>
        <div className="llevels">
          {([1, 2, 3, 4, 5] as Rarity[]).map((r) => (
            <div key={r} style={{ borderColor: RARITIES[r].color }}>
              <b style={{ color: RARITIES[r].color }}>{RARITIES[r].name}</b>
              <span>{RARITIES[r].desc}</span>
              <small>{fmt(CARDS.filter((c) => c.rarity === r).length)} cartes</small>
            </div>
          ))}
        </div>
      </section>

      <section className="lfinal">
        <p {...TEXT_ATTRS} className="lfinal-ar" title={LANG.mottoFr}>
          {LANG.motto}
        </p>
        <p className="muted lfinal-fr">« {LANG.mottoFr} »</p>
        <h2>Prêt pour ta première carte ?</h2>
        <button className="btn primary big" onClick={onStart}>
          {cta}
        </button>
      </section>

      <footer className="lfoot">
        <span>Polyglot</span>
        <span>
          {LANG.figures
            ? 'Arabe littéraire (fuṣḥā) · photos des personnages : Wikipédia et Wikimedia Commons'
            : `${LANG.name} · ${LANG.native}`}
        </span>
      </footer>
    </div>
  )
}
