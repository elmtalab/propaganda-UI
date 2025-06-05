import { Hono } from 'hono'
import type { Env } from './types'
import registerRoot from './routes/root'
import registerWizard from './routes/wizard'
import registerChat from './routes/chat'
import registerChatId from './routes/chat_id'
import registerChatPage from './routes/chatpage'
import registerChatPageStandalone from './routes/chat_page'
import registerSchedule from './routes/schedule'
import registerAdvanced from './routes/advanced'
import registerLog from './routes/log'
import registerHistory from './routes/history'
export { scheduled } from './scheduled'

const app = new Hono<{ Bindings: Env }>()

registerRoot(app)
registerWizard(app)
registerChat(app)
registerChatId(app)
registerChatPage(app)
registerChatPageStandalone(app)
registerSchedule(app)
registerAdvanced(app)
registerLog(app)
registerHistory(app)

export default app
