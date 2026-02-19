/**
 * App.jsx — Componente raiz da aplicação Tech Wishlist.
 *
 * Gerencia:
 * - CRUD via hook useTechs (Supabase)
 * - Posições x,y de cada card no canvas (drag livre)
 * - Tamanhos w,h de cada card (resize)
 * - Posição e tamanho do TechFormWidget
 * - Layout geral da dashboard (Canvas Infinito com Zoom & Pan)
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { useTechs } from "./hooks/useTechs";
import TechFormWidget from "./components/TechFormWidget";
import BrandLogoWidget from "./components/BrandLogoWidget";
import ZoomControls from "./components/ZoomControls";
import TechList from "./components/TechList";
import ErrorBanner from "./components/ErrorBanner";

/**
 * Calcula posições iniciais em grid para cards sem posição definida.
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

  // ─── Card State ───
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem("tech_layout_positions");
    if (saved) {
      const parsed = JSON.parse(saved);
      const sanitized = {};
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

  // ─── Form Widget State ───
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

  // ─── Logo Widget State ───
  const [logoPos, setLogoPos] = useState(() => {
    const saved = localStorage.getItem("tech_layout_logo_pos");
    if (saved) {
      const p = JSON.parse(saved);
      return { x: Math.max(0, p.x), y: Math.max(0, p.y) };
    }
    return { x: 400, y: 20 };
  });

  // ─── View State (Pan & Zoom) ───
  const [viewState, setViewState] = useState(() => {
    const saved = localStorage.getItem("tech_layout_view");
    return saved ? JSON.parse(saved) : { x: 0, y: 0, scale: 1 };
  });

  const containerRef = useRef(null);

  // ─── Grid auto-posicionamento ───
  useEffect(() => {
    if (techs.length === 0) return;
    const width = containerRef.current?.offsetWidth || 900;
    setPositions((prev) => calculateGridPositions(techs, prev, width));
  }, [techs]);

  // ─── handleDragEnd (CORE) ───
  // Atualiza posição do item arrastado, compensando zoom.
  const handleDragEnd = useCallback((event) => {
    const { active, delta } = event;
    if (!delta) return;

    const scale = viewState.scale;
    const adjustedDelta = {
      x: delta.x / scale,
      y: delta.y / scale,
    };

    if (active.id === "tech-form-widget") {
      setFormPos((prev) => ({
        x: prev.x + adjustedDelta.x,
        y: prev.y + adjustedDelta.y,
      }));
    } else if (active.id === "brand-logo-widget") {
      setLogoPos((prev) => ({
        x: prev.x + adjustedDelta.x,
        y: prev.y + adjustedDelta.y,
      }));
    } else {
      setPositions((prev) => {
        const current = prev[active.id] || { x: 0, y: 0 };
        return {
          ...prev,
          [active.id]: {
            x: current.x + adjustedDelta.x,
            y: current.y + adjustedDelta.y,
          },
        };
      });
    }
  }, [viewState.scale]);

  // ─── Zoom Helpers ───
  const handleZoomIn = useCallback(() => {
    setViewState((prev) => ({ ...prev, scale: Math.min(prev.scale + 0.1, 5) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setViewState((prev) => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.1) }));
  }, []);

  const handleReset = useCallback(() => {
    setViewState({ x: 0, y: 0, scale: 1 });
  }, []);

  // ─── Auto-Pan Logic (Edge Scrolling) ───
  const [isDraggingItem, setIsDraggingItem] = useState(false);
  const autoPanIntervalRef = useRef(null);
  const currentPanVelocity = useRef({ dx: 0, dy: 0 });

  const handleGlobalDragStart = useCallback(() => {
    setIsDraggingItem(true);
  }, []);

  const handleGlobalDragEnd = useCallback(
    (event) => {
      setIsDraggingItem(false);
      handleDragEnd(event);
      // stopAutoPan inline
      if (autoPanIntervalRef.current) {
        clearInterval(autoPanIntervalRef.current);
        autoPanIntervalRef.current = null;
      }
      currentPanVelocity.current = { dx: 0, dy: 0 };
    },
    [handleDragEnd]
  );

  useEffect(() => {
    if (!isDraggingItem) {
      if (autoPanIntervalRef.current) {
        clearInterval(autoPanIntervalRef.current);
        autoPanIntervalRef.current = null;
      }
      currentPanVelocity.current = { dx: 0, dy: 0 };
      return;
    }

    // Inicia loop de auto-pan (60fps)
    autoPanIntervalRef.current = setInterval(() => {
      const { dx, dy } = currentPanVelocity.current;
      if (dx !== 0 || dy !== 0) {
        setViewState((prev) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
      }
    }, 16);

    const checkEdge = (x, y) => {
      const edgeThreshold = 100;
      const maxSpeed = 25;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let dx = 0;
      let dy = 0;

      if (x < edgeThreshold) dx = Math.min(maxSpeed, (edgeThreshold - x) / 2);
      if (x > vw - edgeThreshold)
        dx = -Math.min(maxSpeed, (x - (vw - edgeThreshold)) / 2);
      if (y < edgeThreshold) dy = Math.min(maxSpeed, (edgeThreshold - y) / 2);
      if (y > vh - edgeThreshold)
        dy = -Math.min(maxSpeed, (y - (vh - edgeThreshold)) / 2);

      currentPanVelocity.current = { dx, dy };
    };

    const onMouseMove = (e) => checkEdge(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        checkEdge(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      if (autoPanIntervalRef.current) {
        clearInterval(autoPanIntervalRef.current);
        autoPanIntervalRef.current = null;
      }
    };
  }, [isDraggingItem]);

  // ─── Canvas Wheel Zoom/Pan ───
  const handleWheel = useCallback(
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const newScale = Math.min(
          Math.max(0.1, viewState.scale + delta),
          5
        );
        setViewState((prev) => ({ ...prev, scale: newScale }));
      } else {
        setViewState((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [viewState.scale]
  );

  // ─── Background Pan (Click + Drag no fundo) ───
  const [isPanning, setIsPanning] = useState(false);
  const lastPanRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    const isInteractive = e.target.closest(
      "button, input, a, .tech-card, .glass-card, .resize-handle"
    );
    if (!isInteractive && (e.button === 0 || e.button === 1)) {
      setIsPanning(true);
      lastPanRef.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isPanning) return;
      const dx = e.clientX - lastPanRef.current.x;
      const dy = e.clientY - lastPanRef.current.y;
      lastPanRef.current = { x: e.clientX, y: e.clientY };
      setViewState((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    if (isPanning) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("mousemove", handleMouseMove);
    } else {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    }
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isPanning, handleMouseMove, handleMouseUp]);

  // ─── Resize Helpers ───
  const handleResizeCard = useCallback((id, newSize) => {
    setSizes((prev) => ({ ...prev, [id]: newSize }));
  }, []);

  const handleResizeForm = useCallback((newSize) => {
    setFormSize(newSize);
  }, []);

  // ─── Persistência ───
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

  useEffect(() => {
    localStorage.setItem("tech_layout_view", JSON.stringify(viewState));
  }, [viewState]);

  // ─── Render ───
  return (
    <div
      className={`app-container ${isPanning ? "cursor-grabbing" : "cursor-grab"}`}
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      style={{ touchAction: "none" }}
    >
      <div className="glow glow-1" />
      <div className="glow glow-2" />

      {error && <ErrorBanner message={error} onDismiss={clearError} />}

      <TechList
        techs={techs}
        positions={positions}
        sizes={sizes}
        onUpdate={updateTech}
        onDelete={deleteTech}
        onDragStart={handleGlobalDragStart}
        onDragEnd={handleGlobalDragEnd}
        onResize={handleResizeCard}
        loading={loading}
        viewState={viewState}
      >
        <BrandLogoWidget position={logoPos} />
        <TechFormWidget
          onAdd={addTech}
          position={formPos}
          size={formSize}
          onResize={handleResizeForm}
          techCount={techs.length}
        />
      </TechList>

      <ZoomControls
        scale={viewState.scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
      />

      <footer className="app-footer pointer-events-none fixed bottom-4 left-1/2 -translate-x-1/2">
        <p>
          Feito com <span className="text-red-400">♥</span> por{" "}
          <strong>Vintage DevStack</strong>
        </p>
      </footer>
    </div>
  );
}

export default App;
