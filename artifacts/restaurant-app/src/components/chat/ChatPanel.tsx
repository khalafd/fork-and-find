import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RestaurantWithDishes, useCreateOpenaiConversation, useListOpenaiMessages, getListOpenaiMessagesQueryKey, OpenaiMessage } from "@workspace/api-client-react";
import { getSessionId, getConversationId, setConversationId } from "@/hooks/use-session";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  selectedRestaurant: RestaurantWithDishes | null;
  shortlist: any[];
}

export function ChatPanel({ selectedRestaurant, shortlist }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [localMessages, setLocalMessages] = useState<OpenaiMessage[]>([]);
  
  const createConversation = useCreateOpenaiConversation();
  const convId = getConversationId();
  
  const { data: serverMessages, refetch: refetchMessages } = useListOpenaiMessages(convId || 0, {
    query: { enabled: !!convId, queryKey: getListOpenaiMessagesQueryKey(convId || 0) }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, streamingText]);

  // Sync server messages
  useEffect(() => {
    if (serverMessages) {
      setLocalMessages(serverMessages);
    }
  }, [serverMessages]);

  // Init conversation if none exists
  useEffect(() => {
    if (!convId) {
      createConversation.mutate(
        { data: { title: "Restaurant Discovery" } },
        {
          onSuccess: (data) => {
            setConversationId(data.id);
            refetchMessages();
          }
        }
      );
    }
  }, [convId, createConversation, refetchMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !convId || isStreaming) return;

    const userMsg = input.trim();
    setInput("");
    
    // Optimistic UI for user message
    const tempUserMessage: OpenaiMessage = {
      id: Date.now(),
      conversationId: convId,
      role: "user",
      content: userMsg,
      createdAt: new Date().toISOString()
    };
    setLocalMessages(prev => [...prev, tempUserMessage]);
    
    setIsStreaming(true);
    setStreamingText("");

    try {
      const sessionId = getSessionId();
      const response = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Id': sessionId 
        },
        body: JSON.stringify({
          content: userMsg,
          restaurantContext: JSON.stringify({
            selected: selectedRestaurant,
            dishes: selectedRestaurant?.dishes ?? [],
            shortlist: shortlist
          })
        })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let finalContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                finalContent += data.content;
                setStreamingText(prev => prev + data.content);
              }
              if (data.done) {
                setIsStreaming(false);
              }
            } catch (err) {
              console.error("Error parsing SSE JSON:", err);
            }
          }
        }
      }

      // After streaming finishes, refetch to get the actual assistant message from DB
      await refetchMessages();
    } catch (error) {
      console.error("Chat error:", error);
      setIsStreaming(false);
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm border-l border-border/40 relative">
      <div className="p-4 border-b border-border/40 bg-card/80 backdrop-blur-md flex items-center justify-between">
        <div>
          <h2 className="font-serif font-bold text-lg text-primary">Private Advisor</h2>
          <p className="text-xs text-muted-foreground">Ask about evidence, mood, or recommendations</p>
        </div>
        <Bot className="w-5 h-5 text-primary/70" />
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-6 pb-4">
          {localMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              
              <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 border border-border/50 text-foreground prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:my-0'
              }`}>
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-secondary border border-border/50 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="max-w-[85%] rounded-lg p-3 text-sm bg-muted/50 border border-border/50 text-foreground prose prose-sm dark:prose-invert">
                <ReactMarkdown>{streamingText}</ReactMarkdown>
                <span className="inline-block w-1.5 h-4 ml-1 bg-primary/70 animate-pulse align-middle" />
              </div>
            </div>
          )}
          
          {!localMessages.length && !isStreaming && (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8 pt-20">
              <Bot className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-serif italic text-lg mb-2">How can I assist your dining plans?</p>
              <p className="text-sm opacity-60 max-w-xs">I can analyze review consensus, suggest pairings, or filter the curated database for your specific needs.</p>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-card/80 backdrop-blur-md border-t border-border/40">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g., Which of these is best for a quiet date?"
            className="bg-background/50 border-border/50 focus-visible:ring-primary/50"
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isStreaming} className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
