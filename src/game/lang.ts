/** Les langues jouables. Chacune a ses cartes, sa sauvegarde, son niveau et ses statistiques. */
export type LangId = 'ar' | 'ru' | 'ka' | 'zh'

export interface LangInfo {
  id: LangId
  /** Nom en français, avec et sans article : « Arabe », « l’arabe », « en arabe ». */
  name: string
  the: string
  inLang: string
  /** Nom dans la langue elle-même. */
  native: string
  flag: string
  dir: 'rtl' | 'ltr'
  /** Le mot « cartes » dans la langue, à côté du logo. */
  brand: string
  /** Lettre décorative au dos des cartes. */
  glyph: string
  eyebrow: string
  /** Ce que l’écriture des cartes a de particulier, pour la page d’accueil. */
  script: string
  /** Citation de fin de page d’accueil, et sa traduction. */
  motto: string
  mottoFr: string
  translitHelp: string
  saveKey: string
  /** La collection Personnages n’existe qu’en arabe pour l’instant. */
  figures: boolean
}

export const LANGS: Record<LangId, LangInfo> = {
  ar: {
    id: 'ar',
    name: 'Arabe',
    the: 'l’arabe',
    inLang: 'en arabe',
    native: 'العربية',
    flag: '🌙',
    dir: 'rtl',
    brand: 'بِطَاقَات',
    glyph: 'ع',
    eyebrow: 'Arabe littéraire · de A1 à C1',
    script: 'entièrement vocalisés',
    motto: 'اُطْلُبُوا الْعِلْمَ',
    mottoFr: 'Recherchez le savoir',
    translitHelp:
      "ā ī ū : voyelles longues · u se lit « ou » · ch = ش · kh = خ (j espagnol) · gh = غ (r grasseyé) · th = ث (think) · dh = ذ (this) · ḥ = ح (h soufflé) · ʿ = ع (gorge serrée) · ' = ء (coup de glotte) · ṣ ḍ ṭ ẓ = s d t z « lourds » · q = ق (k du fond de la gorge)",
    saveKey: 'cartarabic-save-v1',
    figures: true,
  },
  ru: {
    id: 'ru',
    name: 'Russe',
    the: 'le russe',
    inLang: 'en russe',
    native: 'Русский',
    flag: '🪆',
    dir: 'ltr',
    brand: 'ка́рточки',
    glyph: 'Я',
    eyebrow: 'Russe · de A1 à C1',
    script: 'avec l’accent tonique',
    motto: 'Учи́ться никогда́ не по́здно',
    mottoFr: 'Il n’est jamais trop tard pour apprendre',
    translitHelp:
      "L’accent (á, ó…) marque la syllabe accentuée ; les « o » non accentués se prononcent presque « a » · kh = х (j espagnol) · zh = ж (j de « jour ») · sh = ш · shch = щ (ch mouillé) · ch = ч (tch) · ts = ц · y = й ou ы (i dur) · ' = ь (consonne mouillée)",
    saveKey: 'cartarabic-save-ru-v1',
    figures: false,
  },
  ka: {
    id: 'ka',
    name: 'Géorgien',
    the: 'le géorgien',
    inLang: 'en géorgien',
    native: 'ქართული',
    flag: '🍇',
    dir: 'ltr',
    brand: 'ბარათები',
    glyph: 'ქ',
    eyebrow: 'Géorgien · de A1 à C1',
    script: 'en alphabet mkhedruli',
    motto: 'სწავლა სინათლეა',
    mottoFr: 'Apprendre, c’est la lumière',
    translitHelp:
      "Toutes les lettres se prononcent · l’apostrophe (k' p' t' ts' ch' q') marque une consonne éjective, sèche et sans souffle · kh = ხ (j espagnol) · gh = ღ (r grasseyé) · q' = ყ (k du fond de la gorge) · sh = შ · zh = ჟ · ch = ჩ (tch) · ts = ც · dz = ძ · j = ჯ (dj)",
    saveKey: 'cartarabic-save-ka-v1',
    figures: false,
  },
  zh: {
    id: 'zh',
    name: 'Chinois',
    the: 'le chinois',
    inLang: 'en chinois',
    native: '中文',
    flag: '🏮',
    dir: 'ltr',
    brand: '卡片',
    glyph: '字',
    eyebrow: 'Chinois mandarin · de A1 à B1',
    script: 'en caractères simplifiés avec le pinyin',
    motto: '学而时习之',
    mottoFr: 'Apprendre et réviser sans cesse',
    translitHelp:
      'Le pinyin note le son, l’accent note le ton : ā plat et haut · á monte · ǎ descend puis remonte · à tombe sec · sans accent : ton neutre, court et léger · x = ch doux · q = tch soufflé · j = dj · zh = dj dur · ch = tch dur · sh = ch · r = j anglais · c = ts soufflé · z = dz · h = j espagnol léger · ü = u français · u se lit « ou »',
    saveKey: 'cartarabic-save-zh-v1',
    figures: false,
  },
}

/** Langues proposées. Le chinois est en pause : ajouter 'zh' ici suffit pour le rouvrir (cartes et parties sont gardées). */
export const ACTIVE_LANGS: LangId[] = ['ar', 'ru', 'ka']

const LANG_KEY = 'cartarabic-lang'

function storedLang(): string | null {
  try {
    return localStorage.getItem(LANG_KEY)
  } catch {
    // Stockage indisponible (ou tests) : arabe par défaut.
    return null
  }
}

function readLang(): LangId {
  const v = storedLang()
  return ACTIVE_LANGS.includes(v as LangId) ? (v as LangId) : 'ar'
}

/** Langue de la session, fixée au chargement de la page. */
export const LANG = LANGS[readLang()]

/** La langue choisie la dernière fois est en pause : on propose d'en choisir une autre. */
export const LANG_PAUSED = ((v) => v !== null && v in LANGS && !ACTIVE_LANGS.includes(v as LangId))(storedLang())

/** Change de langue : chaque langue ayant ses propres cartes, on recharge simplement la page. */
export function switchLang(id: LangId) {
  try {
    localStorage.setItem(LANG_KEY, id)
  } catch {
    // Ignoré.
  }
  location.reload()
}

/** Attributs à mettre sur tout texte écrit dans la langue apprise. */
export const TEXT_ATTRS = { lang: LANG.id, dir: LANG.dir }
