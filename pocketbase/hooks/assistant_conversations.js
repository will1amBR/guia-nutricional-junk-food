routerAdd(
  'GET',
  '/backend/v1/assistant/conversations',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      const limit = parseInt(e.requestInfo().query?.limit || '20', 10) || 20
      const convs = $ai
        .agent('nutri-junk-assistant')
        .listConversations({ user_id: userId, limit: limit })
      return e.json(200, convs)
    } catch (err) {
      console.log('Error in listConversations:', err)
      return e.json(200, { items: [] })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'GET',
  '/backend/v1/assistant/conversations/{conversationId}/messages',
  (e) => {
    try {
      const userId = e.auth?.id
      if (!userId) return e.unauthorizedError('Autenticação necessária')
      const conversationId = e.request.pathValue('conversationId')
      const result = $ai.agent('nutri-junk-assistant').listMessages({
        conversation_id: conversationId,
        user_id: userId,
      })
      return e.json(200, result)
    } catch (err) {
      console.log('Error in listMessages:', err)
      if (err instanceof SkipAiAgentsError) {
        const status = err.status || 500
        return e.json(status, {
          error: status >= 500 ? 'Falha ao carregar mensagens' : err.message,
        })
      }
      return e.json(500, { error: 'Erro ao buscar histórico da conversa.' })
    }
  },
  $apis.requireAuth(),
)
