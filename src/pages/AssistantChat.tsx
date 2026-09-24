import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import {
  streamAgentChat,
  displayableMessages,
  type AgentMessage,
  type DisplayMessage,
} from '@/lib/skipAi'
import {
  Bot,
  Send,
  Loader2,
  Sparkles,
  User,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const SUGGESTED_QUESTIONS = [
  'Fiz 45 min de musculação hoje, como fica meu saldo para comer pizza?',
  'Estou no Burger King e quero um sanduíche de carne, qual escolher? Whopper?',
  'Posso comer pizza hoje à noite sem estragar minha meta de calorias?',
  "O que pedir no McDonald's com maior quantidade de proteína para pós-treino?",
  'Tenho hipertensão, o que evitar ao pedir no Outback ou China in Box?',
  'Quais as opções com menor teor de gordura e sódio no Subway?',
]

export default function AssistantChat() {
  const { user, profile } = useAuth()
  const { toast } = useToast()

  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingDelta, setStreamingDelta] = useState<string>('')
  const [loadingHistory, setLoadingHistory] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingDelta])

  // Load existing conversation on mount if available
  useEffect(() => {
    const fetchRecentConversation = async () => {
      if (!user) return
      setLoadingHistory(true)
      try {
        const res = await fetch(
          `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/assistant/conversations?limit=1`,
          {
            headers: { Authorization: pb.authStore.token },
          },
        )
        if (res.ok) {
          const data = await res.json()
          const items = data.items || data
          if (Array.isArray(items) && items.length > 0 && items[0]?.id) {
            const latestId = items[0].id
            setConversationId(latestId)

            // Load messages
            const msgRes = await fetch(
              `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/assistant/conversations/${latestId}/messages`,
              {
                headers: { Authorization: pb.authStore.token },
              },
            )
            if (msgRes.ok) {
              const msgData = (await msgRes.json()) as { messages?: AgentMessage[] }
              if (msgData.messages) {
                setMessages(displayableMessages(msgData.messages))
              }
            }
          }
        }
      } catch (err) {
        console.error('Erro ao buscar conversa recente:', err)
      } finally {
        setLoadingHistory(false)
      }
    }

    fetchRecentConversation()
  }, [user])

  const handleStartNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort()
    }
    setConversationId(null)
    setMessages([])
    setStreamingDelta('')
    toast({
      title: 'Nova conversa iniciada',
      description: 'Você pode enviar uma nova pergunta ao assistente.',
    })
  }

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputMessage).trim()
    if (!message || isStreaming) return

    setInputMessage('')

    // Append user message immediately
    const userDisplayMsg: DisplayMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      created: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userDisplayMsg])

    setIsStreaming(true)
    setStreamingDelta('')

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch(
        `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/assistant/chat-stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: pb.authStore.token,
          },
          body: JSON.stringify({
            message,
            conversation_id: conversationId,
          }),
          signal: controller.signal,
        },
      )

      let capturedFullText = ''

      const result = await streamAgentChat(res, {
        onChunk: (_delta, full) => {
          capturedFullText = full
          setStreamingDelta(full)
        },
        signal: controller.signal,
      })

      const newConvId = res.headers.get('X-Conversation-Id') || result.conversation_id
      if (newConvId) {
        setConversationId(newConvId)
      }

      // Finalize assistant message into list
      const assistantDisplayMsg: DisplayMessage = {
        id: result.message_id || `assistant-${Date.now()}`,
        role: 'assistant',
        content: capturedFullText || result.content,
        citations: result.citations,
        created: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantDisplayMsg])
      setStreamingDelta('')
    } catch (err: any) {
      if (err.name === 'AbortError') return
      console.error('Erro no chat streaming:', err)

      // Fallback: try synchronous chat endpoint if streaming encountered issue
      try {
        const fallbackRes = await fetch(
          `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/assistant/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: pb.authStore.token,
            },
            body: JSON.stringify({
              message,
              conversation_id: conversationId,
            }),
          },
        )
        if (fallbackRes.ok) {
          const syncData = await fallbackRes.json()
          if (syncData.conversation_id) setConversationId(syncData.conversation_id)
          setMessages((prev) => [
            ...prev,
            {
              id: syncData.message_id || `asst-${Date.now()}`,
              role: 'assistant',
              content: syncData.content,
              citations: syncData.citations,
              created: new Date().toISOString(),
            },
          ])
          setStreamingDelta('')
          return
        }
      } catch (fallbackErr) {
        console.error('Fallback também falhou:', fallbackErr)
      }

      toast({
        variant: 'destructive',
        title: 'Erro na resposta da IA',
        description: err.message || 'Não foi possível obter resposta no momento.',
      })
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-orange-100/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Assistente de IA Nutricional
            </h1>
            <Badge className="bg-[#FF6B35] text-white text-[10px] font-bold">
              Nativo Skip Cloud
            </Badge>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Tire dúvidas em tempo real conectadas com seu perfil (metas, restrições e registros do
            dia).
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleStartNewChat}
          className="border-orange-200 text-[#FF6B35] hover:bg-orange-50 font-semibold text-xs h-9 self-start sm:self-auto gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> Nova Conversa
        </Button>
      </div>

      {/* Profile quick banner */}
      {profile && (
        <div className="bg-gradient-to-r from-orange-50 to-amber-50/60 rounded-2xl p-4 border border-orange-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="font-bold text-gray-900">Seu Perfil Conectado:</span>
            <span>Meta {profile.meta_calorias} kcal</span>
            <span>• Dieta: {profile.dieta_atual?.join(', ') || 'Onívora'}</span>
            {profile.condicoes?.length > 0 && profile.condicoes[0] !== 'Nenhuma' && (
              <span className="text-amber-800 font-semibold">
                • Condição: {profile.condicoes.join(', ')}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#2EC4B6] font-bold uppercase tracking-wider">
            ✓ IA com acesso ao histórico
          </span>
        </div>
      )}

      {/* Chat Container */}
      <Card className="rounded-3xl border-orange-100 shadow-md bg-white flex flex-col h-[650px] overflow-hidden">
        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF6B35]" />
              <p className="text-xs">Carregando conversa anterior...</p>
            </div>
          ) : messages.length === 0 && !streamingDelta ? (
            /* Empty state with prompt suggestions */
            <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#FF6B35] to-[#E55A2B] text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bot className="w-9 h-9" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="font-extrabold text-xl text-gray-900">
                  Olá, {user?.name || 'amigo'}! Como posso te ajudar hoje?
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Pergunte sobre escolhas no Burger King, McDonald's, pizza ou se determinado lanche
                  cabe na sua meta de hoje.
                </p>
              </div>

              {/* Suggestions */}
              <div className="w-full max-w-lg space-y-2 text-left">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block text-center">
                  Perguntas frequentes para testar:
                </span>
                {SUGGESTED_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(question)}
                    className="w-full text-left p-3 rounded-xl bg-orange-50/70 hover:bg-orange-100/80 border border-orange-100 text-xs text-gray-800 font-medium transition-colors flex items-center justify-between group"
                  >
                    <span>"{question}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FF6B35] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <>
              {messages.map((msg) => {
                const isUser = msg.role === 'user'

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#FF6B35] text-white rounded-tr-none shadow-sm font-medium'
                          : 'bg-[#FFF9F2] text-gray-800 border border-orange-100/90 rounded-tl-none whitespace-pre-line'
                      }`}
                    >
                      {msg.content}

                      {/* Citations / sources if any */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-orange-200/50 text-[11px] text-gray-500">
                          <span className="font-semibold block mb-0.5">Trechos e referências:</span>
                          <ul className="list-disc list-inside space-y-0.5">
                            {msg.citations.map((c, i) => (
                              <li key={i}>{c.excerpt || c.source_id || 'Base Nutricional'}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Streaming active message bubble */}
              {isStreaming && streamingDelta && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#FF6B35] flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tl-none p-4 text-sm leading-relaxed bg-[#FFF9F2] text-gray-800 border border-orange-100/90 whitespace-pre-line">
                    {streamingDelta}
                  </div>
                </div>
              )}

              {/* Loading indicator when waiting for first chunk */}
              {isStreaming && !streamingDelta && (
                <div className="flex items-center gap-2 text-xs text-gray-500 pl-11">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF6B35]" />
                  <span>Consultando seu perfil e base nutricional...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="p-4 bg-white border-t border-orange-100">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex items-center gap-2"
          >
            <Input
              placeholder="Digite sua dúvida (ex: Posso comer Whopper hoje?)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isStreaming}
              className="py-5 text-sm bg-orange-50/40 border-orange-200 focus-visible:ring-[#FF6B35] rounded-xl"
            />
            <Button
              type="submit"
              disabled={isStreaming || !inputMessage.trim()}
              className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-5 py-5 rounded-xl font-bold shadow-md shadow-orange-500/20"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
