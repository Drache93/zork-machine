// Game engine - processes parsed commands against context
// This is pure function: (ctx, command) => output string
// The Coremachine action handlers call into this

import { rooms, GUARDED_EXITS } from './rooms.js'
import { items, getRank } from './items.js'

// ============================================================
// DARKNESS
// ============================================================

function isDark(ctx) {
  const roomDef = rooms[ctx.currentRoom]
  if (!roomDef || !roomDef.dark) return false
  // Light if lantern is on and in inventory or room
  if (ctx.items['lantern'].on) {
    if (ctx.inventory.includes('lantern')) return false
    if (ctx.rooms[ctx.currentRoom].items.includes('lantern')) return false
  }
  // Light if candles are lit
  if (ctx.items['candles']?.lit) {
    if (ctx.inventory.includes('candles')) return false
    if (ctx.rooms[ctx.currentRoom].items.includes('candles')) return false
  }
  return true
}

const DARK_MSG = 'It is pitch black. You are likely to be eaten by a grue.'
const DARK_MOVE_DEATH = 'Oh no! You have walked into the slavering fangs of a lurking grue!'

// ============================================================
// ROOM DESCRIPTION
// ============================================================

export function describeRoom(ctx, verbose) {
  if (isDark(ctx)) return DARK_MSG

  const roomDef = rooms[ctx.currentRoom]
  if (!roomDef) return 'You are in an unknown place.'

  // Check for custom onLook
  const custom = roomDef.onLook?.(ctx)
  let desc = custom || roomDef.description

  // Add room items (only visible ones, excluding fixed room fixtures already in description)
  const roomItems = ctx.rooms[ctx.currentRoom].items || []
  const itemDescs = []
  for (const itemId of roomItems) {
    const itemDef = ctx.items[itemId]
    if (itemDef && !itemDef.fixed && itemDef.description) {
      itemDescs.push(itemDef.description)
    }
  }
  if (itemDescs.length > 0) {
    desc += '\n' + itemDescs.join('\n')
  }

  return desc
}

// ============================================================
// MOVEMENT
// ============================================================

export function handleMove(ctx, direction) {
  const roomDef = rooms[ctx.currentRoom]
  if (!roomDef) return "You can't go anywhere from here."

  // "enter window" / "go window" → use the actual exit direction
  if (direction === 'kitchen-window' || direction === 'window') {
    if (ctx.currentRoom === 'behind-house') direction = 'west'
    else if (ctx.currentRoom === 'kitchen') direction = 'east'
  }

  // Check for exit
  const exitTarget = roomDef.exits[direction]
  if (exitTarget === undefined || exitTarget === null) {
    return "You can't go that way."
  }

  // Check guarded exits
  const guard = GUARDED_EXITS[ctx.currentRoom]?.[direction]
  if (guard && !guard.guard(ctx)) return guard.blocked

  return arriveAt(ctx, exitTarget)
}

// Move ctx into a room and return the descriptive output.
// Called by handleMove (COMMAND text path) and by go_<dir> actions in the state machine.
export function arriveAt(ctx, exitTarget) {
  const previousRoom = ctx.currentRoom

  // Clear stale output from previous turn
  ctx.output = null

  // Handle dark room movement (chance of grue)
  if (isDark(ctx) && rooms[exitTarget]?.dark) {
    ctx.darkMoves = (ctx.darkMoves || 0) + 1
    if (ctx.darkMoves >= 3 && Math.random() < 0.4) {
      ctx.health = 0
      return { location: null, warnings: [], text: DARK_MOVE_DEATH }
    }
  } else {
    ctx.darkMoves = 0
  }

  // Run onLeave for current room
  rooms[ctx.currentRoom]?.onLeave?.(ctx)

  ctx.currentRoom = exitTarget
  ctx.moves++

  const warnings = []

  // Tick lantern
  if (ctx.items['lantern'].on) {
    ctx.items['lantern'].turnsRemaining--
    if (ctx.items['lantern'].turnsRemaining === 20) {
      warnings.push('Your lantern is getting dim. You should find a way to conserve it.')
    }
    if (ctx.items['lantern'].turnsRemaining <= 0) {
      ctx.items['lantern'].on = false
      warnings.push('Your lantern has run out of power.')
    }
  }

  // Sword glow near enemies
  if (ctx.inventory.includes('sword')) {
    const hasEnemy = ctx.rooms[exitTarget].items.some(
      (id) => items[id]?.npc && !ctx.flags.trollDefeated
    )
    ctx.items['sword'].glowing = hasEnemy
    if (hasEnemy) {
      warnings.push('Your sword is glowing with a faint blue glow.')
    }
  }

  // Run onEnter for new room
  rooms[exitTarget]?.onEnter?.(ctx)

  // Custom enter message
  const enterMsg = rooms[exitTarget]?.onEnterMsg?.(ctx, previousRoom)

  // Track first visit for score (visitedRooms is a plain array)
  if (!ctx.visitedRooms.includes(exitTarget)) {
    ctx.visitedRooms.push(exitTarget)
    ctx.score += 1
  }

  // Build structured output
  const location = rooms[exitTarget]?.name || exitTarget
  let text = ''
  if (enterMsg) text += enterMsg + '\n'
  text += describeRoom(ctx)

  return { location, warnings, text }
}

