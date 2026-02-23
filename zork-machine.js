// zork-machine.js
// Coremachine state machine definition for Zork I
//
// Architecture:
//   Each room is a state. Movement = real state transition.
//   All non-movement actions live on states.all (universal catch-all).
//   Context = serializable game world state (no functions stored in ctx).
//   Item/room handlers are looked up from module-scope definitions at call time.

import { rooms, GUARDED_EXITS } from './rooms.js'
import { items } from './items.js'
import { parse } from './parser.js'
import * as engine from './engine.js'

// Build initial game context from room/item definitions.
// Context is plain JSON — no functions, no Sets.
export function buildInitialContext() {
  const itemState = {}
  for (const [id, def] of Object.entries(items)) {
    // Copy only serializable (non-function) properties
    const state = {}
    for (const [key, val] of Object.entries(def)) {
      if (typeof val !== 'function') state[key] = val
    }
    itemState[id] = state
  }

  const roomState = {}
  for (const [id, def] of Object.entries(rooms)) {
    roomState[id] = {
      items: [...(def.items || [])],
      exits: { ...def.exits },
      visited: false
    }
  }

  return {
    currentRoom: 'west-of-house',
    inventory: [],
    maxInventory: 8,
    rooms: roomState,
    items: itemState,
    flags: {
      rugMoved: false,
      trollDefeated: false,
      leavesSearched: false,
      gratingUnlocked: false,
      eggOpened: false,
      eggDamaged: false,
      inLoudRoom: false
    },
    health: 10,
    maxHealth: 10,
    score: 0,
    moves: 0,
    darkMoves: 0,
    visitedRooms: ['west-of-house'], // plain array — no Set needed
    output: '',
    gameOver: false,
    won: false,
    lastCommand: null
  }
}

// Generate room states from rooms.js definitions.
// Each room gets go_<dir> transitions for its exits, plus dead/victory states.
function buildRoomStates() {
  const states = {}

  for (const [roomId, roomDef] of Object.entries(rooms)) {
    const on = {}

    for (const [dir, target] of Object.entries(roomDef.exits || {})) {
      const event = 'go_' + dir
      const guarded = GUARDED_EXITS[roomId]?.[dir]

      if (!target) {
        // Null exit — blocked direction, self-transition
        on[event] = {
          target: roomId,
          action(ctx) {
            ctx.output = "You can't go that way."
          }
        }
      } else if (guarded) {
        // Guarded exit — machine commits to target, but we reset ctx.currentRoom on failure
        on[event] = {
          target: target,
          action(ctx) {
            const from = ctx.currentRoom
            if (guarded.guard(ctx)) {
              ctx.output = engine.arriveAt(ctx, target)
            } else {
              ctx.currentRoom = from // reset — guard failed
              ctx.output = guarded.blocked
            }
          }
        }
      } else {
        // Normal exit — transition to target room
        on[event] = {
          target: target,
          action(ctx) {
            ctx.output = engine.arriveAt(ctx, target)
          }
        }
      }
    }

    states[roomId] = { on }
  }

  states.dead = {
    on: {
      RESTART: {
        target: 'west-of-house',
        action(ctx) {
          Object.assign(ctx, buildInitialContext())
          ctx.output =
            'ZORK I: The Great Underground Empire\nCopyright (c) 1981, 1982, 1983 Infocom, Inc.\n(Coremachine Edition)\n\n' +
            rooms['west-of-house'].name +
            '\n' +
            rooms['west-of-house'].description
        }
      }
    }
  }

  states.victory = {
    on: {
      RESTART: {
        target: 'west-of-house',
        action(ctx) {
          Object.assign(ctx, buildInitialContext())
          ctx.output =
            'Starting a new game...\n\n' +
            rooms['west-of-house'].name +
            '\n' +
            rooms['west-of-house'].description
        }
      }
    }
  }

  return states
}

// ============================================================
// COREMACHINE DEFINITION
// ============================================================

