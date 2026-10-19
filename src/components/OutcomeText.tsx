import { BookOpenText, Check, Coins, Copy, HeartCrack, PartyPopper, Sparkles } from 'lucide-react'
import type { Outcome } from '../game/rules'
import { BRILLANT, COINS_PER_CORRECT, PROGRESS_FOR_COPY } from '../game/rules'

export function OutcomeText({ outcome }: { outcome: Outcome }) {
  switch (outcome.kind) {
    case 'won':
      return (
        <p className="good">
          <PartyPopper size={16} className="fb-icon" aria-hidden /> Carte gagnée !{' '}
          {outcome.copies > 1 && `(${outcome.copies} exemplaires)`}{' '}
          <span className="coin-gain">
            +{COINS_PER_CORRECT} <Coins size={14} aria-hidden />
          </span>
        </p>
      )
    case 'progress':
      if (outcome.gainedCopy && outcome.copies >= BRILLANT)
        return (
          <p className="good">
            <Sparkles size={16} className="fb-icon" aria-hidden /> Carte brillante ! Tu la connais par cœur.{' '}
            <span className="coin-gain">
              +{COINS_PER_CORRECT} <Coins size={14} aria-hidden />
            </span>
          </p>
        )
      if (outcome.gainedCopy)
        return (
          <p className="good">
            <Copy size={16} className="fb-icon" aria-hidden /> +1 exemplaire ({outcome.copies}/{BRILLANT}){' '}
            <span className="coin-gain">
              +{COINS_PER_CORRECT} <Coins size={14} aria-hidden />
            </span>
          </p>
        )
      return (
        <p className="good">
          <Check size={16} className="fb-icon" aria-hidden /> Bien joué !{' '}
          <span className="coin-gain">
            +{COINS_PER_CORRECT} <Coins size={14} aria-hidden />
          </span>{' '}
          {outcome.copies < BRILLANT && (
            <span className="muted">
              Progression {outcome.progress}/{PROGRESS_FOR_COPY}
            </span>
          )}
        </p>
      )
    case 'discovered':
      return (
        <p className="discover">
          <BookOpenText size={16} className="fb-icon" aria-hidden /> Carte jamais vue : pas de punition, elle reviendra dans un
          prochain booster.
        </p>
      )
    case 'lost-copy':
      return outcome.copiesLeft > 0 ? (
        <p className="bad">
          <HeartCrack size={16} className="fb-icon" aria-hidden /> Oubliée ! Tu perds un exemplaire (il en reste{' '}
          {outcome.copiesLeft}).
        </p>
      ) : (
        <p className="bad">
          <HeartCrack size={16} className="fb-icon" aria-hidden /> Oubliée ! La carte quitte ton classeur. Elle reviendra dans un
          prochain booster.
        </p>
      )
    case 'lost-other':
      return outcome.lost ? (
        <p className="bad">
          <HeartCrack size={16} className="fb-icon" aria-hidden /> Raté ! En punition, tu perds un exemplaire de «{' '}
          {outcome.lost.fr} »{outcome.copiesLeft === 0 ? ', qui quitte ton classeur.' : '.'} Cette carte reviendra dans un
          prochain booster.
        </p>
      ) : (
        <p className="bad">
          <HeartCrack size={16} className="fb-icon" aria-hidden /> Raté ! Cette carte reviendra dans un prochain booster.
        </p>
      )
  }
}