// ============================================================
// TAKE
// ============================================================

export function handleTake(ctx, itemId) {
  if (isDark(ctx)) return "It's too dark to see anything."

  if (itemId === 'all') return handleTakeAll(ctx)

  if (!itemId) return 'What do you want to take?'

  // Is the item in the room?
  const roomItems = ctx.rooms[ctx.currentRoom].items
  if (!roomItems.includes(itemId)) {
    // Check if it's in a container in the room
    for (const rItemId of roomItems) {
      const rItem = ctx.items[rItemId]
      if (rItem?.contains?.includes(itemId) && rItem.open !== false) {
        rItem.contains = rItem.contains.filter((i) => i !== itemId)
        ctx.inventory.push(itemId)
        return 'Taken.'
      }
    }
    // Check if it's in a container in inventory
    for (const invId of ctx.inventory) {
      const invItem = ctx.items[invId]
      if (invItem?.contains?.includes(itemId)) {
        invItem.contains = invItem.contains.filter((i) => i !== itemId)
        ctx.inventory.push(itemId)
        return 'Taken.'
      }
    }
    // Already have it?
    if (ctx.inventory.includes(itemId)) return 'You already have that.'
    return "You can't see that here."
  }

  const itemDef = ctx.items[itemId]
  if (!itemDef) return "You can't see that here."
  if (!itemDef.takeable) return "You can't take that."

  // Capacity check
  if (ctx.inventory.length >= ctx.maxInventory) {
    return "Your hands are full. You'll need to drop something first."
  }

  // Remove from room, add to inventory
  const idx = roomItems.indexOf(itemId)
  if (idx !== -1) roomItems.splice(idx, 1)
  ctx.inventory.push(itemId)

  // Run custom onTake
  const msg = items[itemId]?.onTake?.(ctx)
  return msg || 'Taken.'
}

function handleTakeAll(ctx) {
  if (isDark(ctx)) return "It's too dark to see anything."
  const roomItems = [...ctx.rooms[ctx.currentRoom].items]
  const taken = []
  for (const itemId of roomItems) {
    const itemDef = ctx.items[itemId]
    if (itemDef?.takeable && ctx.inventory.length < ctx.maxInventory) {
      ctx.rooms[ctx.currentRoom].items = ctx.rooms[ctx.currentRoom].items.filter(
        (i) => i !== itemId
      )
      ctx.inventory.push(itemId)
      taken.push(ctx.items[itemId].name)
    }
  }
  if (taken.length === 0) return 'There is nothing here to take.'
  return taken.map((n) => n + ': Taken.').join('\n')
}

// ============================================================
// DROP
// ============================================================

export function handleDrop(ctx, itemId) {
  if (itemId === 'all') return handleDropAll(ctx)
  if (!itemId) return 'What do you want to drop?'

  const idx = ctx.inventory.indexOf(itemId)
  if (idx === -1) return "You aren't carrying that."

  ctx.inventory.splice(idx, 1)
  ctx.rooms[ctx.currentRoom].items.push(itemId)
  return 'Dropped.'
}

function handleDropAll(ctx) {
  if (ctx.inventory.length === 0) return "You aren't carrying anything."
  const dropped = []
  while (ctx.inventory.length > 0) {
    const itemId = ctx.inventory.pop()
    ctx.rooms[ctx.currentRoom].items.push(itemId)
    dropped.push(ctx.items[itemId].name)
  }
  return dropped.map((n) => n + ': Dropped.').join('\n')
}

// ============================================================
// OPEN / CLOSE
// ============================================================

export function handleOpen(ctx, itemId) {
  if (isDark(ctx)) return "It's too dark to see."
  if (!itemId) return 'What do you want to open?'

  const itemDef = ctx.items[itemId]
  if (!itemDef) return "You can't see that here."

  // Must be in room or inventory
  if (!isAccessible(ctx, itemId)) return "You can't see that here."

  if (items[itemId]?.onOpen) return items[itemId].onOpen(ctx)
  if (itemDef.open !== undefined) {
    if (itemDef.open) return "It's already open."
    itemDef.open = true
    return 'Opened.'
  }
  return "You can't open that."
}

