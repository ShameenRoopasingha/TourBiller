'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Bot, Send, Loader2, Sparkles, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface QuotationAIChatProps {
  onApplyDraft: (draft: any) => void;
  onClose: () => void;
}

export function QuotationAIChat({ onApplyDraft, onClose }: QuotationAIChatProps) {
  const [input, setInput] = useState('');
  
  // @ts-ignore - Some versions of AI SDK have different types
  const { messages, sendMessage, status, error } = useChat({
    api: '/api/chat',
    maxSteps: 1,
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Hi! Tell me the details of the quotation you want to generate. For example: "I need a 3-day trip to Kandy for 5 people in a KDH van for Mr. John."'
      }
    ]
  });

  const isLoading = status === 'in_progress';
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ role: 'user', content: input });
    setInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 border shadow-sm'
                }`}
              >
                {message.content && (
                  <div className="text-sm prose prose-sm dark:prose-invert">
                    {message.content}
                  </div>
                )}
                
                {message.toolInvocations?.map((toolCall: any) => {
                  if (toolCall.toolName === 'generateDraftQuotation' && toolCall.state === 'result') {
                    const draft = toolCall.result.draft;
                    return (
                      <Card key={toolCall.toolCallId} className="mt-3 border-primary/20 bg-primary/5">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 font-semibold text-primary mb-3">
                            <Sparkles className="w-4 h-4" />
                            Draft Quotation Ready
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                            {draft.customerName && <div><span className="text-muted-foreground">Customer:</span> <span className="font-medium">{draft.customerName}</span></div>}
                            {draft.vehicleType && <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{draft.vehicleType}</span></div>}
                            {draft.days && <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium">{draft.days} Days</span></div>}
                            {draft.numberOfPersons && <div><span className="text-muted-foreground">Persons:</span> <span className="font-medium">{draft.numberOfPersons}</span></div>}
                            {draft.destination && <div><span className="text-muted-foreground">Dest:</span> <span className="font-medium">{draft.destination}</span></div>}
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              onApplyDraft(draft);
                              onClose();
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Apply to Form
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  if (toolCall.state === 'call') {
                    return (
                      <div key={toolCall.toolCallId} className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating draft...
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
          {isLoading && !messages.find((m: any) => m.toolInvocations?.some((t: any) => t.state === 'call')) && (
            <div className="flex justify-start">
              <div className="bg-muted/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center my-4">
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm border border-destructive/20 text-center">
                <span className="font-semibold">Error:</span> {error.message || 'An error occurred'}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="E.g. 3 day trip to Kandy for 5 people..."
            className="pr-10 rounded-full bg-muted/50 focus-visible:ring-primary/20"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || isLoading} 
            className="absolute right-1 top-1 h-8 w-8 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}