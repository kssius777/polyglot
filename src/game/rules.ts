import { CARDS, CARD_BY_ID, type Card, type Rarity } from './cards'
import { drawFigures, FIGURE_BOOSTER_PRICE, type Figure } from './figures'

/** Nombre d'exemplaires pour qu'une carte devienne brillante (retenue). */
export const BRILLANT = 3
/** Bonnes réponses espacées nécessaires pour gagner un exemplaire. */
export const PROGRESS_FOR_COPY = 3
export const REVIEW_SIZE = 15
export const BOOSTER_SIZE = 10
export const START_BOOSTERS = 3
/** Dinars gagnés à chaque bonne réponse (booster ou révision). */
export const COINS_PER_CORRECT = 10
/** Dinars offerts au départ, de quoi ouvrir un premier booster de personnages. */
export const START_COINS = 150

const MIN = 60_000
const DAY = 86_400_000
/** Délai avant de revoir une carte, selon sa boîte (répétition espacée). */
export const INTERVALS = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY]
const MAX_BOX = INTERVALS.length - 1

export interface Owned {
  copies: number
  box: number
  due: number
  progress: number
}

export interface Save {
  version: 1
  level: Rarity | null
  owned: Record<string, Owned>
  boosters: number
  reviewsDone: number
  /** Monnaie du jeu, gagnée en répondant juste. */
  coins: number
  /** Cartes personnages possédées : id → nombre d'exemplaires. */
  figures: Record<string, number>
  /** Cartes ratées ou oubliées, qui reviennent en priorité dans les prochains boosters. */
  missed: string[]
  /** Nombre d'erreurs par carte, pour retrouver celles qu'on ne maîtrise pas. */
  fails: Record<string, number>
  /** Bonnes réponses / réponses, par jour, par niveau et par thème, pour les statistiques. */
  history: History
  /** Points d'expérience gagnés depuis le début (10 par bonne réponse), pour le classement. */
  xp: number
  /** Objectif du jour, en nombre de réponses, choisi à l'accueil des débutants. */
  goal: number
  /** Pourquoi on apprend cette langue (choisi à l'accueil des débutants). */
  reason: string
  /** Dialogues faits : id → meilleur nombre de bonnes réponses à l'exercice. */
  dialogues: Record<string, number>
}

export const XP_PER_ANSWER = 10
export const DEFAULT_GOAL = 20

export type Tally = [correct: number, total: number]

export interface History {
  days: Record<string, Tally>
  levels: Record<string, Tally>
  themes: Record<string, Tally>
}

export type Rng = () => number

