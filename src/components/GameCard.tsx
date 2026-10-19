import type { CSSProperties, ReactNode } from 'react'
import { cardNumber, RARITIES, THEME_JEWEL, THEMES, type Card } from '../game/cards'
import { BRILLANT } from '../game/rules'
import { LANG, TEXT_ATTRS } from '../game/lang'
import { TargetText } from './TargetText'

export type Face = 'front' | 'back' | 'hidden'

interface Props {
  card: Card
  face?: Face
  /** Afficher la translittération au recto. */
  translit?: boolean
  copies?: number
  width?: string
  glow?: 'win' | 'lose' | null
  onClick?: () => void
}

/** Une carte façon Pokémon : recto dans la langue apprise, verso en français. */
export function GameCard({ card, face = 'front', translit = true, copies, width = '260px', glow, onClick }: Props) {
  const theme = THEMES[card.theme]
  const rarity = RARITIES[card.rarity]
  const brillant = (copies ?? 0) >= BRILLANT
  const style = {
    '--w': width,
    '--theme': theme.color,
    '--theme-light': theme.light,
    '--jewel': THEME_JEWEL[card.theme] ?? theme.color,
    '--rarity': rarity.color,
  } as CSSProperties
  const flipped = face !== 'front'

  return (
    <div
      className={`gcard r${card.rarity} ${glow ? `glow-${glow}` : ''} ${onClick ? 'clickable' : ''}`}
      style={style}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className={`gcard-inner ${flipped ? 'flipped' : ''}`}>
        <div className="gcard-side gcard-front">
          <Frame card={card} brillant={brillant} copies={copies}>
            <div className="gcard-art">
              <div className={`gcard-ar ${arSize(card.ar)}`} {...TEXT_ATTRS}>
                <TargetText text={card.ar} />
              </div>
            </div>
            <div className="gcard-caption">
              {theme.label} · {card.kind === 'mot' ? 'Mot' : 'Phrase'} · {rarity.name}
            </div>
            <div className="gcard-body">
              {translit ? (
                <>
                  <div className="gcard-translit">{card.translit}</div>
                  <div className="gcard-meaning">{card.fr}</div>
                </>
              ) : (
                <div className="gcard-translit muted">?</div>
              )}
            </div>
          </Frame>
        </div>
        <div className="gcard-side gcard-back">
          {face === 'hidden' ? (
            <CardBack />
          ) : (
            <Frame card={card} brillant={brillant} copies={copies}>
              <div className="gcard-art gcard-art-fr">
                <div className="gcard-fr">{card.fr}</div>
              </div>
              <div className="gcard-caption">En français</div>
              <div className="gcard-body">
                {/* Question français → arabe : la réponse reste cachée tant qu'on n'a pas répondu. */}
                {translit ? (
                  <>
                    <div className="gcard-translit small" {...TEXT_ATTRS}>
                      <TargetText text={card.ar} />
                    </div>
                    <div className="gcard-translit tiny">{card.translit}</div>
                  </>
                ) : (
                  <div className="gcard-translit muted">?</div>
                )}
              </div>
            </Frame>
          )}
        </div>
      </div>
    </div>
  )
}

function Frame({ card, brillant, copies, children }: { card: Card; brillant: boolean; copies?: number; children: ReactNode }) {
  const theme = THEMES[card.theme]
  const rarity = RARITIES[card.rarity]
  return (
    <div className={`gcard-frame ${brillant ? 'holo' : ''}`}>
      <div className="gcard-top">
        <span className="gcard-kind">{card.kind === 'mot' ? 'MOT' : 'PHRASE'}</span>
        <span className="gcard-name">{theme.label}</span>
        <span className="gcard-type" title={theme.label}>
          {theme.icon}
        </span>
      </div>
      {children}
      <div className="gcard-foot">
        <span>{cardNumber(card)}</span>
        {copies !== undefined && (
          <span className="gcard-copies" title={`${copies} exemplaire(s)`}>
            {Array.from({ length: BRILLANT }, (_, i) => (i < copies ? '●' : '○')).join('')}
            {copies > BRILLANT ? ` +${copies - BRILLANT}` : ''}
          </span>
        )}
        <span className="gcard-rarity" title={rarity.name}>
          {rarity.symbol}
        </span>
      </div>
    </div>
  )
}

/** Les mots courts s'affichent en très grand, les phrases plus petit. */
function arSize(ar: string) {
  // Les lettres latines ou cyrilliques sont plus larges que les lettres arabes liées.
  const letters = ar.replace(/[\u064B-\u0652\u0670\u0301\s]/g, '').length * (LANG.id === 'ar' ? 1 : 1.35)
  return letters <= 4 ? 'ar-xl' : letters <= 8 ? 'ar-l' : letters <= 14 ? 'ar-m' : 'ar-s'
}

export function CardBack() {
  return (
    <div className="gcard-backside">
      <div className="backside-ring">
        <span {...TEXT_ATTRS}>{LANG.glyph}</span>
      </div>
      <div className="backside-title">Polyglot</div>
    </div>
  )
}

/** Emplacement vide du classeur. */
export function EmptySlot({ card, width = '100%' }: { card: Card; width?: string }) {
  return (
    <div className="gcard slot" style={{ '--w': width } as CSSProperties}>
      <div className="slot-inner">
        <span className="slot-icon">{THEMES[card.theme].icon}</span>
        <span className="slot-num">{cardNumber(card).split('/')[0]}</span>
        <span className="slot-rarity" style={{ color: RARITIES[card.rarity].color }}>
          {RARITIES[card.rarity].symbol}
        </span>
      </div>
    </div>
  )
}