// createMachine is passed in by the consumer to avoid a hard dependency on coremachine.
export function createZorkMachine(createMachine) {
  return createMachine({
    initial: 'west-of-house',
    context: buildInitialContext(),
    states: {
      // states.all — universal actions available from any room.
      // No target = silent self-transition (machine state unchanged, no stream push).
      all: {
        on: {
          look: {
            action(ctx) {
              ctx.output = rooms[ctx.currentRoom].name + '\n' + engine.describeRoom(ctx, true)
            }
          },

          examine: {
            action(ctx, p) {
              ctx.output = engine.handleExamine(ctx, p && p.noun)
            }
          },

          read: {
            action(ctx, p) {
              ctx.output = engine.handleRead(ctx, p && p.noun)
            }
          },

          search: {
            action(ctx, p) {
              ctx.output = engine.handleSearch(ctx, p && p.noun)
            }
          },

          take: {
            action(ctx, p) {
              ctx.output = engine.handleTake(ctx, p && p.noun)
            }
          },

          drop: {
            action(ctx, p) {
              ctx.output = engine.handleDrop(ctx, p && p.noun)
            }
          },

          inventory: {
            action(ctx) {
              ctx.output = engine.handleInventory(ctx)
            }
          },

          put: {
            action(ctx, p) {
              ctx.output = engine.handlePut(ctx, p && p.noun, p && p.indirect)
            }
          },

          throw: {
            action(ctx, p) {
              ctx.output = engine.handleThrow(ctx, p && p.noun)
            }
          },

          open: {
            action(ctx, p) {
              ctx.output = engine.handleOpen(ctx, p && p.noun)
            }
          },

          close: {
            action(ctx, p) {
              ctx.output = engine.handleClose(ctx, p && p.noun)
            }
          },

          turn_on: {
            action(ctx, p) {
              ctx.output = engine.handleTurnOn(ctx, p && p.noun)
            }
          },

          turn_off: {
            action(ctx, p) {
              ctx.output = engine.handleTurnOff(ctx, p && p.noun)
            }
          },

          move_item: {
            action(ctx, p) {
              ctx.output = engine.handleMoveItem(ctx, p && p.noun)
            }
          },

          unlock: {
            action(ctx, p) {
              ctx.output = engine.handleUnlock(ctx, p && p.noun, p && p.indirect)
            }
          },

          lock: {
            action(ctx) {
              ctx.output = "You don't have the ability to lock that."
            }
          },

          light: {
            action(ctx, p) {
              ctx.output = engine.handleLight(ctx, p && p.noun)
            }
          },

          inflate: {
            action(ctx, p) {
              ctx.output = engine.handleInflate(ctx, p && p.noun)
            }
          },

          ring: {
            action(ctx, p) {
              ctx.output = engine.handleRing(ctx, p && p.noun)
            }
          },

          eat: {
            action(ctx, p) {
              ctx.output = engine.handleEat(ctx, p && p.noun)
            }
          },

          drink: {
            action(ctx) {
              ctx.output = "You take a drink. It's refreshing."
            }
          },

          use: {
            action(ctx, p) {
              ctx.output = engine.handleUse(ctx, p && p.noun, p && p.indirect)
            }
          },

          wave: {
            action(ctx, p) {
              ctx.output = engine.handleWave(ctx, p && p.noun)
            }
          },

          attack: {
            action(ctx, p) {
              ctx.output = engine.handleAttack(ctx, p && p.noun, p && p.indirect)
            }
          },

          climb: {
            action(ctx, p) {
              ctx.output = engine.handleClimb(ctx, p && p.noun)
            }
          },

          score: {
            action(ctx) {
              ctx.output = engine.handleScore(ctx)
            }
          },

          wait: {
            action(ctx) {
              ctx.output = engine.handleWait()
            }
          },

          diagnose: {
            action(ctx) {
              ctx.output = engine.handleDiagnose(ctx)
            }
          },

          help: {
            action(ctx) {
              ctx.output = engine.handleHelp()
            }
          },

          hello: {
            action(ctx) {
              ctx.output = engine.handleHello()
            }
          },

          shout: {
            action(ctx) {
              ctx.output = engine.handleShout()
            }
          },

          pray: {
            action(ctx) {
              ctx.output = engine.handlePray(ctx)
            }
          },

          xyzzy: {
            action(ctx) {
              ctx.output = engine.handleXyzzy()
            }
          },

          plugh: {
            action(ctx) {
              ctx.output = engine.handlePlugh()
            }
          },

          save: {
            action(ctx) {
              ctx.output = 'Game state is automatically saved to Hypercore after every action.'
            }
          },

          restore: {
            action(ctx) {
              ctx.output = 'Use coremachine.backward() to step back through history.'
            }
          },

          quit: {
            action(ctx) {
              ctx.output = engine.handleScore(ctx) + '\nThank you for playing ZORK!'
            }
          },

          // COMMAND — raw text input. Parse it and dispatch to the right handler.
          // Movement via text uses handleMove (which calls arriveAt).
          // Machine state won't update for text-path movement — ctx.currentRoom is authoritative.
          COMMAND: {
            action(ctx, payload) {
              const text = typeof payload === 'string' ? payload : payload && payload.text
              const cmd = parse(text)
              if (!cmd) {
                ctx.output = 'I beg your pardon?'
                return
              }
              ctx.moves++
              ctx.lastCommand = cmd

              switch (cmd.verb) {
                case 'go':
                  ctx.output = engine.handleMove(ctx, cmd.noun)
                  break
                case 'look':
                  ctx.output = rooms[ctx.currentRoom].name + '\n' + engine.describeRoom(ctx, true)
                  break
                case 'examine':
                  ctx.output = engine.handleExamine(ctx, cmd.noun)
                  break
                case 'read':
                  ctx.output = engine.handleRead(ctx, cmd.noun)
                  break
                case 'search':
                  ctx.output = engine.handleSearch(ctx, cmd.noun)
                  break
                case 'take':
                  ctx.output = engine.handleTake(ctx, cmd.noun)
                  break
                case 'drop':
                  ctx.output = engine.handleDrop(ctx, cmd.noun)
                  break
                case 'inventory':
                  ctx.output = engine.handleInventory(ctx)
                  break
                case 'put':
                  ctx.output = engine.handlePut(ctx, cmd.noun, cmd.indirect)
                  break
                case 'throw':
                  ctx.output = engine.handleThrow(ctx, cmd.noun)
                  break
                case 'open':
                  ctx.output = engine.handleOpen(ctx, cmd.noun)
                  break
                case 'close':
                  ctx.output = engine.handleClose(ctx, cmd.noun)
                  break
                case 'turn_on':
                  ctx.output = engine.handleTurnOn(ctx, cmd.noun)
                  break
                case 'turn_off':
                  ctx.output = engine.handleTurnOff(ctx, cmd.noun)
                  break
                case 'move_item':
                  ctx.output = engine.handleMoveItem(ctx, cmd.noun)
                  break
                case 'unlock':
                  ctx.output = engine.handleUnlock(ctx, cmd.noun, cmd.indirect)
                  break
                case 'lock':
                  ctx.output = "You don't have the ability to lock that."
                  break
                case 'light':
                  ctx.output = engine.handleLight(ctx, cmd.noun)
                  break
                case 'inflate':
                  ctx.output = engine.handleInflate(ctx, cmd.noun)
                  break
                case 'ring':
                  ctx.output = engine.handleRing(ctx, cmd.noun)
                  break
                case 'eat':
                  ctx.output = engine.handleEat(ctx, cmd.noun)
                  break
                case 'drink':
                  ctx.output = "You take a drink. It's refreshing."
                  break
                case 'use':
                  ctx.output = engine.handleUse(ctx, cmd.noun, cmd.indirect)
                  break
                case 'wave':
                  ctx.output = engine.handleWave(ctx, cmd.noun)
                  break
                case 'attack':
                  ctx.output = engine.handleAttack(ctx, cmd.noun, cmd.indirect)
                  break
                case 'climb':
                  ctx.output = engine.handleClimb(ctx, cmd.noun)
                  break
                case 'score':
                  ctx.output = engine.handleScore(ctx)
                  break
                case 'wait':
                  ctx.output = engine.handleWait()
                  break
                case 'diagnose':
                  ctx.output = engine.handleDiagnose(ctx)
                  break
                case 'help':
                  ctx.output = engine.handleHelp()
                  break
                case 'hello':
                  ctx.output = engine.handleHello()
                  break
                case 'shout':
                  ctx.output = engine.handleShout()
                  break
                case 'pray':
                  ctx.output = engine.handlePray(ctx)
                  break
                case 'xyzzy':
                  ctx.output = engine.handleXyzzy()
                  break
                case 'plugh':
                  ctx.output = engine.handlePlugh()
                  break
                case 'save':
                  ctx.output = 'Game state is automatically saved to Hypercore after every action.'
                  break
                case 'restore':
                  ctx.output = 'Use coremachine.backward() to step back through history.'
                  break
                case 'quit':
                  ctx.output = engine.handleScore(ctx) + '\nThank you for playing ZORK!'
                  break
                default:
                  ctx.output = "I don't understand that command. Type HELP for a list of commands."
              }

              if (ctx.health <= 0) {
                ctx.gameOver = true
                ctx.output +=
                  '\n\n    **** You have died ****\n\nYour score is ' +
                  ctx.score +
                  ' out of 350, in ' +
                  ctx.moves +
                  ' moves.'
              }
            }
          },

          // start — called on machine open when restoring from Hypercore.
          // Context is already plain JSON, nothing to hydrate.
          start: {
            action(ctx) {
              // No-op: ctx is plain serializable JSON.
              // visitedRooms is stored as array throughout.
            }
          }
        }
      },

      ...buildRoomStates()
    }
  })
}

// Export for consumers
export { rooms } from './rooms.js'
export { items, getRank } from './items.js'
export { parse } from './parser.js'
