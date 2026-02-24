// Zork I - Room definitions
// Each room has: name, description, exits, items, and optional special behavior

export const rooms = {
  'west-of-house': {
    name: 'West of House',
    description:
      'You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here.',
    exits: {
      north: 'north-of-house',
      south: 'south-of-house',
      west: 'forest-1',
      east: null // boarded door
    },
    items: ['mailbox'],
    onLook: (ctx) => {
      const mailbox = ctx.items['mailbox']
      if (mailbox.open && ctx.rooms['west-of-house'].items.includes('leaflet')) {
        return 'You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here. The mailbox is open and contains a leaflet.'
      }
      if (mailbox.open) {
        return 'You are standing in an open field west of a white house, with a boarded front door. There is a small mailbox here. The mailbox is open but empty.'
      }
      return null // use default
    }
  },

  'north-of-house': {
    name: 'North of House',
    description:
      'You are facing the north side of a white house. There is no door here, and all the windows are boarded up. A narrow path winds north through the forest.',
    exits: {
      west: 'west-of-house',
      east: 'behind-house',
      north: 'forest-path'
    },
    items: []
  },

  'south-of-house': {
    name: 'South of House',
    description:
      'You are facing the south side of a white house. There is no door here, and all the windows are boarded up.',
    exits: {
      west: 'west-of-house',
      east: 'behind-house',
      south: 'forest-2'
    },
    items: []
  },

  'behind-house': {
    name: 'Behind House',
    description:
      'You are behind the white house. A path leads into the forest to the east. In one corner of the house there is a small window which is slightly ajar.',
    exits: {
      north: 'north-of-house',
      south: 'south-of-house',
      east: 'clearing-1',
      west: 'kitchen' // through window
    },
    items: [],
    onEnterMsg: (ctx, from) => {
      if (from === 'kitchen') return 'You climb out through the kitchen window.'
      return null
    }
  },

  kitchen: {
    name: 'Kitchen',
    description:
      'You are in the kitchen of the white house. A table seems to have been used recently for the preparation of food. A passage leads to the west and a dark staircase can be seen leading upward. A dark chimney leads down and to the east is a small window which is open.',
    exits: {
      west: 'living-room',
      up: 'attic',
      east: 'behind-house', // through window
      down: 'studio' // chimney, only if small enough - simplified
    },
    items: ['brown-sack', 'bottle'],
    firstVisit: true
  },

  attic: {
    name: 'Attic',
    description:
      'This is the attic. The only exit is a stairway leading down. A large coil of rope is lying in the corner. There is a nasty-looking knife here.',
    exits: {
      down: 'kitchen'
    },
    items: ['rope', 'nasty-knife']
  },

  'living-room': {
    name: 'Living Room',
    description:
      'You are in the living room. There is a doorway to the east, and a wooden door with strange gothic lettering to the west, which appears to be nailed shut.',
    exits: {
      east: 'kitchen',
      west: null, // nailed shut
      down: 'cellar'
    },
    items: ['sword', 'lantern', 'trophy-case'],
    onLook: (ctx) => {
      let desc =
        'You are in the living room. There is a doorway to the east, a wooden door with strange gothic lettering to the west, which appears to be nailed shut, a trophy case, and a large oriental rug in the center of the room.'
      if (ctx.flags.rugMoved) {
        desc += ' With the rug moved aside, a trap door is revealed in the floor.'
      }
      const roomItems = ctx.rooms['living-room'].items
      if (roomItems.includes('sword')) {
        desc += ' Above the trophy case hangs an elvish sword of great antiquity.'
      }
      if (roomItems.includes('lantern')) {
        desc += ' A battery-powered brass lantern is on the trophy case.'
      }
      return desc
    }
  },

  cellar: {
    name: 'Cellar',
    description:
      'You are in a dark and damp cellar with a narrow passageway leading north, and a crawlway to the south. To the west is the bottom of a steep metal ramp which is unclimbable.',
    exits: {
      north: 'troll-room',
      south: 'east-of-chasm',
      up: 'living-room'
    },
    items: [],
    dark: true
  },

  'troll-room': {
    name: 'Troll Room',
    description:
      'This is a small room with passages to the east and south and a forbidding hole leading west. Bloodstains and deep scratches (perhaps made by straining at some enormous chain) mar the walls.',
    exits: {
      south: 'cellar',
      east: 'east-west-passage',
      west: 'maze-1'
    },
    items: ['troll']
  },

  'east-west-passage': {
    name: 'East-West Passage',
    description:
      'You are in a narrow east-west passageway. There is a narrow stairway leading up at the north end of the room.',
    exits: {
      west: 'troll-room',
      east: 'round-room',
      north: 'chasm'
    },
    items: [],
    dark: true
  },

  'round-room': {
    name: 'Round Room',
    description:
      'You are in a circular stone room with passages in all directions. Several of them have unfortunately been blocked by cave-ins.',
    exits: {
      north: 'north-south-passage',
      south: 'south-passage',
      east: 'loud-room',
      west: 'east-west-passage'
    },
    items: [],
    dark: true
  },

  'loud-room': {
    name: 'Loud Room',
    description:
      'This is a large room with a ceiling which cannot be detected from the ground. There is a narrow passage from east to west and a stone stairway leading upward. The room is deafeningly loud with an unidentifiable rushing sound. The east wall has been deeply scored with three parallel gashes.',
    exits: {
      west: 'round-room',
      up: 'damp-cave'
    },
    items: ['platinum-bar'],
    dark: true,
    onEnter: (ctx) => {
      ctx.flags.inLoudRoom = true
    },
    onLeave: (ctx) => {
      ctx.flags.inLoudRoom = false
    }
  },

  'damp-cave': {
    name: 'Damp Cave',
    description:
      'This cave has exits to the west and east, and narrows to a crack toward the south. The earth is particularly damp here.',
    exits: {
      west: 'loud-room',
      south: 'white-cliffs-north',
      east: 'white-cliffs-south'
    },
    items: [],
    dark: true
  },

  'north-south-passage': {
    name: 'North-South Passage',
    description: 'This is a high north-south passage, which forks to the northeast.',
    exits: {
      south: 'round-room',
      north: 'chasm',
      northeast: 'deep-canyon'
    },
    items: [],
    dark: true
  },

  chasm: {
    name: 'Chasm',
    description:
      'A chasm runs southwest to northeast and the path follows it. You are on the south side of the chasm, where a narrow path circles back to the west. A sturdy wooden bridge crosses the chasm.',
    exits: {
      southwest: 'north-south-passage',
      northeast: 'reservoir-south',
      north: 'reservoir-south' // across bridge
    },
    items: [],
    dark: true
  },

  'clearing-1': {
    name: 'Clearing',
    description:
      'You are in a clearing, with a forest surrounding you on all sides. A path leads south. On the ground is a pile of leaves.',
    exits: {
      north: 'forest-path',
      south: 'forest-2',
      east: 'canyon-view',
      west: 'behind-house'
    },
    items: ['pile-of-leaves'],
    onLook: (ctx) => {
      if (ctx.flags.leavesSearched) {
        return 'You are in a clearing, with a forest surrounding you on all sides. A path leads south. A grating is set into the ground.'
      }
      return null
    }
  },

  'forest-path': {
    name: 'Forest Path',
    description:
      'This is a path winding through a dimly lit forest. The path heads north-south here. One particularly large tree with some low branches stands at the edge of the path.',
    exits: {
      north: 'clearing-1',
      south: 'north-of-house',
      up: 'up-a-tree'
    },
    items: []
  },

  'up-a-tree': {
    name: 'Up a Tree',
    description:
      "You are about 10 feet above the ground nestled among some large branches. The nearest branch above you is beyond your reach. Beside you on the branch is a small bird's nest.",
    exits: {
      down: 'forest-path'
    },
    items: ['birds-nest']
  },

  'forest-1': {
    name: 'Forest',
    description:
      'This is a forest, with trees in all directions. To the east, there appears to be sunlight.',
    exits: {
      east: 'west-of-house',
      north: 'forest-path',
      south: 'forest-2',
      west: 'forest-3'
    },
    items: []
  },

  'forest-2': {
    name: 'Forest',
    description: 'This is a dimly lit forest, with large trees all around.',
    exits: {
      north: 'clearing-1',
      south: 'forest-1',
      east: 'south-of-house',
      west: 'forest-3'
    },
    items: []
  },

  'forest-3': {
    name: 'Dense Forest',
    description: 'The forest becomes so thick here that you can barely push your way through.',
    exits: {
      east: 'forest-1',
      south: 'forest-2',
      north: 'forest-1' // loops
    },
    items: []
  },

  'canyon-view': {
    name: 'Canyon View',
    description:
      'You are at the top of the Great Canyon, on its west wall. From here there is a marvelous view of the canyon and parts of the Frigid River below. Across the canyon, the walls of the White Cliffs join the mighty ramparts of the Flathead Mountains to the east. Following the canyon upstream to the north, Aragain Falls may be seen, complete with rainbow. The canyon path leads sharply down.',
    exits: {
      west: 'clearing-1',
      down: 'rocky-ledge'
    },
    items: []
  },

  'rocky-ledge': {
    name: 'Rocky Ledge',
    description:
      'You are on a ledge about halfway up the wall of the river canyon. You can see from here that the White Cliffs may be climbable further to the north. On the ledge there is a large chunk of coal.',
    exits: {
      up: 'canyon-view',
      down: 'canyon-bottom'
    },
    items: ['coal']
  },

  'canyon-bottom': {
    name: 'Canyon Bottom',
    description:
      'You are beneath the walls of the river canyon which may be climbable here. The path winds sharply through rocky passages. A rainbow crosses over the falls to the east.',
    exits: {
      up: 'rocky-ledge',
      north: 'end-of-rainbow'
    },
    items: []
  },

  'end-of-rainbow': {
    name: 'End of Rainbow',
    description:
      'You are on a small, rocky beach on the Frigid River, at the base of Aragain Falls. The beach is narrow due to the presence of the White Cliffs. The roar of the falls is nearly deafening. A rainbow spans the falls.',
    exits: {
      south: 'canyon-bottom',
      southwest: 'canyon-bottom'
    },
    items: ['pot-of-gold']
  },

  // --- Maze (simplified) ---
  'maze-1': {
    name: 'Maze',
    description: 'You are in a maze of twisty little passages, all alike.',
    exits: {
      north: 'maze-2',
      south: 'maze-3',
      east: 'troll-room',
      west: 'maze-4'
    },
    items: [],
    dark: true
  },

  'maze-2': {
    name: 'Maze',
    description: 'You are in a maze of twisty little passages, all alike.',
    exits: {
      south: 'maze-1',
      east: 'maze-5',
      west: 'maze-3'
    },
    items: ['skeleton', 'rusty-key'],
    dark: true
  },

  'maze-3': {
    name: 'Maze',
    description: 'You are in a maze of twisty little passages, all alike.',
    exits: {
      north: 'maze-1',
      south: 'maze-5',
      east: 'maze-2',
      west: 'maze-4'
    },
    items: [],
    dark: true
  },

  'maze-4': {
    name: 'Maze',
    description: 'You are in a maze of twisty little passages, all alike.',
    exits: {
      north: 'maze-3',
      south: 'dead-end-maze',
      east: 'maze-1'
    },
    items: [],
    dark: true
  },

  'maze-5': {
    name: 'Maze',
    description:
      'You are in a maze of twisty little passages, all alike. There is a dim light to the north.',
    exits: {
      north: 'grating-room',
      south: 'maze-3',
      west: 'maze-2'
    },
    items: [],
    dark: true
  },

  'dead-end-maze': {
    name: 'Dead End',
    description: 'You have come to a dead end in the maze.',
    exits: {
      north: 'maze-4'
    },
    items: ['torch-dead-end'],
    dark: true
  },

  'grating-room': {
    name: 'Grating Room',
    description:
      'You are in a small room near the south end of the Temple. There is a grating overhead, locked from above.',
    exits: {
      south: 'maze-5',
      up: 'clearing-1' // grating — guarded in state machine by gratingUnlocked flag
    },
    items: [],
    dark: true
  },

  // Extra underground rooms
  'south-passage': {
    name: 'South Passage',
    description: 'This is a narrow passage with a sharp bend to the south.',
    exits: {
      north: 'round-room',
      south: 'south-temple'
    },
    items: [],
    dark: true
  },

  'south-temple': {
    name: 'South Temple',
    description:
      'This is the southern end of a large temple. On the floor you can see a brass bell, a leather-bound book and a pair of candles.',
    exits: {
      north: 'south-passage'
    },
    items: ['brass-bell', 'candles', 'black-book'],
    dark: true
  },

  'deep-canyon': {
    name: 'Deep Canyon',
    description:
      'You are on the south edge of a deep canyon. Passages lead off in every direction.',
    exits: {
      southwest: 'north-south-passage',
      east: 'dam',
      north: 'reservoir-south'
    },
    items: [],
    dark: true
  },

  dam: {
    name: 'Dam',
    description:
      'You are standing on top of Flood Control Dam #3, which was quite a feat of engineering. To the north is a lake, stretching off into the distance. The sluice gates on the dam are closed. Behind the dam, to the south, a wide river stretches off into the distance.',
    exits: {
      south: 'dam-base',
      north: 'reservoir',
      west: 'deep-canyon',
      east: 'dam-lobby'
    },
    items: [],
    dark: true
  },

  'dam-lobby': {
    name: 'Dam Lobby',
    description:
      'This room appears to have been the waiting room for groups touring the dam. There are benches along the walls, and a great deal of graffiti on the walls.',
    exits: {
      west: 'dam',
      north: 'maintenance-room'
    },
    items: ['guidebook-zorkmid'],
    dark: true
  },

  'maintenance-room': {
    name: 'Maintenance Room',
    description:
      'This is what appears to have been the maintenance room for Flood Control Dam #3. Apparently, this area has been unused for quite some time. On the wall is a group of buttons colored blue, yellow, brown, and red. There is also a large wrench here.',
    exits: {
      south: 'dam-lobby'
    },
    items: ['wrench', 'screwdriver'],
    dark: true
  },

  'reservoir-south': {
    name: 'Reservoir South',
    description: 'You are in a long room on the south shore of a large body of water.',
    exits: {
      south: 'deep-canyon',
      southwest: 'chasm',
      east: 'dam'
    },
    items: [],
    dark: true
  },

  reservoir: {
    name: 'Reservoir',
    description:
      'You are on the reservoir. Luckily, it is possible to cross since the gates are closed.',
    exits: {
      south: 'dam',
      north: 'reservoir-north'
    },
    items: [],
    dark: true
  },

  'reservoir-north': {
    name: 'Reservoir North',
    description:
      'You are in a large cavernous room, on the north shore of a body of water. Far below, through an opening in the floor, you can see a stream.',
    exits: {
      south: 'reservoir'
    },
    items: ['air-pump'],
    dark: true
  },

  'dam-base': {
    name: 'Dam Base',
    description:
      'You are at the base of Flood Control Dam #3. A stream of water pours over the top of the dam and down the rocky cliff face.',
    exits: {
      north: 'dam'
    },
    items: ['pile-of-plastic'],
    dark: true
  },

  'east-of-chasm': {
    name: 'East of Chasm',
    description:
      'You are on the east edge of a chasm, the bottom of which cannot be seen. The east wall is very rough and could perhaps be climbed, but it would be a very difficult and dangerous task.',
    exits: {
      north: 'cellar',
      east: 'gallery'
    },
    items: [],
    dark: true
  },

  gallery: {
    name: 'Gallery',
    description:
      'This is an art gallery. Most of the paintings have been stolen by the Thieves, but on the walls you can see a painting of unparalleled beauty.',
    exits: {
      west: 'east-of-chasm',
      north: 'studio'
    },
    items: ['painting'],
    dark: true
  },

  studio: {
    name: 'Studio',
    description:
      "This appears to have been an artist's studio. The walls are splashed with paint of 69 colors. Strangely enough, nothing of value is here.",
    exits: {
      south: 'gallery',
      up: 'kitchen' // chimney
    },
    items: [],
    dark: true
  },

  // Simplified white cliffs area
  'white-cliffs-north': {
    name: 'White Cliffs Beach (North)',
    description:
      'You are on a rocky beach at the foot of the White Cliffs. The cliffs here are unclimbable.',
    exits: {
      south: 'white-cliffs-south',
      north: 'damp-cave'
    },
    items: [],
    dark: true
  },

  'white-cliffs-south': {
    name: 'White Cliffs Beach (South)',
    description: 'You are on a narrow strip of beach between the river and the White Cliffs.',
    exits: {
      north: 'white-cliffs-north',
      west: 'damp-cave'
    },
    items: [],
    dark: true
  }
}

// Guarded exits: movement that requires a flag/condition to pass.
// Used by both the state machine (go_<dir> transitions) and handleMove (COMMAND text path).
export const GUARDED_EXITS = {
  'living-room': {
    down: {
      guard: (ctx) => ctx.flags.rugMoved,
      blocked: "You can't go that way."
    }
  },
  'behind-house': {
    west: {
      guard: (ctx) => ctx.items['kitchen-window'].open,
      blocked: 'The window is closed.'
    }
  },
  'troll-room': {
    east: {
      guard: (ctx) => ctx.flags.trollDefeated,
      blocked: 'The troll fends you off with a menacing gesture.'
    },
    west: {
      guard: (ctx) => ctx.flags.trollDefeated,
      blocked: 'The troll fends you off with a menacing gesture.'
    }
  },
  'grating-room': {
    up: {
      guard: (ctx) => ctx.flags.gratingUnlocked,
      blocked: 'The grating is locked.'
    }
  }
}
