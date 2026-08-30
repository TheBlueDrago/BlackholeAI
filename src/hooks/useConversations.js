import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "infinity-ai-conversations";

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function useConversations() {
  const [conversations, setConversations] = useState(load);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    if (activeId === null && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  const createConversation = useCallback((title = "New Chat") => {
    const id = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
    const conv = { id, title, messages: [], created_date: Date.now() };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(id);
    return id;
  }, []);

  const selectConversation = useCallback((id) => setActiveId(id), []);

  const addMessage = useCallback((convId, message) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, message] } : c))
    );
  }, []);

  const renameConversation = useCallback((id, title) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  }, []);

  const removeMessage = useCallback((convId, index) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages: c.messages.filter((_, i) => i !== index) } : c))
    );
  }, []);

  const deleteConversation = useCallback((id) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const reload = useCallback(() => setConversations(load), []);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  return {
    conversations,
    activeId,
    activeConversation,
    createConversation,
    selectConversation,
    addMessage,
    renameConversation,
    removeMessage,
    deleteConversation,
    reload,
  };
}