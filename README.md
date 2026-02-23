# Zork Coremachine

Zork I: The Great Underground Empire, reimplemented as a streaming state machine using [Coremachine](https://github.com/mkabanern/coremachine).

```
input stream  →  Coremachine (Zork)  →  output stream
  (text)           (state machine)        (state + text)
```

## Architecture

The key design insight: Coremachine's state machine states represent **game phases** (`playing`, `dead`, `victory`), while all actual game world state lives in **context** — rooms, items, inventory, position, flags, score.

```
┌──────────────────────────────────────────────────────┐
│ Coremachine (Duplex Stream)                          │
│                                                      │
│  WRITE SIDE                      READ SIDE           │
│  { action: 'COMMAND',    →    { state: 'playing',    │
│    value: { text } }          context: {             │
│                                  output: '...',      │
│                                  currentRoom,        │
│                                  inventory,          │
│                                  score, ...          │
│                                }}                    │
│                                                      │
│  Machine States: playing | dead | victory            │
│  Context: entire game world (rooms, items, flags)    │
│  Hypercore: append-only history (undo/redo/replay)   │
└──────────────────────────────────────────────────────┘
```

### Why this works

- **Stream-native**: Coremachine is a Duplex stream. Pipe text commands in, pipe state changes out. Plugs directly into Cellery or any streaming pipeline.
- **Persistent**: Every action is appended to Hypercore. Close the game, reopen it — state is restored. Time-travel with `backward()`/`forward()`.
- **Distributed**: Since it's Hypercore, the game state can sync between peers. Spectate a game, or build a shared adventure.
- **Renderer-agnostic**: The output is structured data (`{ state, context }`). Render it as TUI, HTML, React, native — whatever.

## Quick Start

### Play without Hypercore (pure streams)

```bash
node example-pipeline.js
```

### Play with Coremachine + Hypercore persistence

```bash
npm install coremachine corestore
node example-coremachine.js
```

### Run tests

```bash
node test.js
```

## Usage with Coremachine

```javascript
import Corestore from 'corestore'
import { Zork } from './zork-machine.js'

const store = new Corestore('./zork-save')
const zork = Zork(store)

// Write commands in
zork.write({ action: 'COMMAND', value: { text: 'open mailbox' } })

// Read state changes out
zork.on('data', ({ state, context }) => {
  console.log(context.output) // "Opening the small mailbox reveals a leaflet."
  console.log(context.score) // 0
  console.log(context.inventory) // []
})

// Or pipe it
inputStream.pipe(zork).pipe(rendererStream)
```

## Usage with Cellery

```javascript
// Input Cell → Zork Machine → Render Cell
inputCell.pipe(coremachine).pipe(renderCell)
```

See `cellery-cell.js` for a detailed integration sketch.

## Usage as pure engine (no streams)

```javascript
import { buildInitialContext, hydrateContext, dispatch } from './zork-machine.js'

const ctx = buildInitialContext()
hydrateContext(ctx)

const output = dispatch(ctx, 'open mailbox')
// → "Opening the small mailbox reveals a leaflet."

const output2 = dispatch(ctx, 'take leaflet')
// → "Taken."

console.log(ctx.inventory) // ['leaflet']
```

## Game Content

### Rooms (~40 rooms)

- **Above ground**: West/North/South/Behind House, Kitchen, Living Room, Attic, Forest areas, Clearing, Canyon View, Rocky Ledge, Canyon Bottom, End of Rainbow, Up a Tree
- **Underground**: Cellar, Troll Room, East-West Passage, Round Room, Loud Room, Damp Cave, North-South Passage, Chasm, Deep Canyon, Dam, Dam Lobby, Maintenance Room, Reservoir, Gallery, Studio, South Temple
- **Maze**: 5 maze rooms + dead end + grating room

### Items & Treasures

- **Tools**: Sword (glows near enemies), Lantern (limited battery), Rope, Knife, Wrench, Screwdriver, Air Pump, Rusty Key
- **Treasures**: Jeweled Egg (5pts), Platinum Bar (10pts), Painting (6pts), Pot of Gold (10pts), Ivory Torch (6pts)
- **Interactables**: Mailbox, Trophy Case, Rug/Trap Door, Pile of Leaves/Grating, Brown Sack, Bottle, Bird's Nest, Brass Bell, Candles, Black Book, Guidebook

### Features

- Natural language parser (handles aliases, multi-word items, prepositions)
- Darkness system (lantern required underground, grue death)
- Combat (troll fight with weapon damage system)
- Sword glow near enemies
- Container system (open/close, items inside items)
- Trophy case scoring
- Puzzle flags (rug, leaves, grating, etc.)
- Easter eggs (xyzzy, plugh, hello sailor)

## File Structure

```
zork-machine/
├── zork-machine.js        # Main export — Coremachine definition factory
├── rooms.js               # Room definitions (exits, descriptions, conditions)
├── items.js               # Item definitions (properties, handlers, treasures)
├── parser.js              # Natural language command parser
├── engine.js              # Game logic (movement, items, combat, etc.)
├── example-coremachine.js # Full Coremachine + Hypercore example
├── example-pipeline.js    # Pure streaming pipeline (no Hypercore)
├── cellery-cell.js        # Cellery Cell integration sketch
├── test.js                # Test suite + demo walkthrough
└── package.json
```

## Extending

### Add a room

```javascript
// In rooms.js
'treasure-room': {
  name: 'Treasure Room',
  description: 'A room full of glittering treasures.',
  exits: { south: 'round-room' },
  items: ['diamond'],
  dark: true  // requires light source
}
```

### Add an item

```javascript
// In items.js
'diamond': {
  name: 'huge diamond',
  description: 'There is an enormous diamond here.',
  takeable: true,
  treasure: true,
  score: 15,
  onExamine: () => 'A flawless diamond the size of your fist.'
}
```

### Add a parser alias

```javascript
// In parser.js ITEM_ALIASES
diamond: 'diamond', gem: 'diamond'
```

### Add a custom interaction

Items can have handler functions for any verb:

```javascript
'magic-mirror': {
  name: 'magic mirror',
  onExamine: (ctx) => {
    if (ctx.inventory.includes('sword')) {
      return 'You see a brave adventurer wielding a glowing sword.'
    }
    return 'You see a scared-looking adventurer.'
  },
  onUse: (ctx, target) => {
    // Custom logic
  }
}
```

## Serialization Note

Coremachine persists state to Hypercore as JSON. Since JSON strips functions, the engine re-attaches handler functions from the item/room definitions via `hydrateContext()` on every action. This means the game data definitions are the source of truth for behavior, while Hypercore stores the mutable state (positions, flags, inventory, etc.).

## License

MIT

Game content inspired by Zork I: The Great Underground Empire by Infocom (1980).
ZORK is a registered trademark of Infocom, Inc.
