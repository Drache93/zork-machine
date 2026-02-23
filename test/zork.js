// test.js — Zork engine tests using brittle
// Run: node test.js

import test from 'brittle'
import { buildInitialContext } from './zork-machine.js'
import { parse } from './parser.js'
import { rooms } from './rooms.js'
import * as engine from './engine.js'

// Run a text command against context using the engine directly
function exec(ctx, input) {
  const cmd = parse(input)
  if (!cmd) return ''
  ctx.moves++
  ctx.lastCommand = cmd
  if (cmd.verb === 'go') return engine.handleMove(ctx, cmd.noun)
  if (cmd.verb === 'look')
    return rooms[ctx.currentRoom].name + '\n' + engine.describeRoom(ctx, true)
  if (cmd.verb === 'examine') return engine.handleExamine(ctx, cmd.noun)
  if (cmd.verb === 'read') return engine.handleRead(ctx, cmd.noun)
  if (cmd.verb === 'search') return engine.handleSearch(ctx, cmd.noun)
  if (cmd.verb === 'take') return engine.handleTake(ctx, cmd.noun)
  if (cmd.verb === 'drop') return engine.handleDrop(ctx, cmd.noun)
  if (cmd.verb === 'inventory') return engine.handleInventory(ctx)
  if (cmd.verb === 'put') return engine.handlePut(ctx, cmd.noun, cmd.indirect)
  if (cmd.verb === 'open') return engine.handleOpen(ctx, cmd.noun)
  if (cmd.verb === 'close') return engine.handleClose(ctx, cmd.noun)
  if (cmd.verb === 'turn_on') return engine.handleTurnOn(ctx, cmd.noun)
  if (cmd.verb === 'turn_off') return engine.handleTurnOff(ctx, cmd.noun)
  if (cmd.verb === 'move_item') return engine.handleMoveItem(ctx, cmd.noun)
  if (cmd.verb === 'attack') return engine.handleAttack(ctx, cmd.noun, cmd.indirect)
  if (cmd.verb === 'climb') return engine.handleClimb(ctx, cmd.noun)
  if (cmd.verb === 'score') return engine.handleScore(ctx)
  if (cmd.verb === 'help') return engine.handleHelp()
  if (cmd.verb === 'xyzzy') return engine.handleXyzzy()
  return '?'
}

// ============================================================
// Startup
// ============================================================

test('starts at west-of-house', (t) => {
  const ctx = buildInitialContext()
  t.is(ctx.currentRoom, 'west-of-house')
})

test('look describes starting room', (t) => {
  const ctx = buildInitialContext()
  const out = exec(ctx, 'look')
  t.ok(out.includes('West of House'))
  t.ok(out.includes('white house'))
  t.ok(out.includes('mailbox'))
})

// ============================================================
// Movement
// ============================================================

test('go north moves to north-of-house', (t) => {
  const ctx = buildInitialContext()
  const out = exec(ctx, 'north')
  t.is(ctx.currentRoom, 'north-of-house')
  t.ok(out.includes('North of House'))
})

test('shortcut directions work', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  t.is(ctx.currentRoom, 'north-of-house')
  exec(ctx, 'e')
  t.is(ctx.currentRoom, 'behind-house')
  exec(ctx, 'w')
  t.is(ctx.currentRoom, 'kitchen')
})

test('cannot go east from west-of-house (boarded door)', (t) => {
  const ctx = buildInitialContext()
  const out = exec(ctx, 'east')
  t.is(ctx.currentRoom, 'west-of-house')
  t.ok(out.includes("can't go"))
})

test('tracks visited rooms and increments score', (t) => {
  const ctx = buildInitialContext()
  const startScore = ctx.score
  exec(ctx, 'north')
  t.ok(ctx.score > startScore)
})

// ============================================================
// Items
// ============================================================

test('open mailbox reveals leaflet', (t) => {
  const ctx = buildInitialContext()
  const out = exec(ctx, 'open mailbox')
  t.ok(out.includes('leaflet'))
  t.is(ctx.items['mailbox'].open, true)
})

test('take leaflet from open mailbox', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'open mailbox')
  const out = exec(ctx, 'take leaflet')
  t.ok(out.includes('Taken'))
  t.ok(ctx.inventory.includes('leaflet'))
})

test('read leaflet shows welcome text', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'open mailbox')
  exec(ctx, 'take leaflet')
  const out = exec(ctx, 'read leaflet')
  t.ok(out.includes('WELCOME TO ZORK'))
})

test("can't take fixed items", (t) => {
  const ctx = buildInitialContext()
  const out = exec(ctx, 'take mailbox')
  t.ok(out.includes("can't take"))
})

test('take sword from living room', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'e') // behind-house
  exec(ctx, 'w') // kitchen (through open window)
  exec(ctx, 'w') // living room
  t.is(ctx.currentRoom, 'living-room')
  const out = exec(ctx, 'take sword')
  t.ok(out.includes('Taken'))
  t.ok(ctx.inventory.includes('sword'))
})

test('inventory shows carried items', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'open mailbox')
  exec(ctx, 'take leaflet')
  const out = exec(ctx, 'inventory')
  t.ok(out.includes('leaflet'))
})

test('drop item leaves it in room', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'open mailbox')
  exec(ctx, 'take leaflet')
  exec(ctx, 'drop leaflet')
  t.absent(ctx.inventory.includes('leaflet'))
  t.ok(ctx.rooms['west-of-house'].items.includes('leaflet'))
})

// ============================================================
// Lantern & Darkness
// ============================================================

test('lantern can be turned on', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'e')
  exec(ctx, 'w')
  exec(ctx, 'w') // living room
  exec(ctx, 'take lantern')
  const out = exec(ctx, 'turn on lantern')
  t.ok(out.includes('now on'))
  t.is(ctx.items['lantern'].on, true)
})