export function handleClose(ctx, itemId) {
  if (!itemId) return 'What do you want to close?'
  const itemDef = ctx.items[itemId]
  if (!itemDef) return "You can't see that here."
  if (!isAccessible(ctx, itemId)) return "You can't see that here."
  if (items[itemId]?.onClose) return items[itemId].onClose(ctx)
  if (itemDef.open !== undefined) {
    if (!itemDef.open) return "It's already closed."
    itemDef.open = false
    return 'Closed.'
  }
  return "You can't close that."
}

// ============================================================
// EXAMINE / READ
// ============================================================

export function handleExamine(ctx, itemId) {
  if (isDark(ctx)) return "It's too dark to see."
  if (!itemId) return describeRoom(ctx, true)

  const itemDef = ctx.items[itemId]
  if (!itemDef) return "You can't see that here."
  if (!isAccessible(ctx, itemId)) return "You can't see that here."

  if (items[itemId]?.onExamine) return items[itemId].onExamine(ctx)
  return itemDef.description || 'You see nothing special.'
}

export function handleRead(ctx, itemId) {
  if (isDark(ctx)) return "It's too dark to read."
  if (!itemId) return 'What do you want to read?'

  const itemDef = ctx.items[itemId]
  if (!itemDef) return "You can't see that here."
  if (!isAccessible(ctx, itemId)) return "You can't see that here."

  if (items[itemId]?.onRead) return items[itemId].onRead(ctx)
  return 'There is nothing written on it.'
}

// ============================================================
// TURN ON / OFF
// ============================================================

export function handleTurnOn(ctx, itemId) {
  if (!itemId) return 'Turn on what?'
  const itemDef = ctx.items[itemId]
  if (!itemDef) return "You can't see that here."
  if (!isAccessible(ctx, itemId)) return "You don't have that."
  if (items[itemId]?.onTurnOn) return items[itemId].onTurnOn(ctx)
  return "You can't turn that on."
}

export function handleTurnOff(ctx, itemId) {
  if (!itemId) return 'Turn off what?'
  const itemDef = ctx.items[itemId]
  if (!itemDef) return "You can't see that here."
  if (!isAccessible(ctx, itemId)) return "You don't have that."
  if (items[itemId]?.onTurnOff) return items[itemId].onTurnOff(ctx)
  return "You can't turn that off."
}

// ============================================================
// ATTACK
// ============================================================

export function handleAttack(ctx, targetId, weaponId) {
  if (isDark(ctx)) return "It's too dark to fight!"
  if (!targetId) return 'What do you want to attack?'

  const target = ctx.items[targetId]
  if (!target) return "You can't see that here."
  if (!target.npc) return "I don't think attacking that would help."
  if (!isAccessible(ctx, targetId)) return "You can't see that here."

  // Resolve weapon - try indirect, then check inventory for weapons
  let weapon = weaponId
  if (!weapon) {
    // Auto-select best weapon from inventory
    const weapons = ctx.inventory.filter((id) => ctx.items[id]?.damage)
    if (weapons.length > 0) {
      weapon = weapons.reduce((a, b) =>
        (ctx.items[a].damage || 0) > (ctx.items[b].damage || 0) ? a : b
      )
    } else {
      weapon = 'hands'
    }
  }

  if (weapon !== 'hands' && !ctx.inventory.includes(weapon)) {
    return "You don't have that weapon."
  }

  if (items[targetId]?.onAttack) return items[targetId].onAttack(ctx, weapon)
  return "Violence isn't the answer to this one."
}

// ============================================================
// PUT
// ============================================================

export function handlePut(ctx, itemId, targetId) {
  if (!itemId) return 'Put what?'
  if (!targetId) return 'Where do you want to put it?'
  if (!ctx.inventory.includes(itemId)) return "You aren't carrying that."

  const target = ctx.items[targetId]
  if (!target) return "You can't see that here."
  if (!isAccessible(ctx, targetId)) return "You can't see that here."

  if (items[targetId]?.onPut) return items[targetId].onPut(ctx, itemId)
  return "You can't put anything in that."
}

// ============================================================
// INVENTORY
// ============================================================

