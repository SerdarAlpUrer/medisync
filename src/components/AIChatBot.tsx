'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react'
import { searchKnowledge, getQuickSuggestions, KnowledgeEntry } from '@/lib/ai/knowledge-base'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export function AIChatBot() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: 'Merhaba! 👋 Ben MediSync AI Asistanı. Size cihaz bakımı, kalibrasyon ve sistem kullanımı konularında yardımcı olabilirim. Ne sormak istersiniz?',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const handleSend = async () => {
        if (!input.trim()) return

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsTyping(true)

        // Simulate AI thinking delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500))

        // Search knowledge base
        const results = searchKnowledge(input)

        let responseContent: string
        if (results.length > 0) {
            responseContent = results[0].answer

            if (results.length > 1) {
                responseContent += '\n\n📚 İlgili diğer konular:\n' +
                    results.slice(1).map(r => `• ${r.question}`).join('\n')
            }
        } else {
            responseContent = 'Bu konuda henüz bir bilgi bulamadım. Lütfen sorunuzu farklı kelimelerle sormayı deneyin veya şu konulardan birini seçin:\n\n' +
                getQuickSuggestions().map(s => `• ${s}`).join('\n')
        }

        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
        }

        setIsTyping(false)
        setMessages(prev => [...prev, assistantMessage])
    }

    const handleQuickQuestion = (question: string) => {
        setInput(question)
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${isOpen
                        ? 'bg-gray-700 hover:bg-gray-600'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/30'
                    }`}
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <div className="relative">
                        <MessageCircle className="w-6 h-6 text-white" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                    </div>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fadeIn">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">MediSync AI</h3>
                            <p className="text-xs text-blue-100">Yapay Zeka Asistanı</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map(message => (
                            <div
                                key={message.id}
                                className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                        ? 'bg-blue-100 dark:bg-blue-900'
                                        : 'bg-indigo-100 dark:bg-indigo-900'
                                    }`}>
                                    {message.role === 'user' ? (
                                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                    )}
                                </div>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${message.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                                    }`}>
                                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions */}
                    {messages.length === 1 && (
                        <div className="px-4 pb-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Hızlı sorular:</p>
                            <div className="flex flex-wrap gap-2">
                                {getQuickSuggestions().slice(0, 2).map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleQuickQuestion(q)}
                                        className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Sorunuzu yazın..."
                                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-xl flex items-center justify-center transition-colors"
                            >
                                <Send className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
