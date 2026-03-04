/**
 * TechCard — Card arrastável de tarefa com resize, scaling, status e responsável.
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useDraggable } from "@dnd-kit/core";
import { Pencil, Trash2, Check, X, GripVertical, Star, UserPlus } from "lucide-react";
import TechIcon from "./TechIcon";

/**
 * Mapa de cores por prioridade (Tailwind gradient classes).
 * Cada prioridade tem um gradiente visual distinto.
 */
const PRIORITY_COLORS = {
    1: "from-gray-500 to-gray-600",    // Baixa
    2: "from-blue-500 to-blue-600",    // Normal
    3: "from-amber-500 to-amber-600",  // Média
    4: "from-orange-500 to-orange-600", // Alta
    5: "from-red-500 to-red-600",      // Urgente
};

/** Labels de prioridade para exibição ao usuário */
const PRIORITY_LABELS = {
    1: "Baixa",
    2: "Normal",
    3: "Média",
    4: "Alta",
    5: "Urgente",
};

/** Configuração visual de cada status */
const STATUS_CONFIG = {
    "Pendente":     { color: "#ef4444", dot: "🔴" },
    "Em Andamento": { color: "#eab308", dot: "🟡" },
    "Concluído":    { color: "#22c55e", dot: "🟢" },
};

const STATUS_KEYS = ["Pendente", "Em Andamento", "Concluído"];

/** Gera iniciais: "João Silva" → "JS" */
function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Gera cor HSL consistente baseada no nome */
function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return `hsl(${Math.abs(hash) % 360}, 60%, 45%)`;
}

/**
 * 🎓 MENTORIA — Constantes de Limite
 * Definidas fora do componente (não mudam entre renders).
 * Isso evita recriação desnecessária a cada render.
 */
const MIN_W = 200;  // Largura mínima do card
const MIN_H = 60;   // Altura mínima do card
const MAX_W = 600;  // Largura máxima do card
const MAX_H = 400;  // Altura máxima do card

/**
 * @param {Object} tech - Dados da tecnologia { id, name, priority }
 * @param {Object} position - Coordenadas no canvas { x, y }
 * @param {Object} size - Dimensões { w, h } (opcional, tem defaults)
 * @param {Function} onUpdate - Callback para salvar edições
 * @param {Function} onDelete - Callback para remover a tecnologia
 * @param {Function} onResize - Callback para salvar novo tamanho
 */