export function handleInventory(ctx) {
  if (ctx.inventory.length === 0) return 'You are empty-handed.'
  const names = ctx.inventory.map((id) => {
    const item = ctx.items[id]
    let name = item?.name || id
    if (id === 'lantern' && item.on) name += ' (providing light)'
    return '  ' + name
  })
  return 'You are carrying:\n' + names.join('\n')
}

// ============================================================
// SCORE
// ============================================================

export function handleScore(ctx) {
  const rank = getRank(ctx.score)
  return `Your score is ${ctx.score} (total of 350 points), in ${ctx.moves} move${ctx.moves === 1 ? '' : 's'}.\nThis gives you the rank of ${rank}.`
}

// ============================================================
// SPECIAL INTERACTIONS
// ============================================================

export function handleMoveItem(ctx, itemId) {
  if (isDark(ctx)) return "It's too dark to see."
  if (!itemId) return 'What do you want to move?'
  const item = ctx.items[itemId]
  if (!item) return "You can't see that here."
  if (!isAccessible(ctx, itemId)) return "You can't see that here."
  if (items[itemId]?.onMove) return items[itemId].onMove(ctx)
  return 'Moving that reveals nothing.'
}

export function handleUnlock(ctx, targetId, keyId) {
  if (!targetId) return 'What do you want to unlock?'
  const target = ctx.items[targetId]
  if (!target) return "You can't see that here."
  if (items[targetId]?.onUnlock) return items[targetId].onUnlock(ctx)

  // Try using specified key
  if (keyId && ctx.inventory.includes(keyId)) {
    if (items[keyId]?.onUse) return items[keyId].onUse(ctx, targetId)
  }

  // Auto-try keys in inventory
  for (const invItem of ctx.inventory) {
    if (items[invItem]?.onUse) {
      const result = items[invItem].onUse(ctx, targetId)
      if (result && !result.includes("doesn't fit")) return result
    }
  }

  return "You don't have the right key."
}

export function handleEat(ctx, itemId) {
  if (!itemId) return 'Eat what?'
  if (!ctx.inventory.includes(itemId)) return "You aren't carrying that."
  const item = ctx.items[itemId]
  if (items[itemId]?.onEat) return items[itemId].onEat(ctx)
  return "I don't think that would be wise."
}

export function handleInflate(ctx, itemId) {
  if (!itemId) return 'Inflate what?'
  const item = ctx.items[itemId]
  if (!item) return "You can't see that here."
  if (items[itemId]?.onInflate) return items[itemId].onInflate(ctx)
  return "You can't inflate that."
}

export function handleRing(ctx, itemId) {
  if (!itemId) return 'Ring what?'
  if (!ctx.inventory.includes(itemId) && !ctx.rooms[ctx.currentRoom].items.includes(itemId)) {
    return "You don't have that."
  }
  const item = ctx.items[itemId]
  if (items[itemId]?.onRing) return items[itemId].onRing(ctx)
  return "You can't ring that."
}

export function handleLight(ctx, itemId) {
  if (!itemId) return 'Light what?'
  const item = ctx.items[itemId]
  if (!item) return "You can't see that here."
  if (!isAccessible(ctx, itemId)) return "You don't have that."
  if (items[itemId]?.onLight) return items[itemId].onLight(ctx)
  if (items[itemId]?.onTurnOn) return items[itemId].onTurnOn(ctx)
  return "You can't light that."
}

export function handleSearch(ctx, itemId) {
  if (isDark(ctx)) return "It's too dark to search."
  if (!itemId) return describeRoom(ctx, true)
  return handleExamine(ctx, itemId)
}

export function handleClimb(ctx, target) {
  // "climb down" / "climb up" — respect the direction
  if (target === 'down' || target === 'descend') return handleMove(ctx, 'down')
  if (target === 'up' || target === 'ascend') return handleMove(ctx, 'up')

  // "climb tree" — context-sensitive
  if (target === 'tree' || target === 'branches') {
    if (ctx.currentRoom === 'forest-path') return handleMove(ctx, 'up')
    if (ctx.currentRoom === 'up-a-tree') return "You cannot reach the next branch."
    return 'There is no tree to climb here.'
  }

  // "climb window" / "climb through window" at behind-house or kitchen
  if (target === 'kitchen-window' || target === 'window') {
    if (ctx.currentRoom === 'behind-house') return handleMove(ctx, 'west')
    if (ctx.currentRoom === 'kitchen') return handleMove(ctx, 'east')
    return "You can't climb through that here."
  }

  // General climb — if only down exists (e.g. up-a-tree), go down; otherwise up
  const roomDef = rooms[ctx.currentRoom]
  if (roomDef?.exits.down && !roomDef?.exits.up) return handleMove(ctx, 'down')
  return handleMove(ctx, 'up')
}

