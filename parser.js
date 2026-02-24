// Command parser for Zork
// Uses compromise for NLP verb extraction (lemmatization, inflection handling)
// Parses natural language into structured { verb, noun, indirect, preposition } commands

import nlp from 'compromise'

export const DIRECTION_ALIASES = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  ne: 'northeast',
  nw: 'northwest',
  se: 'southeast',
  sw: 'southwest',
  u: 'up',
  d: 'down',
  north: 'north',
  south: 'south',
  east: 'east',
  west: 'west',
  northeast: 'northeast',
  northwest: 'northwest',
  southeast: 'southeast',
  southwest: 'southwest',
  up: 'up',
  down: 'down',
  descend: 'down'
}

export const ITEM_ALIASES = {
  mailbox: 'mailbox',
  box: 'mailbox',
  leaflet: 'leaflet',
  letter: 'leaflet',
  note: 'leaflet',
  paper: 'leaflet',
  sword: 'sword',
  blade: 'sword',
  lantern: 'lantern',
  lamp: 'lantern',
  light: 'lantern',
  sack: 'brown-sack',
  bag: 'brown-sack',
  garlic: 'garlic',
  lunch: 'lunch',
  sandwich: 'lunch',
  food: 'lunch',
  bottle: 'bottle',
  rope: 'rope',
  knife: 'nasty-knife',
  nest: 'birds-nest',
  egg: 'jeweled-egg',
  leaves: 'pile-of-leaves',
  troll: 'troll',
  case: 'trophy-case',
  rug: 'rug',
  carpet: 'rug',
  window: 'kitchen-window',
  bar: 'platinum-bar',
  platinum: 'platinum-bar',
  painting: 'painting',
  picture: 'painting',
  gold: 'pot-of-gold',
  pot: 'pot-of-gold',
  coal: 'coal',
  skeleton: 'skeleton',
  bones: 'skeleton',
  key: 'rusty-key',
  bell: 'brass-bell',
  candles: 'candles',
  candle: 'candles',
  book: 'black-book',
  guidebook: 'guidebook-zorkmid',
  guide: 'guidebook-zorkmid',
  wrench: 'wrench',
  screwdriver: 'screwdriver',
  pump: 'air-pump',
  plastic: 'pile-of-plastic',
  raft: 'pile-of-plastic',
  torch: 'torch-dead-end',
  grating: 'grating',
  grate: 'grating',
  door: 'trap-door',
  'trap door': 'trap-door',
  trapdoor: 'trap-door',
  water: 'water',
  all: 'all',
  everything: 'all'
}

// Maps compromise-normalized infinitive → game verb
// Compromise handles inflected forms: "grabbed" → "grab" → 'take', "fighting" → "fight" → 'attack'
const VERB_MAP = {
  go: 'go',
  walk: 'go',
  run: 'go',
  enter: 'go',
  head: 'go',
  look: 'look',
  describe: 'look',
  examine: 'examine',
  inspect: 'examine',
  study: 'examine',
  read: 'read',
  search: 'search',
  rummage: 'search',
  take: 'take',
  get: 'take',
  grab: 'take',
  steal: 'take',
  pick: 'take',
  fetch: 'take',
  drop: 'drop',
  put: 'put',
  place: 'put',
  throw: 'throw',
  toss: 'throw',
  hurl: 'throw',
  open: 'open',
  close: 'close',
  shut: 'close',
  unlock: 'unlock',
  lock: 'lock',
  attack: 'attack',
  kill: 'attack',
  fight: 'attack',
  hit: 'attack',
  stab: 'attack',
  slash: 'attack',
  swing: 'attack',
  light: 'light',
  ignite: 'light',
  extinguish: 'turn_off',
  snuff: 'turn_off',
  inflate: 'inflate',
  deflate: 'deflate',
  ring: 'ring',
  eat: 'eat',
  consume: 'eat',
  drink: 'drink',
  use: 'use',
  employ: 'use',
  wave: 'wave',
  climb: 'climb',
  ascend: 'climb',
  tie: 'tie',
  bind: 'tie',
  fasten: 'tie',
  move: 'move_item',
  push: 'move_item',
  pull: 'move_item',
  drag: 'move_item',
  wait: 'wait',
  score: 'score',
  save: 'save',
  restore: 'restore',
  quit: 'quit',
  help: 'help',
  diagnose: 'diagnose',
  pray: 'pray',
  shout: 'shout',
  yell: 'shout',
  say: 'hello',
  greet: 'hello',
  inventory: 'inventory',
  xyzzy: 'xyzzy',
  plugh: 'plugh'
}