function TechCard({ tech, position, size, onUpdate, onDelete, onResize }) {
    // ─── Edit mode state ───
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(tech.name);
    const [editPriority, setEditPriority] = useState(tech.priority);
    const [editStatus, setEditStatus] = useState(tech.status || "Pendente");
    const [editResponsavel, setEditResponsavel] = useState(tech.responsavel || "");
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    // ─── Completion state ───
    const [isCompleting, setIsCompleting] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // ─── Status dropdown ───
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const statusDropdownRef = useRef(null);
    const statusBtnRef = useRef(null);

    // ─── Responsável inline edit ───
    const [editingResponsavel, setEditingResponsavel] = useState(false);
    const [editResponsavelValue, setEditResponsavelValue] = useState(tech.responsavel || "");

    // ─── Estado de redimensionamento ───
    const [isResizing, setIsResizing] = useState(false);
    const resizeStart = useRef({ mouseX: 0, mouseY: 0, w: 0, h: 0 });

    /**
     * 🎓 MENTORIA — useDraggable (dnd-kit)
     *
     * Hook que torna este elemento arrastável. Retorna:
     * - attributes: props de acessibilidade (aria-*, role, tabindex)
     * - listeners: event handlers de drag (onPointerDown, etc.)
     * - setNodeRef: callback ref para o elemento DOM
     * - transform: { x, y } — offset visual DURANTE o drag
     * - isDragging: boolean — se está sendo arrastado agora
     *
     * disabled: desabilita drag durante edição, delete ou resize
     * para evitar "capture" acidental.
     */
    const { attributes, listeners, setNodeRef, transform, isDragging } =
        useDraggable({
            id: tech.id,
            disabled: editing || confirmDelete || isResizing || isCompleting || editingResponsavel,
        });

    // ─── Detecta card montado com status "Concluído" ───
    useEffect(() => {
        if ((tech.status || "Pendente") === "Concluído") {
            triggerCompletion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Fecha dropdown ao clicar fora ───
    useEffect(() => {
        if (!showStatusDropdown) return;
        function handleClick(e) {
            if (
                statusDropdownRef.current && !statusDropdownRef.current.contains(e.target) &&
                statusBtnRef.current && !statusBtnRef.current.contains(e.target)
            ) {
                setShowStatusDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showStatusDropdown]);

    // ═══════════════════════════════════════════════════════
    // 📏 RESIZE — Redimensionamento via Handle
    // ═══════════════════════════════════════════════════════

    /**
     * 🎓 MENTORIA — Padrão de Resize Manual
     *
     * COMO FUNCIONA:
     * 1. mouseDown no handle → salva posição inicial do mouse e tamanho atual
     * 2. mouseMove na WINDOW → calcula delta (diferença) → novo tamanho
     * 3. mouseUp → para de redimensionar
     *
     * e.stopPropagation() é CRUCIAL aqui — sem isso, o drag do dnd-kit
     * capturaria o evento e interpretaria como "arrastar o card".
     */
    const handleResizeStart = useCallback(
        (e) => {
            e.preventDefault();       // Previne seleção de texto
            e.stopPropagation();      // Impede que o dnd-kit capture o evento
            setIsResizing(true);
            resizeStart.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                w: size?.w ?? 280,    // Nullish coalescing: usa default se size for null/undefined
                h: size?.h ?? 72,
            };
        },
        [size]
    );

    /**
     * 🎓 MENTORIA — Effect para Listeners Temporários
     *
     * Os listeners de mousemove/mouseup são adicionados APENAS
     * enquanto isResizing === true. Quando o resize termina,
     * a cleanup function os remove.
     *
     * Isso é um padrão comum para qualquer interação de "drag":
     * mouseDown → addEventListener → mouseMove/mouseUp → removeEventListener
     */
    useEffect(() => {
        if (!isResizing) return; // Não está redimensionando → nada a fazer

        function handleMouseMove(e) {
            // Calcula o quanto o mouse se moveu desde o início
            const dx = e.clientX - resizeStart.current.mouseX;
            const dy = e.clientY - resizeStart.current.mouseY;
            // Aplica o delta ao tamanho original, respeitando min/max
            const newW = Math.min(MAX_W, Math.max(MIN_W, resizeStart.current.w + dx));
            const newH = Math.min(MAX_H, Math.max(MIN_H, resizeStart.current.h + dy));
            // Notifica o pai (App.jsx) para salvar
            onResize(tech.id, { w: newW, h: newH });
        }

        function handleMouseUp() {
            setIsResizing(false);
        }

        // Listeners na WINDOW para capturar mouse fora do elemento
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isResizing, tech.id, onResize]);


    // ─── Scaling proporcional ───
    const cardW = size?.w ?? 280;
    const cardH = size?.h ?? 72;
    const iconSize = Math.min(120, Math.max(28, Math.min(cardH * 0.6, cardW * 0.3)));
    const titleSize = Math.min(32, Math.max(14, cardH * 0.25));
    const metaSize = Math.min(14, Math.max(10, cardH * 0.15));

    const techStatus = tech.status || "Pendente";
    const techResponsavel = tech.responsavel || "";

    const style = {
        position: "absolute",
        left: position?.x ?? 0,
        top: position?.y ?? 0,
        width: cardW,
        minHeight: cardH,
        // Transform visual do dnd-kit (offset durante drag)
        transform: transform
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
        opacity: isDragging ? 0.6 : 1,        // Semi-transparente durante drag
        zIndex: isDragging ? 100 : isResizing ? 99 : 1,
        transition: isDragging || isResizing ? "none" : "box-shadow 0.2s ease",
    };

    // ─── Helpers de conclusão ───
    function triggerCompletion() {
        setIsCompleting(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3500);
        setTimeout(() => onDelete(tech.id), 4000);
    }

    async function handleStatusChange(newStatus) {
        setShowStatusDropdown(false);
        await onUpdate(tech.id, { status: newStatus });
        if (newStatus === "Concluído") {
            triggerCompletion();
        }
    }

    async function handleSaveResponsavel() {
        const trimmed = editResponsavelValue.trim();
        setEditingResponsavel(false);
        await onUpdate(tech.id, { responsavel: trimmed });
    }

    // ─── CRUD handlers ───
    async function handleSave() {
        const trimmed = editName.trim();
        if (!trimmed) return;
        setSaving(true);
        await onUpdate(tech.id, {
            name: trimmed,
            priority: editPriority,
            status: editStatus,
            responsavel: editResponsavel.trim(),
        });
        setSaving(false);
        setEditing(false);
        if (editStatus === "Concluído") {
            triggerCompletion();
        }
    }

    function handleCancel() {
        setEditName(tech.name);
        setEditPriority(tech.priority);
        setEditStatus(tech.status || "Pendente");
        setEditResponsavel(tech.responsavel || "");
        setEditing(false);
    }

    async function handleDelete(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setDeleting(true);
        await onDelete(tech.id);
        setDeleting(false);
        setConfirmDelete(false);
    }

    // Toast portal — presente em todos os modos de render
    const toast = showToast
        ? createPortal(
            <div className="task-toast">✅ Tarefa concluída e removida!</div>,
            document.body
        )
        : null;

    // ═══════════════════════════════════════════════════════
    // 🎨 CONDITIONAL RENDERING — 3 modos de exibição
    // ═══════════════════════════════════════════════════════

    /**
     * 🎓 MENTORIA — Early Returns
     * 
     * O componente retorna JSX diferente baseado no estado:
     * - editing=true → formulário inline
     * - confirmDelete=true → diálogo de confirmação
     * - ambos false → card normal arrastável
     *
     * "Early return" = retorna antes de chegar ao final da função.
     * Muito mais legível que ternários aninhados.
     */

    // ─── Modo Edição (inline) ───
    if (editing) {
        return (
            <>
                {toast}
                <div ref={setNodeRef} style={style} className="tech-card-edit" {...attributes}>
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="tech-card-input"
                        autoFocus
                        placeholder="Nome da tarefa..."
                    />
                    {/* Prioridade */}
                    <div className="flex gap-1.5 mt-2">
                        {[1, 2, 3, 4, 5].map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setEditPriority(p)}
                                className={`priority-btn-sm ${editPriority === p ? "priority-btn-active" : ""}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                    {/* Status */}
                    <div className="mt-2">
                        <label className="block text-white/40 text-xs mb-1 uppercase tracking-wider">Status</label>
                        <div className="flex gap-1.5 flex-wrap">
                            {STATUS_KEYS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setEditStatus(s)}
                                    className="status-edit-btn"
                                    style={editStatus === s ? {
                                        borderColor: STATUS_CONFIG[s].color,
                                        backgroundColor: STATUS_CONFIG[s].color + "30",
                                        color: STATUS_CONFIG[s].color,
                                    } : {}}
                                >
                                    <span>{STATUS_CONFIG[s].dot}</span>
                                    <span>{s}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Responsável */}
                    <div className="mt-2">
                        <label className="block text-white/40 text-xs mb-1 uppercase tracking-wider">Responsável</label>
                        <input
                            type="text"
                            value={editResponsavel}
                            onChange={(e) => setEditResponsavel(e.target.value)}
                            className="tech-card-input"
                            placeholder="Ex: João Silva..."
                        />
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleSave} disabled={saving} className="btn-save-sm">
                            <Check size={14} /> {saving ? "..." : "Salvar"}
                        </button>
                        <button onClick={handleCancel} className="btn-cancel-sm">
                            <X size={14} /> Cancelar
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ─── Modo Confirmação de Delete ───
    if (confirmDelete) {
        return (
            <>
                {toast}
                <div ref={setNodeRef} style={style} className="tech-card-delete" {...attributes}>
                    <p className="text-white/80 text-sm mb-3">
                        Remover <strong>{tech.name}</strong>?
                    </p>
                    <div className="flex gap-2">
                        <button onClick={handleDelete} disabled={deleting} className="btn-danger-sm">
                            {deleting ? "Removendo..." : "Confirmar"}
                        </button>
                        <button onClick={() => setConfirmDelete(false)} className="btn-cancel-sm">
                            Cancelar
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ─── Modo Normal ───
    return (
        <>
            {toast}
            <div
                ref={setNodeRef}
                style={style}
                className={`tech-card group flex flex-row items-center gap-3 ${isCompleting ? "task-completing" : ""}`}
                {...attributes}
            >
                <button className="drag-handle" {...listeners} aria-label="Arrastar card">
                    <GripVertical size={Math.max(16, cardH * 0.2)} />
                </button>

                <div
                    className="tech-card-icon transition-all duration-75"
                    style={{ width: iconSize + 10, height: iconSize + 10 }}
                >
                    <TechIcon name={tech.name} size={iconSize} />
                </div>

                {/* Informações */}
                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                    <h3
                        className="text-white font-medium truncate transition-all duration-75"
                        style={{ fontSize: titleSize, lineHeight: 1.2 }}
                    >
                        {tech.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {/* Bolinha de prioridade */}
                        <span className={`priority-dot bg-gradient-to-r ${PRIORITY_COLORS[tech.priority]}`} />
                        <span
                            className="text-white/40 transition-all duration-75"
                            style={{ fontSize: metaSize }}
                        >
                            {PRIORITY_LABELS[tech.priority]}
                        </span>

                        {/* Badge de status — clicável para alterar */}
                        <div className="relative">
                            <button
                                ref={statusBtnRef}
                                className="status-badge"
                                style={{
                                    backgroundColor: STATUS_CONFIG[techStatus].color + "22",
                                    borderColor: STATUS_CONFIG[techStatus].color + "55",
                                    color: STATUS_CONFIG[techStatus].color,
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowStatusDropdown((v) => !v);
                                }}
                            >
                                <span>{STATUS_CONFIG[techStatus].dot}</span>
                                <span style={{ fontSize: metaSize - 1 }}>{techStatus}</span>
                            </button>
                            {showStatusDropdown && (
                                <div ref={statusDropdownRef} className="status-dropdown">
                                    {STATUS_KEYS.map((s) => (
                                        <button
                                            key={s}
                                            className={`status-dropdown-item ${s === techStatus ? "status-dropdown-item-active" : ""}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(s);
                                            }}
                                        >
                                            <span>{STATUS_CONFIG[s].dot}</span>
                                            <span style={{ color: STATUS_CONFIG[s].color }}>{s}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Lado direito: badge de prioridade + avatar responsável */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <div className={`priority-badge-mini bg-gradient-to-r ${PRIORITY_COLORS[tech.priority]}`}>
                        <Star size={Math.max(8, cardH * 0.12)} />
                        <span style={{ fontSize: Math.max(10, cardH * 0.12) }}>{tech.priority}</span>
                    </div>

                    {/* Avatar / edição inline do responsável */}
                    {editingResponsavel ? (
                        <input
                            className="responsavel-input"
                            value={editResponsavelValue}
                            onChange={(e) => setEditResponsavelValue(e.target.value)}
                            onBlur={handleSaveResponsavel}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveResponsavel();
                                if (e.key === "Escape") setEditingResponsavel(false);
                            }}
                            autoFocus
                            placeholder="Nome..."
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : techResponsavel ? (
                        <div
                            className="avatar-badge"
                            style={{ backgroundColor: getAvatarColor(techResponsavel) }}
                            title={techResponsavel}
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditResponsavelValue(techResponsavel);
                                setEditingResponsavel(true);
                            }}
                        >
                            {getInitials(techResponsavel)}
                        </div>
                    ) : (
                        <button
                            className="avatar-add-btn opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Adicionar responsável"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditResponsavelValue("");
                                setEditingResponsavel(true);
                            }}
                        >
                            <UserPlus size={12} />
                        </button>
                    )}
                </div>

                {/* Ações (hover) */}
                <div className="card-actions absolute top-2 right-2 flex gap-1 bg-black/50 backdrop-blur-sm rounded-md p-1">
                    <button
                        onClick={() => {
                            setEditName(tech.name);
                            setEditPriority(tech.priority);
                            setEditStatus(tech.status || "Pendente");
                            setEditResponsavel(tech.responsavel || "");
                            setEditing(true);
                        }}
                        className="action-btn hover:text-emerald-400"
                        title="Editar"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="action-btn hover:text-red-400"
                        title="Remover"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Resize handle */}
                <div
                    className="resize-handle"
                    onMouseDown={handleResizeStart}
                    title="Redimensionar"
                />
            </div>
        </>
    );
}

/**
 * 🎓 MENTORIA — PropTypes como Documentação
 *
 * Além de validar, PropTypes servem como DOCUMENTAÇÃO para outros devs.
 * Ao ler isso, qualquer dev sabe exatamente quais props o componente espera,
 * seus tipos, e se são obrigatórias.
 *
 * oneOfType: aceita string OU number (ids do Supabase podem variar).
 * shape: define a "forma" exata do objeto esperado.
 */
TechCard.propTypes = {
    tech: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        priority: PropTypes.number.isRequired,
        status: PropTypes.string,
        responsavel: PropTypes.string,
    }).isRequired,
    position: PropTypes.shape({
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
    }).isRequired,
    size: PropTypes.shape({
        w: PropTypes.number.isRequired,
        h: PropTypes.number.isRequired,
    }),
    onUpdate: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onResize: PropTypes.func.isRequired,
};

export default TechCard;
