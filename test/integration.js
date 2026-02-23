import Corestore from 'corestore'
import { Zork } from '../zork-machine.js'
import test from 'brittle'

test('works', async (t) => {
  const store = new Corestore(await t.tmp())
  const zork = Zork(store)

  zork.on('data', ({ state, context }) => {
    t.is(state, 'west-of-house')
    t.is(context.output, 'Opening the small mailbox reveals a leaflet.')
    t.is(context.score, 0)
    t.alike(context.inventory, [])
  })

  zork.write({ action: 'COMMAND', value: { text: 'open mailbox' } })

  // t.plan is not working?
  await new Promise((res) => setTimeout(res, 100))
})
