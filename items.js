// Zork I - Item definitions
// Each item has properties, behaviors, and interaction logic

export const items = {
  // === ABOVE GROUND ITEMS ===

  mailbox: {
    name: 'small mailbox',
    description: 'There is a small mailbox here.',
    open: false,
    fixed: true, // can't be picked up
    takeable: false,
    contains: ['leaflet'],
    onOpen: (ctx) => {
      const item = ctx.items['mailbox']
      if (item.open) return 'The mailbox is already open.'
      item.open = true
      return 'Opening the small mailbox reveals a leaflet.'
    },
    onClose: (ctx) => {
      const item = ctx.items['mailbox']
      if (!item.open) return 'The mailbox is already closed.'
      item.open = false
      return 'The mailbox is now closed.'
    },
    onExamine: (ctx) => {
      const item = ctx.items['mailbox']
      if (item.open) {
        const room = ctx.rooms['west-of-house']
        const hasLeaflet = room.items.includes('leaflet')
        return hasLeaflet
          ? 'The mailbox is open and contains a small leaflet.'
          : 'The mailbox is open but empty.'
      }
      return 'The small mailbox is closed.'
    }
  },

  leaflet: {
    name: 'leaflet',
    description: 'There is a leaflet here.',
    takeable: true,
    onRead: () =>
      '"WELCOME TO ZORK!\n\nZORK is a game of adventure, danger, and low cunning. In it you will explore some of the most amazing territory ever seen by mortals. No computer should be without one!"',
    onExamine: () => 'A small leaflet with text printed on it.'
  },

  sword: {
    name: 'elvish sword',
    description: 'There is an elvish sword here.',
    takeable: true,
    damage: 5,
    glowing: false,
    onExamine: (ctx) => {
      if (ctx.items['sword'].glowing) {
        return 'The sword is glowing with a faint blue glow.'
      }
      return 'A finely crafted elvish sword of great antiquity.'
    },
    onTake: (ctx) => {
      return 'Taken.'
    }
  },

  lantern: {
    name: 'brass lantern',
    description: 'There is a brass lantern here.',
    takeable: true,
    on: false,
    turnsRemaining: 300,
    onTurnOn: (ctx) => {
      const lantern = ctx.items['lantern']
      if (lantern.on) return 'The lantern is already on.'
      if (lantern.turnsRemaining <= 0) return 'The lantern has run out of power.'
      lantern.on = true
      return 'The brass lantern is now on.'
    },
    onTurnOff: (ctx) => {
      const lantern = ctx.items['lantern']
      if (!lantern.on) return 'The lantern is already off.'
      lantern.on = false
      return 'The brass lantern is now off.'
    },
    onExamine: (ctx) => {
      const lantern = ctx.items['lantern']
      if (lantern.on) return 'The brass lantern is on and emitting a warm glow.'
      return 'A battery-powered brass lantern.'
    }
  },

  'brown-sack': {
    name: 'brown sack',
    description: 'On the table is an elongated brown sack, smelling of hot peppers.',
    takeable: true,
    contains: ['garlic', 'lunch'],
    open: false,
    onOpen: (ctx) => {
      const sack = ctx.items['brown-sack']
      if (sack.open) return 'The sack is already open.'
      sack.open = true
      return 'Opening the brown sack reveals a lunch and a clove of garlic.'
    },
    onExamine: (ctx) => {
      const sack = ctx.items['brown-sack']
      if (sack.open) return 'An elongated brown sack. It is open.'
      return 'An elongated brown sack, smelling of hot peppers.'
    }
  },

  garlic: {
    name: 'clove of garlic',
    description: 'There is a clove of garlic here.',
    takeable: true,
    onExamine: () => 'A pungent clove of garlic.',
    onEat: () =>
      'Phew! The garlic is extremely strong. You manage to choke it down, but it leaves a terrible aftertaste.'
  },

  lunch: {
    name: 'lunch',
    description: 'There is a hot pepper sandwich here.',
    takeable: true,
    onExamine: () => 'A hot pepper sandwich.',
    onEat: (ctx) => {
      const idx = ctx.inventory.indexOf('lunch')
      if (idx !== -1) ctx.inventory.splice(idx, 1)
      return 'Thank you very much. It really hit the spot.'
    }
  },

  bottle: {
    name: 'glass bottle',
    description: 'A glass bottle is sitting on the table.',
    takeable: true,
    contains: ['water'],
    open: false,
    onExamine: (ctx) => {
      const bottle = ctx.items['bottle']
      if (bottle.contains.includes('water')) return 'A clear glass bottle containing water.'
      return 'An empty glass bottle.'
    }
  },

  rope: {
    name: 'coil of rope',
    description: 'There is a large coil of rope here.',
    takeable: true,
    onExamine: () => 'A large coil of sturdy rope.'
  },

  'nasty-knife': {
    name: 'nasty knife',
    description: 'There is a nasty-looking knife here.',
    takeable: true,
    damage: 2,
    onExamine: () => 'A vicious-looking knife. It appears to be quite sharp.'
  },

  'birds-nest': {
    name: "bird's nest",
    description: "There is a bird's nest here.",
    takeable: true,
    contains: ['jeweled-egg'],
    onExamine: (ctx) => {
      if (ctx.items['birds-nest'].contains.includes('jeweled-egg')) {
        return "A bird's nest containing a beautiful jeweled egg."
      }
      return "An empty bird's nest."
    }
  },

  'jeweled-egg': {
    name: 'jeweled egg',
    description: 'There is a beautiful jeweled egg here.',
    takeable: true,
    treasure: true,
    score: 5,
    onExamine: () =>
      'A beautiful jeweled egg, with delicate gold inlay. It appears to be of great value.',
    onOpen: (ctx) => {
      if (ctx.flags.eggOpened) return 'The egg is already open. There is nothing inside.'
      // Opening the egg without the right tool damages it
      ctx.flags.eggOpened = true
      ctx.flags.eggDamaged = true
      return 'You have rather clumsily opened the egg, destroying much of its value. Inside you find a canary.'
    }
  },

  'pile-of-leaves': {
    name: 'pile of leaves',
    description: 'There is a pile of leaves on the ground.',
    takeable: false,
    fixed: true,
    onMove: (ctx) => {
      if (ctx.flags.leavesSearched) return 'You already moved the leaves. A grating is visible.'
      ctx.flags.leavesSearched = true
      return 'Underneath the pile of leaves you discover a grating set into the ground.'
    },
    onExamine: (ctx) => {
      if (ctx.flags.leavesSearched)
        return 'A pile of leaves. Beneath them, a grating is set into the ground.'
      return 'A pile of leaves covering the ground.'
    }
  },

  // === UNDERGROUND ITEMS ===

  troll: {
    name: 'troll',
    description:
      'A nasty-looking troll, brandishing a bloody axe, blocks all passages out of the room.',
    takeable: false,
    fixed: true,
    npc: true,
    health: 10,
    damage: 4,
    onExamine: (ctx) => {
      if (ctx.flags.trollDefeated) return 'The unconscious troll is sprawled on the floor.'
      return 'A large, menacing troll with a wicked axe. He looks extremely dangerous.'
    },
    onAttack: (ctx, weapon) => {
      if (ctx.flags.trollDefeated) return 'The troll is already unconscious.'

      if (!weapon || weapon === 'hands') {
        ctx.health -= 3
        return 'Attacking the troll with your bare hands is suicidal. The troll swings his axe and hits you!'
      }

      const weaponItem = ctx.items[weapon]
      if (!weaponItem || !weaponItem.damage) {
        return 'Trying to attack the troll with that is useless.'
      }

      const trollItem = ctx.items['troll']
      trollItem.health -= weaponItem.damage

      if (trollItem.health <= 0) {
        ctx.flags.trollDefeated = true
        ctx.score += 10
        return (
          'You swing your ' +
          weaponItem.name +
          ' at the troll. It connects! The troll staggers back, stunned. After a moment, the troll falls unconscious. The bloody axe drops from his hands.'
        )
      }

      // Troll counter-attacks
      const trollDamage = Math.floor(Math.random() * trollItem.damage) + 1
      ctx.health -= trollDamage

      if (ctx.health <= 0) {
        return null // handled by death check
      }

      const responses = [
        `You swing at the troll with your ${weaponItem.name}. It's a hit! The troll swings back and wounds you.`,
        `Your ${weaponItem.name} strikes the troll. He grunts in pain, then swings his axe at you!`,
        `A solid blow with the ${weaponItem.name}! But the troll is tough. He retaliates with his axe.`
      ]
      return responses[Math.floor(Math.random() * responses.length)]
    }
  },

  'trophy-case': {
    name: 'trophy case',
    description: 'There is a trophy case here.',
    takeable: false,
    fixed: true,
    contains: [],
    open: false,
    onExamine: (ctx) => {
      const tc = ctx.items['trophy-case']
      if (tc.contains.length === 0) return 'The trophy case is empty.'
      const names = tc.contains.map((id) => ctx.items[id]?.name || id)
      return 'The trophy case contains: ' + names.join(', ') + '.'
    },
    onPut: (ctx, itemId) => {
      const item = ctx.items[itemId]
      if (!item) return "You don't have that."
      if (!item.treasure) return "That doesn't belong in the trophy case."
      ctx.items['trophy-case'].contains.push(itemId)
      const idx = ctx.inventory.indexOf(itemId)
      if (idx !== -1) ctx.inventory.splice(idx, 1)
      if (item.score) {
        ctx.score += item.score
      }
      return 'Placed in the trophy case.'
    }
  },

  rug: {
    name: 'oriental rug',
    description: 'There is a large oriental rug on the floor.',
    takeable: false,
    fixed: true,
    onMove: (ctx) => {
      if (ctx.flags.rugMoved) return 'The rug is already moved aside.'
      ctx.flags.rugMoved = true
      return 'With a great effort, you move the rug to one side of the room, revealing a closed trap door.'
    },
    onExamine: (ctx) => {
      if (ctx.flags.rugMoved) return 'The rug has been moved aside, revealing a trap door.'
      return 'A beautiful oriental rug lies in the center of the room.'
    }
  },

  'kitchen-window': {
    name: 'window',
    description: 'A small window.',
    fixed: true,
    takeable: false,
    open: true,
    onOpen: (ctx) => {
      ctx.items['kitchen-window'].open = true
      return 'The window is now open.'
    },
    onClose: (ctx) => {
      ctx.items['kitchen-window'].open = false
      return 'The window is now closed.'
    },
    onExamine: (ctx) => {
      return ctx.items['kitchen-window'].open ? 'The window is open.' : 'The window is closed.'
    }
  },

  // === TREASURES & UNDERGROUND ITEMS ===

  'platinum-bar': {
    name: 'platinum bar',
    description: 'There is a large platinum bar here.',
    takeable: true,
    treasure: true,
    score: 10,
    onExamine: () => 'A bar of solid platinum, extremely heavy but obviously valuable.'
  },

  painting: {
    name: 'painting',
    description: 'There is a painting of unparalleled beauty here.',
    takeable: true,
    treasure: true,
    score: 6,
    onExamine: () =>
      'A beautiful painting depicting a pastoral scene. It is clearly a work of great artistic merit.'
  },

  'pot-of-gold': {
    name: 'pot of gold',
    description: 'There is a pot of gold here.',
    takeable: true,
    treasure: true,
    score: 10,
    onExamine: () =>
      'A pot brimming with gold coins. Each one bears the image of the great Flathead kings.'
  },

  coal: {
    name: 'small pile of coal',
    description: 'There is a small pile of coal here.',
    takeable: true,
    onExamine: () => 'A small pile of coal.'
  },

  skeleton: {
    name: 'skeleton',
    description: 'The remains of some unfortunate adventurer lie here.',
    takeable: false,
    fixed: true,
    onExamine: () =>
      'These are the mortal remains of an adventurer like yourself, probably the victim of the maze.'
  },

  'rusty-key': {
    name: 'rusty key',
    description: 'There is a rusty key here.',
    takeable: true,
    onExamine: () => 'A rusty iron key.',
    onUse: (ctx, target) => {
      if (target === 'grating') {
        ctx.flags.gratingUnlocked = true
        return 'The grating is now unlocked.'
      }
      return "The key doesn't fit."
    }
  },

  'brass-bell': {
    name: 'brass bell',
    description: 'There is a brass bell here.',
    takeable: true,
    onExamine: () => 'A large brass bell with a wooden handle.',
    onRing: () => 'Ding, dong!'
  },

  candles: {
    name: 'pair of candles',
    description: 'There are a pair of candles here.',
    takeable: true,
    lit: false,
    onExamine: (ctx) => {
      return ctx.items['candles'].lit ? 'A pair of lit ivory candles.' : 'A pair of ivory candles.'
    },
    onLight: (ctx) => {
      if (ctx.items['candles'].lit) return 'The candles are already lit.'
      // Need matches or something - simplified
      ctx.items['candles'].lit = true
      return 'The candles are now lit, casting a warm glow.'
    }
  },

  'black-book': {
    name: 'black book',
    description: 'There is a black leather-bound book here.',
    takeable: true,
    onRead: () =>
      'The book is written in an ancient and mysterious language you cannot understand. Parts of the text seem to glow faintly.',
    onExamine: () => 'A leather-bound book with arcane symbols on the cover.'
  },

  'guidebook-zorkmid': {
    name: 'guidebook',
    description: 'There is a tourist guidebook here.',
    takeable: true,
    onRead: () =>
      '"DAM FACT SHEET\n\nFCD#3 was constructed in year 783 of the Great Underground Empire. This impressive structure is composed of 370,000 cubic feet of concrete, is 256 feet wide at the top, and 512 feet wide at the base.\n\nThe reservoir behind the dam has a volume of 1.5 billion cubic feet, allowing the dam to provide electrical power for 37,000 homes."',
    onExamine: () => 'A well-thumbed tourist guidebook about Flood Control Dam #3.'
  },

  wrench: {
    name: 'wrench',
    description: 'There is a wrench here.',
    takeable: true,
    onExamine: () => 'A large adjustable wrench.'
  },

  screwdriver: {
    name: 'screwdriver',
    description: 'There is a screwdriver here.',
    takeable: true,
    onExamine: () => 'A Phillips-head screwdriver.'
  },

  'air-pump': {
    name: 'hand-held air pump',
    description: 'There is a hand-held air pump here.',
    takeable: true,
    onExamine: () => 'A small hand-held air pump.'
  },

  'pile-of-plastic': {
    name: 'pile of plastic',
    description: 'There is a pile of folded plastic here.',
    takeable: true,
    inflated: false,
    onExamine: (ctx) => {
      return ctx.items['pile-of-plastic'].inflated
        ? 'An inflated rubber raft.'
        : 'A pile of folded plastic, presumably a deflated raft.'
    },
    onInflate: (ctx) => {
      if (ctx.items['pile-of-plastic'].inflated) return "It's already inflated."
      if (!ctx.inventory.includes('air-pump')) return "You don't have anything to inflate it with."
      ctx.items['pile-of-plastic'].inflated = true
      ctx.items['pile-of-plastic'].name = 'inflated raft'
      return 'The plastic inflates into a serviceable rubber raft.'
    }
  },

  'torch-dead-end': {
    name: 'ivory torch',
    description: 'There is an ivory torch here.',
    takeable: true,
    treasure: true,
    score: 6,
    on: false,
    onExamine: () => 'An ornate ivory torch.'
  },

  // Virtual / ambient items (always in context for global interactions)
  water: {
    name: 'quantity of water',
    description: 'There is some water here.',
    takeable: false,
    onExamine: () => "It's water."
  },

  grating: {
    name: 'grating',
    description: 'There is an iron grating here.',
    takeable: false,
    fixed: true,
    onExamine: (ctx) => {
      return ctx.flags.gratingUnlocked
        ? 'The grating is open.'
        : 'The grating is locked from above.'
    },
    onUnlock: (ctx) => {
      if (ctx.flags.gratingUnlocked) return 'The grating is already unlocked.'
      if (ctx.inventory.includes('rusty-key')) {
        ctx.flags.gratingUnlocked = true
        return 'The grating is now unlocked.'
      }
      return "You don't have the right key."
    }
  },

  'trap-door': {
    name: 'trap door',
    description: 'There is a trap door in the floor.',
    takeable: false,
    fixed: true,
    open: false,
    onOpen: (ctx) => {
      if (!ctx.flags.rugMoved) return "You don't see a trap door here."
      ctx.items['trap-door'].open = true
      return 'The trap door opens, revealing a staircase leading down into darkness.'
    },
    onClose: (ctx) => {
      ctx.items['trap-door'].open = false
      return 'The trap door is now closed.'
    },
    onExamine: (ctx) => {
      if (!ctx.flags.rugMoved) return "You don't see any trap door."
      return ctx.items['trap-door'].open ? 'The trap door is open.' : 'The trap door is closed.'
    }
  }
}

// Score thresholds
export const SCORE_RANKS = [
  [0, 'Beginner'],
  [25, 'Amateur Adventurer'],
  [50, 'Novice Adventurer'],
  [100, 'Junior Adventurer'],
  [150, 'Adventurer'],
  [200, 'Master Adventurer'],
  [250, 'Wizard'],
  [300, 'Master'],
  [350, 'Dungeon Master']
]

export function getRank(score) {
  let rank = SCORE_RANKS[0][1]
  for (const [threshold, name] of SCORE_RANKS) {
    if (score >= threshold) rank = name
  }
  return rank
}
