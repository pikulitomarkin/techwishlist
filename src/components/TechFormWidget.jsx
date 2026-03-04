/**
 * TechFormWidget — Versão Flutuante e Arrastável do TechForm.
 *
 * Funcionalidades:
 * - Drag livre (useDraggable do @dnd-kit/core) usando o header como grip.
 * - Resize manual (mouse drag no canto inferior direito).
 * - Layout responsivo interno (conteúdo se adapta).
 * - "Sempre no topo" (z-index alto).
 */
import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useDraggable } from "@dnd-kit/core";
import { Plus, GripHorizontal } from "lucide-react";
import { getSuggestions, getTechIcon } from "../data/techIcons";
import TechIcon from "./TechIcon";

// Configuração de status
const STATUSES = [
    { key: "Pendente", dot: "🔴", color: "#ef4444" },
    { key: "Em Andamento", dot: "🟡", color: "#eab308" },
    { key: "Concluído", dot: "🟢", color: "#22c55e" },
];

// Tamanhos limites do widget
const MIN_W = 320;
const MIN_H = 200; // Altura inicial compacta
const MAX_W = 600;
const MAX_H = 600;

function TechFormWidget({ onAdd, position, size, onResize, techCount }) {
    const [name, setName] = useState("");
    const [priority, setPriority] = useState(3);
    const [status, setStatus] = useState("Pendente");
    const [responsavel, setResponsavel] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Resize state
    const [isResizing, setIsResizing] = useState(false);
    const resizeStart = useRef({ mouseX: 0, mouseY: 0, w: 0, h: 0 });

    // UseDraggable para mover o widget
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: "tech-form-widget",
            disabled: isResizing, // Desabilita drag durante resize
        });

    // ─── Resize Handlers ───
    const handleResizeStart = useCallback(
        (e) => {
            e.preventDefault(); // Previne seleção de texto
            e.stopPropagation(); // IMPORTANTE: Impede que o drag do pai (useDraggable) seja ativado
            setIsResizing(true);
            resizeStart.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                w: size?.w ?? 360,
                h: size?.h ?? "auto",
            };
        },
        [size]
    );

    useEffect(() => {
        if (!isResizing) return;

        function handleMouseMove(e) {
            const dx = e.clientX - resizeStart.current.mouseX;
            const dy = e.clientY - resizeStart.current.mouseY;

            const newW = Math.min(MAX_W, Math.max(MIN_W, resizeStart.current.w + dx));
            // Altura pode ser auto, mas se usuário redimensionar, vira fixa
            const currentH = typeof resizeStart.current.h === 'number' ? resizeStart.current.h : 300;
            const newH = Math.min(MAX_H, Math.max(MIN_H, currentH + dy));

            onResize({ w: newW, h: newH });
        }

        function handleMouseUp() {
            setIsResizing(false);
        }

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, onResize]);

    // Autocomplete
    useEffect(() => {
        const results = getSuggestions(name);
        setSuggestions(results);
        setShowSuggestions(results.length > 0 && name.length >= 2);
    }, [name]);

    // Click outside suggestions
    useEffect(() => {
        function handleClickOutside(e) {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target) &&
                inputRef.current &&
                !inputRef.current.contains(e.target)
            ) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        setSubmitting(true);
        const success = await onAdd({ name: trimmedName, priority, status, responsavel: responsavel.trim() });

        if (success) {
            setName("");
            setPriority(3);
            setStatus("Pendente");
            setResponsavel("");
            setShowSuggestions(false);
        }
        setSubmitting(false);
    }

    function selectSuggestion(suggestion) {
        setName(suggestion.name);
        setShowSuggestions(false);
        inputRef.current?.focus();
    }

    const currentIcon = getTechIcon(name);
    const widgetW = size?.w ?? 360;
    const widgetH = size?.h ?? "auto";

    // Estilo do Widget
    const style = {
        position: "absolute",
        left: position?.x ?? 20, // Padrão canto superior esquerdo com margem
        top: position?.y ?? 140, // Abaixo do header
        width: widgetW,
        height: widgetH,
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        zIndex: isDragging ? 200 : 150, // Sempre acima dos cards
        transition: isDragging || isResizing ? "none" : "box-shadow 0.2s ease",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`glass-card rounded-2xl flex flex-col ${isDragging ? "opacity-90 scale-[1.02]" : ""}`}
        >
            {/* Header / Grip Handle com Título e Contador */}
            <div
                {...listeners}
                {...attributes}
                className="form-header cursor-grab active:cursor-grabbing p-4 border-b border-white/5 flex items-center justify-between bg-white/5 rounded-t-2xl select-none"
            >
                <div className="flex items-center gap-2">
                    <h2 className="text-white/90 text-sm font-bold uppercase tracking-wide">Minhas Tarefas</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded-full font-medium">
                        {techCount}
                    </span>
                    <GripHorizontal className="text-white/20 hover:text-white/50 transition-colors" size={16} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col flex-1 h-full">
                <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-violet-400" />
                    Nova Tarefa
                </h3>

                {/* Input */}
                <div className="relative mb-4">
                        <label htmlFor="tech-name" className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
                        NOME
                    </label>
                    <div className="relative flex items-center">
                        {currentIcon && (
                            <div className="absolute left-3 pointer-events-none">
                                <TechIcon name={name} size={20} />
                            </div>
                        )}
                        <input
                            ref={inputRef}
                            id="tech-name"
                            type="text"
                            placeholder="Ex: Corrigir bug de login..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            className={`input-field w-full ${currentIcon ? "pl-10" : ""}`}
                            autoComplete="off"
                        />
                    </div>

                    {/* Sugestões */}
                    {showSuggestions && (
                        <div ref={suggestionsRef} className="suggestions-dropdown max-h-40 overflow-y-auto">
                            {suggestions.map((s) => (
                                <button
                                    key={s.name}
                                    type="button"
                                    onClick={() => selectSuggestion(s)}
                                    className="suggestion-item"
                                >
                                    <img src={s.iconUrl} alt={s.name} width={20} height={20} className="tech-icon" />
                                    <span>{s.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Prioridade */}
                <div className="mb-4">
                    <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
                        Prioridade
                    </label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPriority(p)}
                                className={`priority-btn ${priority === p ? "priority-btn-active" : ""}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                    <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
                        Status
                    </label>
                    <div className="flex gap-2">
                        {STATUSES.map((s) => (
                            <button
                                key={s.key}
                                type="button"
                                onClick={() => setStatus(s.key)}
                                className="status-form-btn"
                                style={status === s.key ? {
                                    borderColor: s.color,
                                    backgroundColor: s.color + "25",
                                    color: s.color,
                                } : {}}
                            >
                                <span>{s.dot}</span>
                                <span className="text-xs">{s.key}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Responsável */}
                <div className="mb-4">
                    <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
                        Responsável
                    </label>
                    <input
                        type="text"
                        placeholder="Ex: João Silva..."
                        value={responsavel}
                        onChange={(e) => setResponsavel(e.target.value)}
                        className="input-field w-full"
                        autoComplete="off"
                    />
                </div>

                {/* Botão (empurrado para baixo se houver espaço extra) */}
                <div className="mt-auto">
                    <button
                        type="submit"
                        disabled={submitting || !name.trim()}
                        className="btn-primary w-full"
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="loading-spinner" /> Salvando...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                Adicionar
                            </span>
                        )}
                    </button>
                </div>
            </form>

            {/* Resize Handle */}
            <div
                className="resize-handle"
                onMouseDown={handleResizeStart}
                title="Redimensionar Widget"
            />
        </div>
    );
}

TechFormWidget.propTypes = {
    onAdd: PropTypes.func.isRequired,
    position: PropTypes.shape({ x: PropTypes.number, y: PropTypes.number }),
    size: PropTypes.shape({ w: PropTypes.number, h: PropTypes.oneOfType([PropTypes.number, PropTypes.string]) }),
    onResize: PropTypes.func.isRequired,
    techCount: PropTypes.number,
};

export default TechFormWidget;
