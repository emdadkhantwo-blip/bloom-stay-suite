import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from './useTenant';
import { useAuth } from './useAuth';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  toolCalls?: Array<{ name: string; args: any }>;
  toolResults?: Array<{ success: boolean; data?: any; error?: string }>;
}

export function useAdminChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { tenant, properties } = useTenant();
  const { session } = useAuth();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add loading placeholder
    const loadingId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const propertyId = properties?.[0]?.id || '';

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            messages: apiMessages,
            tenantId: tenant?.id || '',
            propertyId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new Error('আমি এখন একটু ব্যস্ত। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন। (Rate limit exceeded)');
        }
        if (response.status === 402) {
          throw new Error('AI credits exhausted. Please contact your administrator.');
        }
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // Replace loading message with actual response
      setMessages(prev => prev.map(m => 
        m.id === loadingId 
          ? {
              id: loadingId,
              role: 'assistant' as const,
              content: data.message || 'I completed the request.',
              timestamp: new Date(),
              isLoading: false,
              toolCalls: data.toolCalls,
              toolResults: data.toolResults
            }
          : m
      ));

    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Replace loading message with error
      setMessages(prev => prev.map(m => 
        m.id === loadingId 
          ? {
              id: loadingId,
              role: 'assistant' as const,
              content: `দুঃখিত, একটি সমস্যা হয়েছে: ${error.message}`,
              timestamp: new Date(),
              isLoading: false
            }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, tenant, properties, session]);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  const addWelcomeMessage = useCallback(() => {
    if (messages.length === 0) {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `নমস্কার! 👋 আমি **সখী**, আপনার হোটেল ম্যানেজমেন্ট সহকারী।

আমি আপনাকে সাহায্য করতে পারি:
- 📅 **রিজার্ভেশন** তৈরি ও পরিচালনা
- 🛎️ **চেক-ইন/আউট** প্রক্রিয়াকরণ
- 🛏️ **রুম ম্যানেজমেন্ট** ও হাউসকিপিং
- 👥 **গেস্ট প্রোফাইল** তৈরি
- 💳 **ফোলিও ও পেমেন্ট** পরিচালনা
- 📊 **রিপোর্ট ও পরিসংখ্যান** দেখা

**আজ আপনাকে কীভাবে সাহায্য করতে পারি?**`,
        timestamp: new Date()
      }]);
    }
  }, [messages.length]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
    addWelcomeMessage
  };
}
