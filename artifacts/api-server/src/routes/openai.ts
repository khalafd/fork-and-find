import { Router } from "express";
import { db, conversations, messages, adminSettings, restaurants, dishes } from "@workspace/db";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";
import { eq, asc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const DEFAULT_SYSTEM_PROMPT = `You are Fork & Find's AI dining advisor — a credible restaurant recommendation analyst.
You work ONLY with curated data provided to you in context. You do NOT access live review sites.
Always be transparent that recommendations are based on our curated database.
Never hallucinate menu items. If data is limited, say so clearly.`;

async function getSystemPrompt(): Promise<string> {
  try {
    const [setting] = await db.select().from(adminSettings).limit(1);
    return setting?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
  } catch {
    return DEFAULT_SYSTEM_PROMPT;
  }
}

// GET /openai/conversations
router.get("/openai/conversations", async (req, res) => {
  try {
    const rows = await db.select().from(conversations).orderBy(asc(conversations.createdAt));
    res.json(rows);
  } catch (err) {
    req.log.error(err, "listOpenaiConversations failed");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// POST /openai/conversations
router.post("/openai/conversations", async (req, res) => {
  try {
    const body = CreateOpenaiConversationBody.parse(req.body);
    const [row] = await db.insert(conversations).values(body).returning();
    res.status(201).json(row);
  } catch (err) {
    req.log.error(err, "createOpenaiConversation failed");
    res.status(400).json({ error: "Failed to create conversation" });
  }
});

// GET /openai/conversations/:id
router.get("/openai/conversations/:id", async (req, res) => {
  try {
    const { id } = GetOpenaiConversationParams.parse({ id: Number(req.params.id) });
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) return res.status(404).json({ error: "Conversation not found" });
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
    res.json({ ...conv, messages: msgs });
  } catch (err) {
    req.log.error(err, "getOpenaiConversation failed");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// DELETE /openai/conversations/:id
router.delete("/openai/conversations/:id", async (req, res) => {
  try {
    const { id } = DeleteOpenaiConversationParams.parse({ id: Number(req.params.id) });
    const [row] = await db.delete(conversations).where(eq(conversations.id, id)).returning();
    if (!row) return res.status(404).json({ error: "Conversation not found" });
    res.status(204).send();
  } catch (err) {
    req.log.error(err, "deleteOpenaiConversation failed");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// GET /openai/conversations/:id/messages
router.get("/openai/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = ListOpenaiMessagesParams.parse({ id: Number(req.params.id) });
    const msgs = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(asc(messages.createdAt));
    res.json(msgs);
  } catch (err) {
    req.log.error(err, "listOpenaiMessages failed");
    res.status(500).json({ error: "Failed to list messages" });
  }
});

// POST /openai/conversations/:id/messages  — streaming SSE
router.post("/openai/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = SendOpenaiMessageParams.parse({ id: Number(req.params.id) });
    const { content, restaurantContext } = SendOpenaiMessageBody.parse(req.body);

    // Verify conversation exists
    const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    // Build context string from restaurantContext (JSON with selected restaurant data)
    let contextBlock = "";
    if (restaurantContext) {
      try {
        const ctx = JSON.parse(restaurantContext);
        if (ctx.selected) {
          const rest = ctx.selected;
          const dishList = Array.isArray(ctx.dishes) && ctx.dishes.length > 0
            ? ctx.dishes.map((d: any) => `  - ${d.name} (${d.category}${d.rawOrCooked ? ", " + d.rawOrCooked : ""}) | Score: ${d.recommendationScore ?? "N/A"}/10 | Evidence: ${d.evidenceLevel ?? "unknown"} | Type: ${d.evidenceType ?? "N/A"} | Diet: ${d.dietTags ?? "N/A"} | ${d.description ?? ""}`).join("\n")
            : "  No dish data available.";
          contextBlock = `
SELECTED RESTAURANT CONTEXT (curated database):
Name: ${rest.name}
City: ${rest.city}${rest.district ? ", " + rest.district : ""}
Cuisine: ${rest.cuisine}
Best For: ${rest.bestFor ?? "N/A"}
Strengths: ${rest.strengths ?? "N/A"}
Weaknesses: ${rest.weaknesses ?? "N/A"}
Evidence Level: ${rest.evidenceLevel ?? "unknown"}
Rating Notes: ${rest.ratingSourceNotes ?? "No rating data"}
Opening Hours: ${rest.openingHoursNotes ?? "Not available"}
Review Consensus: ${rest.reviewConsensusSummary ?? "No review summary available"}

MENU / DISHES (curated):
${dishList}

SHORTLISTED RESTAURANTS:
${Array.isArray(ctx.shortlist) && ctx.shortlist.length > 0 ? ctx.shortlist.map((r: any) => `  - ${r.name} (${r.cuisine}, ${r.city})`).join("\n") : "  None shortlisted."}
`;
        }
      } catch {}
    }

    // Load previous messages
    const prevMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    const systemPrompt = await getSystemPrompt();

    const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: systemPrompt + (contextBlock ? "\n\n" + contextBlock : ""),
      },
      ...prevMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content },
    ];

    // Save user message
    await db.insert(messages).values({ conversationId: id, role: "user", content });

    // Stream response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
      }
    }

    // Save assistant message
    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error(err, "sendOpenaiMessage failed");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to send message" });
    } else {
      res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
      res.end();
    }
  }
});

export default router;
