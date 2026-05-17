import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCreateOpenaiConversation,
  useListOpenaiMessages,
  getListOpenaiMessagesQueryKey,
  OpenaiMessage,
  RestaurantWithDishes,
} from "@workspace/api-client-react";
import { getSessionId, getConversationId, setConversationId } from "@/hooks/use-session";
import ReactMarkdown from "react-markdown";

interface ChatPanelProps {
  selectedRestaurant?: RestaurantWithDishes | null;
  shortlist?: unknown[];
  initialMessage?: string;
  onInitialMessageSent?: () => void;
}

const SUGGESTIONS = [
  "Best wagyu near me",
  "Quiet spot for a date",
  "Family dinner tonight",
  "Best sushi in Khobar",
  "Something new to try",
  "What's good right now?",
];

const pillStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "5px 12px",
  borderRadius: 20,
  border: "0.5px solid rgba(184,134,11,0.35)",
  color: "#B8860B",
  background: "rgba(184,134,11,0.06)",
  fontWeight: 500,
  cursor: "pointer",
  margin: 3,
  whiteSpace: "nowrap" as const,
};

export function ChatPanel({
  selectedRestaurant,
  shortlist,
  initialMessage,
  onInitialMessageSent,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [localMessages, setLocalMessages] = useState<OpenaiMessage[]>([]);
  const initialSentRef = useRef(false);

  const createConversation = useCreateOpenaiConversation();
  const convId = getConversationId();

  const { data: serverMessages, refetch: refetchMessages } = useListOpenaiMessages(convId || 0, {
    query: { enabled: !!convId, queryKey: getListOpenaiMessagesQueryKey(convId || 0) },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, streamingText]);

  useEffect(() => {
    if (serverMessages) setLocalMessages(serverMessages);
  }, [serverMessages]);

  useEffect(() => {
    if (!convId) {
      createConversation.mutate(
        { data: { title: "Restaurant Discovery" } },
        {
          onSuccess: (data) => {
            setConversationId(data.id);
            refetchMessages();
          },
        }
      );
    }
  }, [convId]);

  useEffect(() => {
    if (initialMessage && convId && !isStreaming && !initialSentRef.current) {
      initialSentRef.current = true;
      sendMessage(initialMessage);
      onInitialMessageSent?.();
    }
  }, [initialMessage, convId]);

  useEffect(() => {
    if (!initialMessage) initialSentRef.current = false;
  }, [initialMessage]);

  const buildRestaurantContext = () => {
    if (selectedRestaurant) {
      return JSON.stringify({
        name: selectedRestaurant.name,
        cuisine: selectedRestaurant.cuisine,
        district: selectedRestaurant.district,
        reviewConsensusSummary: selectedRestaurant.reviewConsensusSummary,
        strengths: selectedRestaurant.strengths,
        weaknesses: selectedRestaurant.weaknesses,
        dishes: (selectedRestaurant.dishes ?? []).map((d: { name: string; evidenceLevel?: string | null }) => ({
          name: d.name,
          evidenceLevel: d.evidenceLevel,
        })),
      });
    }
    return JSON.stringify({
      selected: null,
      dishes: [],
      shortlist: shortlist ?? [],
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !convId || isStreaming) return;

    const userMsg = text.trim();
    setInput("");

    const tempUserMessage: OpenaiMessage = {
      id: Date.now(),
      conversationId: convId,
      role: "user",
      content: userMsg,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, tempUserMessage]);
    setIsStreaming(true);
    setStreamingText("");

    try {
      const sessionId = getSessionId();
      const response = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Session-Id": sessionId },
        body: JSON.stringify({
          content: userMsg,
          restaurantContext: buildRestaurantContext(),
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (dataStr === "[DONE]") continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.content) setStreamingText((prev) => prev + data.content);
              if (data.done) setIsStreaming(false);
            } catch {}
          }
        }
      }

      await refetchMessages();
    } catch {
      setIsStreaming(false);
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
  };

  const placeholder = selectedRestaurant
    ? "What should I order here?"
    : "Ask about food in Khobar...";

  return (
    <div className="flex flex-col h-full" style={{ background: "white" }}>
      {/* Header */}
      <div
        style={{
          padding: "14px 16px 12px",
          borderBottom: "0.5px solid rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 15,
            fontWeight: 600,
            color: "#1a1a1a",
            lineHeight: 1.2,
          }}
        >
          Your dining advisor
        </div>
        <div style={{ fontSize: 11, color: "#B8860B", marginTop: 2, fontWeight: 500 }}>
          Al Khobar &amp; Dammam
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-5 pb-4">
          {localMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#FFF3CD", border: "1px solid #B8860B",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <Bot style={{ width: 14, height: 14, color: "#B8860B" }} />
                </div>
              )}
              <div
                style={{
                  maxWidth: "85%", borderRadius: 12, padding: "10px 14px", fontSize: 13,
                  background: msg.role === "user" ? "#1a1a1a" : "#FAF8F4",
                  color: msg.role === "user" ? "white" : "#1a1a1a",
                  border: msg.role === "assistant" ? "0.5px solid rgba(0,0,0,0.08)" : "none",
                }}
                className={msg.role === "assistant" ? "prose prose-sm max-w-none" : ""}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === "user" && (
                <div
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#f5f5f5", border: "0.5px solid rgba(0,0,0,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <User style={{ width: 14, height: 14, color: "#888" }} />
                </div>
              )}
            </div>
          ))}

          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#FFF3CD", border: "1px solid #B8860B",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Bot style={{ width: 14, height: 14, color: "#B8860B" }} />
              </div>
              <div
                style={{
                  maxWidth: "85%", borderRadius: 12, padding: "10px 14px", fontSize: 13,
                  background: "#FAF8F4", border: "0.5px solid rgba(0,0,0,0.08)", color: "#1a1a1a",
                }}
                className="prose prose-sm max-w-none"
              >
                <ReactMarkdown>{streamingText}</ReactMarkdown>
                <span
                  style={{
                    display: "inline-block", width: 6, height: 14, marginLeft: 2,
                    background: "#B8860B", verticalAlign: "middle", animation: "pulse 1s infinite",
                  }}
                />
              </div>
            </div>
          )}

          {!localMessages.length && !isStreaming && (
            <div style={{ paddingTop: 16 }}>
              {/* Greeting bubble */}
              <div className="flex gap-3 justify-start">
                <div
                  style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#FFF3CD", border: "1px solid #B8860B",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}
                >
                  <Bot style={{ width: 14, height: 14, color: "#B8860B" }} />
                </div>
                <div
                  style={{
                    maxWidth: "85%", borderRadius: 12, padding: "10px 14px", fontSize: 13,
                    background: "#FAF8F4", border: "0.5px solid rgba(0,0,0,0.08)", color: "#1a1a1a",
                    lineHeight: 1.5,
                  }}
                >
                  Where are you eating tonight? Tell me what you're in the mood for — I know every good table in Khobar and Dammam.
                </div>
              </div>

              {/* Suggestion pills */}
              <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", paddingLeft: 40 }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} style={pillStyle} onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div style={{ padding: "12px 16px", borderTop: "0.5px solid rgba(0,0,0,0.08)", background: "white" }}>
        {/* Context pill */}
        {selectedRestaurant && (
          <div
            style={{
              display: "inline-block",
              background: "rgba(184,134,11,0.08)",
              border: "0.5px solid rgba(184,134,11,0.25)",
              borderRadius: 12,
              padding: "3px 10px",
              fontSize: 11,
              color: "#B8860B",
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Talking about {selectedRestaurant.name}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isStreaming}
            style={{ fontSize: 13, borderColor: "rgba(0,0,0,0.12)", background: "#FAF8F4" }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming}
            style={{ flexShrink: 0, background: "#1a1a1a", color: "white", border: "none" }}
          >
            {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
