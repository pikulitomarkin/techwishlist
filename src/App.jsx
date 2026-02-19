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
    return saved ? JSON.parse(saved) : {};
  });
  const [sizes, setSizes] = useState(() => {
    const saved = localStorage.getItem("tech_layout_sizes");
    return saved ? JSON.parse(saved) : {};
  });

  // Form Widget state
  const [formPos, setFormPos] = useState(() => {
    const saved = localStorage.getItem("tech_layout_form_pos");
    return saved ? JSON.parse(saved) : { x: 20, y: 140 };
  });
  const [formSize, setFormSize] = useState(() => {
    const saved = localStorage.getItem("tech_layout_form_size");
    return saved ? JSON.parse(saved) : { w: 360, h: "auto" };
  });

  // Logo Widget state
  const [logoPos, setLogoPos] = useState(() => {
    const saved = localStorage.getItem("tech_layout_logo_pos");
    return saved ? JSON.parse(saved) : { x: 400, y: 20 };
  });

  const containerRef = useRef(null);

  // Atribui posições automáticas
  useEffect(() => {
    if (techs.length === 0) return;
    const width = containerRef.current?.offsetWidth || 900;
    setPositions((prev) => calculateGridPositions(techs, prev, width));
  }, [techs]);

  /**
   * Gerencia drag de TODOS os elementos (cards e form widget).
   */
  const handleDragEnd = useCallback((event) => {
    const { active, delta } = event;
    if (!delta) return;

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

  // ─── Persistence Effects ───
  useEffect(() => {
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
