// @ts-nocheck
'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  
  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat',
    maxSteps: 5,
    sendAutomaticallyWhen: () => true,
  });
  const isLoading = status === 'in_progress';
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ role: 'user', content: input });
    setInput('');
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-transform z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[380px] h-[600px] max-h-[80vh] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-primary text-white p-4 rounded-t-2xl flex justify-between items-center">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              VIGIL AI Assistant
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Beta</span>
            </h3>
            <p className="text-xs opacity-80 mt-0.5">Ask me about bookings or vehicles</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-10 text-sm">
              <p className="mb-2">👋 Hello! I'm your AI assistant.</p>
              <p>Try asking:</p>
              <ul className="mt-2 space-y-1">
                <li>"How many active vehicles do we have?"</li>
                <li>"What are our booking stats?"</li>
                <li>"Search for a customer named John"</li>
              </ul>
            </div>
          )}
          
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                  m.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-sm' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                }`}
              >
                {m.parts ? (
                   <div className="text-sm space-y-3">
                     {m.parts.map((part, i) => {
                       if (part.type.startsWith('tool-')) {
                         const toolName = part.type.replace('tool-', '');
                         const isDone = part.state === 'output-available' || part.state === 'result';
                         
                         return (
                            <div key={i} className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700 font-mono flex flex-col gap-2 shadow-sm border border-gray-200">
                               <div className="flex items-center gap-2 font-semibold text-primary">
                                 {isDone ? (
                                    <span>✓ System Query: {toolName}</span>
                                 ) : (
                                    <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Querying {toolName}...</span>
                                 )}
                               </div>
                               {isDone && part.output && (
                                 <div className="bg-white p-2 rounded border border-gray-200 overflow-auto whitespace-pre-wrap text-xs text-gray-600">
                                   {JSON.stringify(part.output, null, 2)}
                                 </div>
                               )}
                            </div>
                         );
                       }
                       return null;
                     })}
                   </div>
                ) : m.toolInvocations && m.toolInvocations.length > 0 ? (
                   <div className="text-sm space-y-2">
                     {m.toolInvocations.map(invocation => (
                        <div key={invocation.toolCallId} className="bg-gray-100 p-2 rounded text-xs text-gray-600 font-mono">
                           {invocation.state === 'result' ? (
                              <span>✓ Checked {invocation.toolName}</span>
                           ) : (
                              <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Checking {invocation.toolName}...</span>
                           )}
                        </div>
                     ))}
                   </div>
                ) : null}

                {m.content && (
                  <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : ''} ${m.parts ? 'mt-3' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {error && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl px-4 py-2 bg-red-50 border border-red-200 text-red-800 rounded-tl-sm shadow-sm text-sm">
                <strong>Error: </strong> {error.message || 'An error occurred while connecting to the AI.'}
              </div>
            </div>
          )}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-200 rounded-b-2xl">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question..."
              className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary rounded-full px-4 py-2 text-sm transition-colors outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