export function newSave(): Save {
  return {
    version: 1,
    level: null,
    owned: {},
    boosters: 0,
    reviewsDone: 0,
    coins: START_COINS,
    figures: {},
    missed: [],
    fails: {},
    history: { days: {}, levels: {}, themes: {} },
    xp: 0,
    goal: DEFAULT_GOAL,
    reason: '',
    dialogues: {},
  }
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const isBrillant = (o: Owned | undefined) => !!o && o.copies >= BRILLANT

function intervalFor(box: number, brillant: boolean) {
  return INTERVALS[box] * (brillant ? 2 : 1)
}

// ---------- Questions ----------

/** ar-fr : arabe → français ; fr-ar : français → arabe ; -nt : choix qui se ressemblent (même thème). */
export type QType = 'ar-fr' | 'fr-ar' | 'ar-fr-nt' | 'fr-ar-nt'

export interface Question {
  card: Card
  type: QType
  choices: Card[]
}

export function questionTypeFor(o: Owned | undefined): QType {
  const box = o?.box ?? 0
  if (box <= 1) return 'ar-fr'
  if (box === 2) return 'fr-ar'
  if (box === 3) return 'ar-fr-nt'
  return 'fr-ar-nt'
}

// Indices de surface qu'on veut identiques entre la bonne réponse et les leurres,
// pour qu'on ne puisse pas deviner au nombre de mots, à la longueur ou à la forme.
const FR_STARTS =
  /^(je |j'|tu |il |elle |nous |vous |ils |elles |on |le |la |les |l'|un |une |des |du |de |mon |ma |mes |ton |ta |c'est |est-ce |où |quand |comment |pourquoi |combien |que |qui |quel)/i

function shape(text: string, arabic: boolean) {
  const t = text.trim()
  const words = t.split(/\s+/).length
  return {
    words,
    len: t.length,
    question: /[?؟]$/.test(t),
    excl: /!$/.test(t),
    paren: t.includes('('),
    start: arabic
      ? t.startsWith('ال') || t.startsWith('اَل')
        ? 'al'
        : t.slice(0, 1)
      : (t.match(FR_STARTS)?.[1].toLowerCase() ?? ''),
  }
}

function distance(a: ReturnType<typeof shape>, b: ReturnType<typeof shape>) {
  return (
    Math.abs(a.words - b.words) * 3 +
    Math.abs(a.len - b.len) / 3 +
    (a.question !== b.question ? 6 : 0) +
    (a.excl !== b.excl ? 3 : 0) +
    (a.paren !== b.paren ? 4 : 0) +
    (a.start !== b.start ? 3 : 0)
  )
}

const BY_THEME = new Map<string, Card[]>()
for (const c of CARDS) {
  if (!BY_THEME.has(c.theme)) BY_THEME.set(c.theme, [])
  BY_THEME.get(c.theme)!.push(c)
}

export function makeQuestion(card: Card, type: QType, rng: Rng): Question {
  const hard = type !== 'ar-fr'
  // Les choix affichés sont en français (arabe → français) ou en arabe (français → arabe).
  const arabicChoices = type.startsWith('fr-ar')
  const text = (c: Card) => (arabicChoices ? c.ar : c.fr)
  const target = shape(text(card), arabicChoices)

  // Candidats : tout le thème, plus un large échantillon au hasard (rapide même avec des milliers de cartes).
  const pool = new Set<Card>(BY_THEME.get(card.theme) ?? [])
  for (let k = 0; k < 400; k++) pool.add(CARDS[Math.floor(rng() * CARDS.length)])

  const scored: { c: Card; d: number }[] = []
  for (const c of pool) {
    if (c === card || c.kind !== card.kind || c.fr === card.fr || c.ar === card.ar) continue
    const d =
      distance(target, shape(text(c), arabicChoices)) +
      (c.theme !== card.theme ? (hard ? 5 : 1.5) : 0) +
      Math.abs(c.rarity - card.rarity) * (hard ? 1 : 0.5) +
      rng() * 2
    scored.push({ c, d })
  }
  scored.sort((a, b) => a.d - b.d)

  // On tire 3 leurres parmi les plus ressemblants, pour garder de la variété.
  const best = shuffle(scored.slice(0, 7), rng)
  const distractors: Card[] = []
  for (const { c } of [...best, ...scored.slice(7)]) {
    if (distractors.length === 3) break
    if (distractors.some((d) => d.fr === c.fr || d.ar === c.ar)) continue
    distractors.push(c)
  }
  return { card, type, choices: shuffle([card, ...distractors], rng) }
}

// ---------- Test de niveau ----------

const PLACEMENT_PLAN: Record<Rarity, number> = { 1: 3, 2: 3, 3: 2, 4: 2, 5: 2 }
/** Bonnes réponses nécessaires dans un palier pour le valider. */
export const PLACEMENT_PASS = 2

export function placementCards(rng: Rng): Card[] {
  return ([1, 2, 3, 4, 5] as Rarity[]).flatMap((r) =>
    shuffle(
      CARDS.filter((c) => c.rarity === r),
      rng,
    ).slice(0, PLACEMENT_PLAN[r]),
  )
}

export interface PlacementResult {
  card: Card
  correct: boolean
}

export function placementLevel(results: PlacementResult[]): Rarity {
  let level: Rarity = 1
  for (const r of [1, 2, 3, 4, 5] as Rarity[]) {
    const ok = results.filter((x) => x.card.rarity === r && x.correct).length
    if (ok < PLACEMENT_PASS) break
    level = r
  }
  return level
}

export function applyPlacement(save: Save, results: PlacementResult[], now: number): Save {
  const owned = { ...save.owned }
  for (const { card, correct } of results) {
    if (correct)
      owned[card.id] = {
        copies: 1,
        box: 1,
        due: now + INTERVALS[1],
        progress: 0,
      }
  }
  return {
    ...save,
    owned,
    level: placementLevel(results),
    boosters: save.boosters + START_BOOSTERS,
  }
}

// ---------- Boosters ----------

/** Combien de cartes ratées reviennent au plus dans chaque booster. */
export const MISSED_PER_BOOSTER = 3
const MISSED_MAX = 60

function remember(missed: string[], id: string) {
  return [...missed.filter((x) => x !== id), id].slice(-MISSED_MAX)
}

export function openBooster(save: Save, rng: Rng): Card[] {
  const level = save.level ?? 1
  const notOwned = CARDS.filter((c) => !save.owned[c.id])
  // Une carte ratée revient vite : on ne retient un mot qu'en le revoyant.
  const picked: Card[] = shuffle(
    save.missed.filter((id) => !save.owned[id] && CARD_BY_ID.has(id)),
    rng,
  )
    .slice(0, MISSED_PER_BOOSTER)
    .map((id) => CARD_BY_ID.get(id)!)
  const extra = picked.length
  const take = (match: (c: Card) => boolean) => {
    const fresh = notOwned.filter((c) => match(c) && !picked.includes(c))
    const fallback = CARDS.filter((c) => match(c) && !picked.includes(c))
    const pool = fresh.length ? fresh : fallback.length ? fallback : CARDS.filter((c) => !picked.includes(c))
    picked.push(pool[Math.floor(rng() * pool.length)])
  }
  for (let i = extra; i < BOOSTER_SIZE - 3; i++) take((c) => c.rarity <= level)
  take((c) => c.rarity === level)
  take((c) => c.rarity === level)
  if (level < 5 && rng() < 0.1) take((c) => c.rarity === level + 1)
  else take((c) => c.rarity <= level)
  return shuffle(picked, rng)
}

export function consumeBooster(save: Save): Save {
  return { ...save, boosters: Math.max(0, save.boosters - 1) }
}

// ---------- Réponses et punitions ----------

export type Outcome =
  | { kind: 'won'; card: Card; copies: number }
  | {
      kind: 'progress'
      card: Card
      copies: number
      gainedCopy: boolean
      progress: number
    }
  | { kind: 'lost-copy'; card: Card; copiesLeft: number }
  | { kind: 'lost-other'; card: Card; lost: Card | null; copiesLeft: number }
  | { kind: 'discovered'; card: Card }

function loseCopy(owned: Record<string, Owned>, id: string, now: number): number {
  const o = owned[id]
  if (!o) return 0
  if (o.copies <= 1) {
    delete owned[id]
    return 0
  }
  owned[id] = { copies: o.copies - 1, box: 0, due: now, progress: 0 }
  return o.copies - 1
}

function punish(save: Save, card: Card, now: number, rng: Rng): { save: Save; outcome: Outcome } {
  const owned = { ...save.owned }
  if (owned[card.id]) {
    const copiesLeft = loseCopy(owned, card.id, now)
    const missed = copiesLeft ? save.missed : remember(save.missed, card.id)
    return {
      save: { ...save, owned, missed },
      outcome: { kind: 'lost-copy', card, copiesLeft },
    }
  }
  save = { ...save, missed: remember(save.missed, card.id) }
  const others = Object.keys(owned)
  if (!others.length) {
    return {
      save,
      outcome: { kind: 'lost-other', card, lost: null, copiesLeft: 0 },
    }
  }
  const id = others[Math.floor(rng() * others.length)]
  const copiesLeft = loseCopy(owned, id, now)
  return {
    save: { ...save, owned },
    outcome: {
      kind: 'lost-other',
      card,
      lost: CARD_BY_ID.get(id)!,
      copiesLeft,
    },
  }
}

/** Clé du jour en heure locale, ex. 2026-10-15. */
export function dayKey(t: number) {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const HISTORY_DAYS = 120

function bump(map: Record<string, Tally>, key: string, correct: boolean): Record<string, Tally> {
  const [c, t] = map[key] ?? [0, 0]
  return { ...map, [key]: [c + (correct ? 1 : 0), t + 1] }
}

function bumpDay(days: Record<string, Tally>, now: number, correct: boolean): Record<string, Tally> {
  const out = bump(days, dayKey(now), correct)
  const keys = Object.keys(out)
  if (keys.length <= HISTORY_DAYS) return out
  return Object.fromEntries(
    keys
      .sort()
      .slice(-HISTORY_DAYS)
      .map((k) => [k, out[k]]),
  )
}

/** Note la réponse pour les statistiques et la liste des cartes à travailler. */
function record(save: Save, card: Card, correct: boolean, now: number): Save {
  const history = {
    days: bumpDay(save.history.days, now, correct),
    levels: bump(save.history.levels, String(card.rarity), correct),
    themes: bump(save.history.themes, card.theme, correct),
  }
  const fails = correct ? save.fails : { ...save.fails, [card.id]: (save.fails[card.id] ?? 0) + 1 }
  return {
    ...save,
    history,
    fails,
    xp: save.xp + (correct ? XP_PER_ANSWER : 0),
  }
}

/** Réponse à l'exercice d'un dialogue : de l'XP et des pièces comme en révision, et elle compte pour l'objectif du jour. */
export function answerDialogue(save: Save, correct: boolean, now: number): Save {
  return {
    ...save,
    history: { ...save.history, days: bumpDay(save.history.days, now, correct) },
    xp: save.xp + (correct ? XP_PER_ANSWER : 0),
    coins: save.coins + (correct ? COINS_PER_CORRECT : 0),
  }
}

/** Garde le meilleur score de chaque dialogue, pour cocher ceux qui sont faits. */
export function finishDialogue(save: Save, id: string, good: number): Save {
  return { ...save, dialogues: { ...save.dialogues, [id]: Math.max(good, save.dialogues[id] ?? 0) } }
}

/** Lundi de la semaine en cours (heure locale), au format AAAA-MM-JJ. */
export function weekStart(now: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(d.getTime())
}

/** XP gagnés depuis lundi, d'après l'historique par jour. */
export function weekXp(save: Save, now: number): number {
  const from = weekStart(now)
  return Object.entries(save.history.days)
    .filter(([day]) => day >= from)
    .reduce((n, [, [ok]]) => n + ok * XP_PER_ANSWER, 0)
}

/** Réponses données aujourd'hui, pour l'objectif du jour. */
export function todayAnswers(save: Save, now: number): number {
  return save.history.days[dayKey(now)]?.[1] ?? 0
}

/** Réponse à une carte de booster : la gagner, ou être puni. */
export function answerBooster(save: Save, card: Card, correct: boolean, now: number, rng: Rng) {
  const r = boosterCore(save, card, correct, now, rng)
  return { ...r, save: record(r.save, card, correct, now) }
}

function boosterCore(save: Save, card: Card, correct: boolean, now: number, rng: Rng): { save: Save; outcome: Outcome } {
  // On ne peut pas connaître un mot jamais vu : la première erreur n'est pas punie, la carte reviendra.
  const neverSeen = !save.owned[card.id] && !save.missed.includes(card.id) && !save.fails[card.id]
  if (!correct && neverSeen) {
    return {
      save: { ...save, missed: remember(save.missed, card.id) },
      outcome: { kind: 'discovered', card },
    }
  }
  if (!correct) return punish(save, card, now, rng)
  const owned = { ...save.owned }
  const o = owned[card.id]
  owned[card.id] = o ? { ...o, copies: o.copies + 1 } : { copies: 1, box: 1, due: now + INTERVALS[1], progress: 0 }
  const outcome: Outcome = { kind: 'won', card, copies: owned[card.id].copies }
  const missed = save.missed.filter((id) => id !== card.id)
  return {
    save: { ...save, owned, missed, coins: save.coins + COINS_PER_CORRECT },
    outcome,
  }
}

/** Réponse en révision : la carte progresse, ou on perd un exemplaire. */
export function answerReview(save: Save, card: Card, correct: boolean, now: number, rng: Rng) {
  const r = reviewCore(save, card, correct, now, rng)
  return { ...r, save: record(r.save, card, correct, now) }
}

function reviewCore(save: Save, card: Card, correct: boolean, now: number, rng: Rng): { save: Save; outcome: Outcome } {
  const o = save.owned[card.id]
  if (!o) return boosterCore(save, card, correct, now, rng)
  if (!correct) return punish(save, card, now, rng)
  const wasDue = o.due <= now
  // Réviser en avance ne rallonge pas l'intervalle : seule une réponse au bon moment prouve qu'on a retenu.
  const box = wasDue ? Math.min(o.box + 1, MAX_BOX) : o.box
  let { copies, progress } = o
  let gainedCopy = false
  if (wasDue) progress++
  if (progress >= PROGRESS_FOR_COPY && copies < BRILLANT) {
    copies++
    progress = 0
    gainedCopy = true
  }
  const next: Owned = {
    copies,
    progress,
    box,
    due: wasDue ? now + intervalFor(box, copies >= BRILLANT) : o.due,
  }
  const outcome: Outcome = {
    kind: 'progress',
    card,
    copies,
    gainedCopy,
    progress,
  }
  return {
    save: {
      ...save,
      owned: { ...save.owned, [card.id]: next },
      coins: save.coins + COINS_PER_CORRECT,
    },
    outcome,
  }
}

// ---------- Révisions ----------

export function dueCount(save: Save, now: number): number {
  return Object.values(save.owned).filter((o) => o.due <= now).length
}

export function reviewSession(save: Save, now: number, rng: Rng, size = REVIEW_SIZE): Card[] {
  const entries = Object.entries(save.owned)
  const due = entries.filter(([, o]) => o.due <= now).sort((a, b) => a[1].due - b[1].due)
  // Les cartes pas encore à revoir complètent la séance, les brillantes plus rarement.
  const rest = entries
    .filter(([, o]) => o.due > now)
    .map(([id, o]) => ({ id, w: rng() + (isBrillant(o) ? 0.7 : 0) }))
    .sort((a, b) => a.w - b.w)
    .map((x) => x.id)
  const ids = [...due.map(([id]) => id), ...rest].slice(0, size)
  return shuffle(
    ids.map((id) => CARD_BY_ID.get(id)!),
    rng,
  )
}

export function finishReview(save: Save): Save {
  return { ...save, reviewsDone: save.reviewsDone + 1 }
}

// ---------- Personnages ----------

/** Achète un booster de personnages avec des dinars. Renvoie null si on n'a pas assez. */
export function buyFigureBooster(save: Save, rng: Rng): { save: Save; figures: Figure[] } | null {
  if (save.coins < FIGURE_BOOSTER_PRICE) return null
  const figures = drawFigures(save.figures, rng)
  const owned = { ...save.figures }
  for (const f of figures) owned[f.id] = (owned[f.id] ?? 0) + 1
  return {
    save: { ...save, coins: save.coins - FIGURE_BOOSTER_PRICE, figures: owned },
    figures,
  }
}

// ---------- Progression ----------

/** Cartes de son niveau à posséder pour monter : la moitié du niveau, plafonnée pour rester atteignable. */
export const LEVEL_UP_MAX = 60

export function levelGoal(level: Rarity) {
  const tier = CARDS.filter((c) => c.rarity === level)
  return { tier, goal: Math.min(LEVEL_UP_MAX, Math.ceil(tier.length / 2)) }
}

/** Le plus haut niveau qui a des cartes (le chinois s'arrête pour l'instant à B1). */
const MAX_LEVEL = CARDS.reduce<number>((m, c) => Math.max(m, c.rarity), 1) as Rarity
export function maxLevel(): Rarity {
  return MAX_LEVEL
}

/** Le niveau monte quand on possède assez de cartes de sa rareté maximale. */
export function levelUp(save: Save): Save {
  const level = save.level
  if (!level || level >= maxLevel()) return save
  const { tier, goal } = levelGoal(level)
  const have = tier.filter((c) => save.owned[c.id]).length
  return have >= goal ? { ...save, level: (level + 1) as Rarity } : save
}

/** Évite d'être bloqué : sans carte ni booster, on reçoit un booster. */
export function rescue(save: Save): Save {
  if (save.level && !Object.keys(save.owned).length && save.boosters === 0) return { ...save, boosters: 1 }
  return save
}

export function stats(save: Save) {
  const owned = Object.values(save.owned)
  return {
    owned: owned.length,
    brillant: owned.filter(isBrillant).length,
    total: CARDS.length,
  }
}

export function hasWon(save: Save): boolean {
  return CARDS.every((c) => isBrillant(save.owned[c.id]))
}

// ---------- Statistiques ----------

/** Cartes pas encore brillantes sur lesquelles on s'est déjà trompé, les plus ratées d'abord. */
export function cardsToWork(save: Save): { card: Card; fails: number }[] {
  return Object.entries(save.fails)
    .filter(([id, n]) => n > 0 && CARD_BY_ID.has(id) && !isBrillant(save.owned[id]))
    .map(([id, n]) => ({ card: CARD_BY_ID.get(id)!, fails: n }))
    .sort((a, b) => b.fails - a.fails || Number(!save.owned[b.card.id]) - Number(!save.owned[a.card.id]))
}
