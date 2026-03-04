/**
 * BrandLogo — O novo logo personalizado do Tech Wishlist.
 *
 * É um SVG inline que desenha um "bloco de notas estilo lousa de vidro"
 * com o texto "Tech Wishlist" usando a fonte handwritten 'Caveat'.
 *
 * Vantagens do SVG:
 * - Escalável (vetor)
 * - Customizável via CSS (cores, tamanhos)
 * - Leve (sem requests de imagem extra)
 */
function BrandLogo({ className = "" }) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <svg
                width="280"
                height="100" // Aumentei a altura para garantir que o texto "g" não corte
                viewBox="0 0 280 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]"
            >
                {/*
          Shape: Lousa de Vidro (Glass Notepad)
          - Fundo semi-transparente
          - Borda sutil
          - Brilho (inner shadow simulado)
        */}
                <rect
                    x="10"
                    y="10"
                    width="260"
                    height="60"
                    rx="12"
                    fill="url(#glass-gradient)"
                    stroke="url(#border-gradient)"
                    strokeWidth="1.5"
                />

                {/* Reflexo sutil no topo (vidro) */}
                <path
                    d="M20 18H100C130 18 130 40 160 40H260"
                    stroke="white"
                    strokeOpacity="0.1"
                    strokeWidth="20"
                    filter="url(#blur)"
                    mask="url(#mask)"
                />

                {/* Texto Manuscrito (Marker Pen) */}
                <text
                    x="140"
                    y="52"
                    textAnchor="middle"
                    fontFamily="'Caveat', cursive"
                    fontSize="42"
                    fontWeight="700"
                    fill="url(#text-gradient)"
                    className="select-none"
                    style={{
                        textShadow: "0 0 10px rgba(192, 132, 252, 0.5)",
                    }}
                >
                    Task Board
                </text>

                {/* Definições de Gradientes e Filtros */}
                <defs>
                    <linearGradient
                        id="glass-gradient"
                        x1="0"
                        y1="0"
                        x2="280"
                        y2="80"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="white" stopOpacity="0.03" />
                        <stop offset="1" stopColor="white" stopOpacity="0.08" />
                    </linearGradient>

                    <linearGradient
                        id="border-gradient"
                        x1="10"
                        y1="10"
                        x2="270"
                        y2="70"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="white" stopOpacity="0.4" />
                        <stop offset="0.5" stopColor="white" stopOpacity="0.1" />
                        <stop offset="1" stopColor="white" stopOpacity="0.4" />
                    </linearGradient>

                    <linearGradient
                        id="text-gradient"
                        x1="50"
                        y1="40"
                        x2="230"
                        y2="40"
                        gradientUnits="userSpaceOnUse"
                    >
                        <stop stopColor="#c084fc" /> {/* Roxo neon */}
                        <stop offset="0.5" stopColor="#818cf8" /> {/* Azul índigo */}
                        <stop offset="1" stopColor="#22d3ee" /> {/* Ciano */}
                    </linearGradient>

                    <filter id="blur" x="0" y="0" width="280" height="80">
                        <feGaussianBlur stdDeviation="6" />
                    </filter>

                    <mask id="mask">
                        <rect x="10" y="10" width="260" height="60" rx="12" fill="white" />
                    </mask>
                </defs>
            </svg>
        </div>
    );
}

export default BrandLogo;