const PREPOSITIONS = new Set([
  'in',
  'into',
  'on',
  'onto',
  'with',
  'at',
  'to',
  'from',
  'off',
  'out',
  'of',
  'through',
  'under',
  'behind',
  'about'
])

export function parse(input) {
  const raw = input.trim().toLowerCase()
  if (!raw) return null

  // Single-char shortcuts — bypass NLP entirely
  if (raw === 'n') return { verb: 'go', noun: 'north' }
  if (raw === 's') return { verb: 'go', noun: 'south' }
  if (raw === 'e') return { verb: 'go', noun: 'east' }
  if (raw === 'w') return { verb: 'go', noun: 'west' }
  if (raw === 'u') return { verb: 'go', noun: 'up' }
  if (raw === 'd') return { verb: 'go', noun: 'down' }
  if (raw === 'l') return { verb: 'look', noun: null }
  if (raw === 'i') return { verb: 'inventory', noun: null }
  if (raw === 'z') return { verb: 'wait', noun: null }
  if (raw === 'q') return { verb: 'quit', noun: null }

  // Bare direction word
  if (DIRECTION_ALIASES[raw]) return { verb: 'go', noun: DIRECTION_ALIASES[raw] }

  // "x <noun>" examine shortcut
  if (raw.startsWith('x '))
    return { verb: 'examine', noun: resolveItem(raw.slice(2)) || raw.slice(2) }

  // "turn on/off X", "switch on/off X", "flip on/off X"
  const toggleMatch = raw.match(/^(?:turn|switch|flip)\s+(on|off)\s+(.+)$/)
  if (toggleMatch) {
    return {
      verb: toggleMatch[1] === 'on' ? 'turn_on' : 'turn_off',
      noun: resolveItem(toggleMatch[2]) || toggleMatch[2]
    }
  }

  // "pick up X"
  const pickUp = raw.match(/^pick\s+up\s+(.+)$/)
  if (pickUp) return { verb: 'take', noun: resolveItem(pickUp[1]) || pickUp[1] }

  // Use compromise to extract and normalize the first verb
  const tokens = raw.split(/\s+/)
  const doc = nlp(raw)
  const verbDoc = doc.verbs().first()
  const infinitive = verbDoc.toInfinitive().text() || tokens[0]
  const gameVerb = VERB_MAP[infinitive] ?? VERB_MAP[tokens[0]] ?? null

  if (!gameVerb) {
    // No verb found — check if the whole input is an item name (implicit examine)
    const item = resolveItem(raw)
    if (item) return { verb: 'examine', noun: item }
    return { verb: 'unknown', raw }
  }

  if (gameVerb === 'go') {
    const dir = DIRECTION_ALIASES[tokens[1]] || DIRECTION_ALIASES[tokens[tokens.length - 1]]
    return { verb: 'go', noun: dir || tokens.slice(1).join(' ') }
  }

  // Split the remainder of the command on the first preposition
  const rest = tokens.slice(1)
  let before = []
  let prep = null
  let after = []
  for (let i = 0; i < rest.length; i++) {
    if (PREPOSITIONS.has(rest[i])) {
      prep = rest[i]
      after = rest.slice(i + 1)
      break
    }
    before.push(rest[i])
  }

  return {
    verb: gameVerb,
    noun: resolveItem(before.join(' ')) || before.join(' ') || null,
    indirect: after.length ? resolveItem(after.join(' ')) || after.join(' ') : null,
    preposition: prep
  }
}

function resolveItem(str) {
  if (!str) return null
  str = str.trim()
  if (ITEM_ALIASES[str]) return ITEM_ALIASES[str]
  // Try multi-word matches
  for (const [alias, id] of Object.entries(ITEM_ALIASES)) {
    if (str.includes(alias) || alias.includes(str)) return id
  }
  // Try matching individual words
  for (const word of str.split(/\s+/)) {
    if (ITEM_ALIASES[word]) return ITEM_ALIASES[word]
  }
  return null
}