export function handleUse(ctx, itemId, targetId) {
  if (!itemId) return 'Use what?'
  if (!ctx.inventory.includes(itemId)) return "You aren't carrying that."
  const item = ctx.items[itemId]
  if (items[itemId]?.onUse) return items[itemId].onUse(ctx, targetId)
  return "You can't figure out how to use that here."
}

export function handleThrow(ctx, itemId) {
  if (!itemId) return 'Throw what?'
  if (!ctx.inventory.includes(itemId)) return "You aren't carrying that."
  // Remove from inventory, add to room
  const idx = ctx.inventory.indexOf(itemId)
  ctx.inventory.splice(idx, 1)
  ctx.rooms[ctx.currentRoom].items.push(itemId)
  return 'Thrown.'
}

export function handleWave(ctx, itemId) {
  if (!itemId) return 'You wave your hand. Nothing happens.'
  if (!ctx.inventory.includes(itemId)) return "You aren't holding that."
  // Waving the scepter at the rainbow, etc - simplified
  return 'Nothing happens.'
}

// ============================================================
// MISC
// ============================================================

export function handleWait() {
  return 'Time passes...'
}

export function handleDiagnose(ctx) {
  if (ctx.health >= 10) return 'You are in perfect health.'
  if (ctx.health >= 7) return 'You have some minor wounds.'
  if (ctx.health >= 4) return 'You are wounded and need attention.'
  return 'You are seriously wounded!'
}

export function handleHello() {
  const greetings = [
    'Hello.',
    "Nice weather we've been having lately.",
    "Hello there. Nice day, isn't it?"
  ]
  return greetings[Math.floor(Math.random() * greetings.length)]
}

export function handlePray(ctx) {
  if (ctx.currentRoom === 'south-temple') {
    return 'From the north comes a great rumbling and the sound of flowing water.'
  }
  return 'If you pray hard enough, your strains may be answered.'
}

export function handleShout() {
  return 'Aarrgghh!'
}

export function handleXyzzy() {
  return 'A hollow voice says "Fool."'
}

export function handlePlugh() {
  return 'A hollow voice says "Plugh" to you too.'
}

export function handleHelp() {
  return `ZORK I: The Great Underground Empire
(Coremachine Edition)

Commands:
  Movement: NORTH (N), SOUTH (S), EAST (E), WEST (W), UP (U), DOWN (D)
            NORTHEAST (NE), NORTHWEST (NW), SOUTHEAST (SE), SOUTHWEST (SW)
  Actions:  LOOK, EXAMINE <item>, TAKE <item>, DROP <item>
            OPEN <item>, CLOSE <item>, READ <item>
            TURN ON <item>, TURN OFF <item>
            ATTACK <target> WITH <weapon>
            PUT <item> IN <container>
            UNLOCK <item> WITH <key>
            MOVE <item>, CLIMB <target>
            EAT <item>, INFLATE <item>
  Info:     INVENTORY (I), SCORE, DIAGNOSE, HELP
            WAIT (Z)

Explore the Great Underground Empire and collect treasures!
Place treasures in the trophy case in the living room for points.`
}

// ============================================================
// HELPERS
// ============================================================

function isAccessible(ctx, itemId) {
  // In inventory
  if (ctx.inventory.includes(itemId)) return true
  // In current room
  if (ctx.rooms[ctx.currentRoom].items.includes(itemId)) return true
  // In an open container in the room
  for (const rItemId of ctx.rooms[ctx.currentRoom].items) {
    const rItem = ctx.items[rItemId]
    if (rItem?.contains?.includes(itemId) && rItem.open !== false) return true
  }
  // In an open container in inventory
  for (const invId of ctx.inventory) {
    const invItem = ctx.items[invId]
    if (invItem?.contains?.includes(itemId) && invItem.open !== false) return true
  }
  // Some items are ambient/room fixtures
  const roomDef = rooms[ctx.currentRoom]
  if (roomDef) {
    // Check if the item is a room fixture (like rug, window, trap-door)
    if (itemId === 'rug' && ctx.currentRoom === 'living-room') return true
    if (
      itemId === 'kitchen-window' &&
      (ctx.currentRoom === 'kitchen' || ctx.currentRoom === 'behind-house')
    )
      return true
    if (itemId === 'trap-door' && ctx.currentRoom === 'living-room') return true
    if (
      itemId === 'grating' &&
      (ctx.currentRoom === 'clearing-1' || ctx.currentRoom === 'grating-room')
    )
      return true
  }
  return false
}
