/**
 * EmptyState — Exibido quando a lista de tecnologias está vazia.
 *
 * Por que um componente separado?
 * → Mantém o código organizado e o componente reutilizável.
 * → Facilita trocar o visual sem mexer na lógica da lista.
 */
import { Rocket } from "lucide-react";

function EmptyState() {
    return (
        <div className="w-full max-w-lg mt-6">
            <div className="glass-card p-8 rounded-2xl text-center">
                {/* Ícone decorativo com animação */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
                    <Rocket size={28} className="text-emerald-400 animate-bounce" />
                </div>

                <h3 className="text-white font-semibold text-lg mb-2">
                    Nenhuma tarefa ainda
                </h3>
                <p className="text-white/50 text-sm leading-relaxed">
                    Comece adicionando suas tarefas e projetos.
                    <br />
                    Defina prioridades e acompanhe o progresso!
                </p>
            </div>
        </div>
    );
}

export default EmptyState;
