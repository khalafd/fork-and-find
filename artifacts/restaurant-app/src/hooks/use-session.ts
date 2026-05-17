export function getSessionId() {
  let sessionId = sessionStorage.getItem("fork-and-find-session-id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("fork-and-find-session-id", sessionId);
  }
  return sessionId;
}

export function getConversationId(): number | null {
  const stored = sessionStorage.getItem("fork-and-find-conv-id");
  return stored ? parseInt(stored, 10) : null;
}

export function setConversationId(id: number) {
  sessionStorage.setItem("fork-and-find-conv-id", id.toString());
}