// ============================================================
// Rug & Trap Door
// ============================================================

test('move rug reveals trap door', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'e')
  exec(ctx, 'w')
  exec(ctx, 'w') // living room
  const out = exec(ctx, 'move rug')
  t.ok(out.includes('trap door'))
  t.is(ctx.flags.rugMoved, true)
})

test('can go down after moving rug', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'e')
  exec(ctx, 'w')
  exec(ctx, 'w') // living room
  exec(ctx, 'take lantern')
  exec(ctx, 'turn on lantern')
  exec(ctx, 'move rug')
  exec(ctx, 'down')
  t.is(ctx.currentRoom, 'cellar')
})

test("can't go down without moving rug", (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'e')
  exec(ctx, 'w')
  exec(ctx, 'w') // living room
  const out = exec(ctx, 'down')
  t.is(ctx.currentRoom, 'living-room')
  t.ok(out.includes("can't go"))
})

// ============================================================
// Combat
// ============================================================

test('troll blocks passage', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'e')
  exec(ctx, 'w')
  exec(ctx, 'w')
  exec(ctx, 'take sword')
  exec(ctx, 'take lantern')
  exec(ctx, 'turn on lantern')
  exec(ctx, 'move rug')
  exec(ctx, 'd')
  exec(ctx, 'n')
  t.is(ctx.currentRoom, 'troll-room')
  const out = exec(ctx, 'east')
  t.ok(out.includes('troll'))
})

test('attack troll with sword resolves combat', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'e')
  exec(ctx, 'w')
  exec(ctx, 'w')
  exec(ctx, 'take sword')
  exec(ctx, 'take lantern')
  exec(ctx, 'turn on lantern')
  exec(ctx, 'move rug')
  exec(ctx, 'd')
  exec(ctx, 'n')
  let resolved = false
  for (let i = 0; i < 10; i++) {
    exec(ctx, 'attack troll with sword')
    if (ctx.flags.trollDefeated || ctx.health <= 0) {
      resolved = true
      break
    }
  }
  t.ok(resolved)
})

// ============================================================
// Sword Glow
// ============================================================

test('sword glows near troll', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'e')
  exec(ctx, 'w')
  exec(ctx, 'w')
  exec(ctx, 'take sword')
  exec(ctx, 'take lantern')
  exec(ctx, 'turn on lantern')
  exec(ctx, 'move rug')
  exec(ctx, 'd')
  exec(ctx, 'n') // enter troll room
  t.is(ctx.items['sword'].glowing, true)
})

// ============================================================
// Parser
// ============================================================

test('parser handles multi-word items', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'e')
  exec(ctx, 'w') // kitchen
  exec(ctx, 'take brown sack')
  t.ok(ctx.inventory.includes('brown-sack'))
})

test('examine shortcut x works', (t) => {
  const ctx = buildInitialContext()
  const out = exec(ctx, 'x mailbox')
  t.ok(out.includes('mailbox'))
})

test('help shows command list', (t) => {
  const ctx = buildInitialContext()
  const out = exec(ctx, 'help')
  t.ok(out.includes('Commands'))
  t.ok(out.includes('LOOK'))
})

test('score shows current score', (t) => {
  const ctx = buildInitialContext()
  const out = exec(ctx, 'score')
  t.ok(out.includes('score'))
})

test('xyzzy easter egg', (t) => {
  const ctx = buildInitialContext()
  const out = exec(ctx, 'xyzzy')
  t.ok(out.includes('Fool'))
})

test('compromise handles inflected verbs', (t) => {
  const grabbed = parse('grab the lantern')
  t.is(grabbed.verb, 'take')
  t.is(grabbed.noun, 'lantern')

  const fighting = parse('fight troll with sword')
  t.is(fighting.verb, 'attack')
  t.is(fighting.noun, 'troll')
  t.is(fighting.indirect, 'sword')
})

// ============================================================
// Leaves & Grating
// ============================================================

test('move leaves reveals grating', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n') // north-of-house
  exec(ctx, 'n') // forest-path
  exec(ctx, 'n') // clearing-1
  t.is(ctx.currentRoom, 'clearing-1')
  const out = exec(ctx, 'move leaves')
  t.ok(out.includes('grating'))
  t.is(ctx.flags.leavesSearched, true)
})

// ============================================================
// Trophy Case
// ============================================================

test('put treasure in trophy case scores points', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'n') // forest-path
  exec(ctx, 'u') // up a tree
  exec(ctx, 'take egg')
  exec(ctx, 'd') // back to forest-path
  exec(ctx, 's') // north-of-house
  exec(ctx, 'e') // behind-house
  exec(ctx, 'w') // kitchen
  exec(ctx, 'w') // living room
  t.ok(ctx.inventory.includes('jeweled-egg'))
  const scoreBefore = ctx.score
  const out = exec(ctx, 'put egg in case')
  t.ok(out.includes('Placed') || out.includes('trophy'))
  t.ok(ctx.score > scoreBefore)
  t.ok(ctx.items['trophy-case'].contains.includes('jeweled-egg'))
})

// ============================================================
// Tree & Egg
// ============================================================

test('climb tree in forest-path', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'n') // forest-path
  exec(ctx, 'climb tree')
  t.is(ctx.currentRoom, 'up-a-tree')
})

test('take egg from birds nest', (t) => {
  const ctx = buildInitialContext()
  exec(ctx, 'n')
  exec(ctx, 'n') // forest-path
  exec(ctx, 'u') // up a tree
  exec(ctx, 'take nest')
  exec(ctx, 'take egg')
  t.ok(ctx.inventory.includes('jeweled-egg') || ctx.inventory.includes('birds-nest'))
})
