import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { readActiveKnowledgeList } from '../data/knowledgeStore.js'

const suggestionsRoutes = new Hono()

suggestionsRoutes.use('/api/suggestions', authMiddleware)

suggestionsRoutes.get('/api/suggestions', async (c) => {
  try {
    const items = await readActiveKnowledgeList()

    const suggestions = items.map((item) => ({
      question: item.question,
      category: item.tags[0] ?? '推荐',
    }))

    return c.json({ suggestions })
  } catch (error) {
    console.error('Failed to fetch suggestions:', error)

    return c.json({ message: 'Internal server error' }, 500)
  }
})

export default suggestionsRoutes
