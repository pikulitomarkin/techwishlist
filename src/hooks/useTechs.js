/**
 * Hook customizado para gerenciar CRUD de tarefas via API REST (Neon/Vercel).
 */
import { useState, useEffect, useCallback } from "react";

const API = "/api/tasks";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useTechs() {
  const [techs, setTechs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /** Busca todas as tarefas da API */
  const fetchTechs = useCallback(async () => {
    try {
      const data = await apiFetch(API);
      setTechs(data);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar tarefas:", err);
      setError("Não foi possível carregar as tarefas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Adiciona nova tarefa */
  const addTech = useCallback(
    async (tech) => {
      setError(null);
      try {
        await apiFetch(API, { method: "POST", body: JSON.stringify(tech) });
        await fetchTechs();
        return true;
      } catch (err) {
        console.error("Erro ao adicionar:", err);
        setError("Erro ao adicionar tarefa. Tente novamente.");
        return false;
      }
    },
    [fetchTechs],
  );

  /** Atualiza tarefa existente (optimistic update) */
  const updateTech = useCallback(
    async (id, updates) => {
      // Atualiza localmente de imediato
      setTechs((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
      setError(null);
      try {
        await apiFetch(`${API}/${id}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        });
        return true;
      } catch (err) {
        console.error("Erro ao atualizar:", err);
        setError("Erro ao atualizar tarefa. Tente novamente.");
        await fetchTechs(); // reverte em caso de erro
        return false;
      }
    },
    [fetchTechs],
  );

  /** Remove tarefa (optimistic update) */
  const deleteTech = useCallback(
    async (id) => {
      setTechs((prev) => prev.filter((t) => String(t.id) !== String(id)));
      setError(null);
      try {
        await apiFetch(`${API}/${id}`, { method: "DELETE" });
        return true;
      } catch (err) {
        console.error("Erro ao remover:", err);
        setError("Erro ao remover tarefa. Tente novamente.");
        await fetchTechs(); // reverte em caso de erro
        return false;
      }
    },
    [fetchTechs],
  );

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    fetchTechs();
  }, [fetchTechs]);

  return { techs, setTechs, loading, error, addTech, updateTech, deleteTech, clearError };
}
