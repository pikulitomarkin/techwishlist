/**
 * App.jsx — Componente raiz da aplicação Tech Wishlist.
 *
 * Gerencia:
 * - CRUD via hook useTechs (Supabase)
 * - Posições x,y de cada card no canvas (drag livre)
 * - Tamanhos w,h de cada card (resize)
 * - Posição e tamanho do TechFormWidget (novo)
 * - Layout geral da dashboard (Canvas Infinito)
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useTechs } from "./hooks/useTechs";
import TechFormWidget from "./components/TechFormWidget"; // Widget flutuante
import BrandLogoWidget from "./components/BrandLogoWidget"; // Logo arrastável
import TechList from "./components/TechList";
import ErrorBanner from "./components/ErrorBanner";

/**
 * Calcula posições iniciais em grid para cards sem posição definida.
 * Distribui em colunas de 300px com 16px de gap.
 */
function calculateGridPositions(techs, existingPositions, containerWidth = 900) {
  const positions = { ...existingPositions };
  const cardW = 280;
  const cardH = 72;
  const gapX = 16;
  const gapY = 16;
  const cols = Math.max(1, Math.floor(containerWidth / (cardW + gapX)));

  let nextIndex = 0;

  techs.forEach((tech) => {
    if (positions[tech.id]) return;
    const col = nextIndex % cols;
    const row = Math.floor(nextIndex / cols);
    // Offset inicial para não ficar em cima do form (exagerado para segurança)
    const startY = 400;
    positions[tech.id] = {
      x: col * (cardW + gapX),
      y: startY + row * (cardH + gapY),
    };
    nextIndex++;
  });

  return positions;
}

function App() {
  const { techs, loading, error, addTech, updateTech, deleteTech, clearError } =
    useTechs();

  // Cards state
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem("tech_layout_positions");
    if (saved) {
      const parsed = JSON.parse(saved);
      const sanitized = {};
      // Sanitiza cada posição salva
      Object.keys(parsed).forEach((key) => {
        sanitized[key] = {
          x: Math.max(0, parsed[key].x),
          y: Math.max(0, parsed[key].y),
        };
      });
      return sanitized;
    }
    return {};
  });
  const [sizes, setSizes] = useState(() => {
    const saved = localStorage.getItem("tech_layout_sizes");
    return saved ? JSON.parse(saved) : {};
  });

  // Form Widget state
  const [formPos, setFormPos] = useState(() => {
    const saved = localStorage.getItem("tech_layout_form_pos");
    if (saved) {
      const p = JSON.parse(saved);
      return { x: Math.max(0, p.x), y: Math.max(0, p.y) };
    }
    return { x: 20, y: 140 };
  });
  const [formSize, setFormSize] = useState(() => {
    const saved = localStorage.getItem("tech_layout_form_size");
    return saved ? JSON.parse(saved) : { w: 360, h: "auto" };
  });

  // Logo Widget state
  const [logoPos, setLogoPos] = useState(() => {
    const saved = localStorage.getItem("tech_layout_logo_pos");
    if (saved) {
      const p = JSON.parse(saved);
      return { x: Math.max(0, p.x), y: Math.max(0, p.y) };
    }
    return { x: 400, y: 20 };
  });

  const containerRef = useRef(null);

  // Atribui posições automáticas
  useEffect(() => {
    if (techs.length === 0) return;
    const width = containerRef.current?.offsetWidth || 900;
    setPositions((prev) => calculateGridPositions(techs, prev, width));
  }, [techs]);

  /**
   * handleDragEnd: O Coração do Drag & Drop
   * 
   * Esta função é chamada quando o usuário solta um item.
   * O objeto 'active' diz quem foi arrastado.
   * O objeto 'delta' diz o quanto ele se moveu (x, y) desde o início.
   */
  const handleDragEnd = useCallback((event) => {
    const { active, delta } = event;
    if (!delta) return;

    // Lógica para limitar o movimento (Clamping)
    // Math.max(0, valor) garante que nunca tenhamos coordenadas negativas.
    // Isso cria uma "parede invisível" no topo e esquerda.

    if (active.id === "tech-form-widget") {
      setFormPos((prev) => ({
        x: Math.max(0, prev.x + delta.x),
        y: Math.max(0, prev.y + delta.y),
      }));
    } else if (active.id === "brand-logo-widget") {
      setLogoPos((prev) => ({
        x: Math.max(0, prev.x + delta.x),
        y: Math.max(0, prev.y + delta.y),
      }));
    } else {
      // Para os cards normais, atualizamos apenas o ID específico
      setPositions((prev) => {
        const current = prev[active.id] || { x: 0, y: 0 };
        return {
          ...prev,
          [active.id]: {
            x: Math.max(0, current.x + delta.x),
            y: Math.max(0, current.y + delta.y),
          },
        };
      });
    }
  }, []);

  const handleResizeCard = useCallback((id, newSize) => {
    setSizes((prev) => ({ ...prev, [id]: newSize }));
  }, []);

  const handleResizeForm = useCallback((newSize) => {
    setFormSize(newSize);
  }, []);

  // ─── EFFECTS: PERSISTÊNCIA ───
  // Para que o usuário não perca o layout ao dar F5, salvamos tudo no localStorage.
  // O useEffect roda sempre que o estado especificado no array de dependências muda.

  useEffect(() => {
    // JSON.stringify converte o objeto JS em string para salvar no browser
    localStorage.setItem("tech_layout_positions", JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem("tech_layout_sizes", JSON.stringify(sizes));
  }, [sizes]);

  useEffect(() => {
    localStorage.setItem("tech_layout_form_pos", JSON.stringify(formPos));
  }, [formPos]);

  useEffect(() => {
    localStorage.setItem("tech_layout_form_size", JSON.stringify(formSize));
  }, [formSize]);

  useEffect(() => {
    localStorage.setItem("tech_layout_logo_pos", JSON.stringify(logoPos));
  }, [logoPos]);

  return (
    <div className="app-container" ref={containerRef}>
      {/* Efeitos decorativos de fundo */}
      <div className="glow glow-1" />
      <div className="glow glow-2" />



      {/* Banner de erro */}
      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      {/* DndContext Global (Canvas) gerenciado pelo TechList
          Mas o TechFormWidget precisa estar DENTRO do contexto de drag.
          
          Como o TechList já tem o DndContext interno, precisamos refatorar
          para elevar o DndContext para o App, OU passar o Widget como children pro TechList.
          
          Vou usar a estratégia de passar como children para o TechList (que virou um CanvasWrapper).
       */}

      <TechList
        techs={techs}
        positions={positions}
        sizes={sizes}
        onUpdate={updateTech}
        onDelete={deleteTech}
        onDragEnd={handleDragEnd}
        onResize={handleResizeCard}
        loading={loading}
      >
        {/* Logo Widget arrastável */}
        <BrandLogoWidget position={logoPos} />

        {/* TechFormWidget agora vive dentro do Canvas Context */}
        <TechFormWidget
          onAdd={addTech}
          position={formPos}
          size={formSize}
          onResize={handleResizeForm}
          techCount={techs.length}
        />
      </TechList>

      {/* Footer */}
      <footer className="app-footer pointer-events-none">
        <p>
          Feito com <span className="text-red-400">♥</span> por{" "}
          <strong>Vintage DevStack</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
