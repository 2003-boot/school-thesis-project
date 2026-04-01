import React, { useEffect, useRef, useState, useCallback, forwardRef } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

// ── Couleurs par niveau ────────────────────────────────────────────────────
const LEVEL_COLORS = [
  { bg: '#3B82F6', text: '#ffffff', border: '#2563EB' }, // root  — bleu
  { bg: '#8B5CF6', text: '#ffffff', border: '#7C3AED' }, // L1    — violet
  { bg: '#10B981', text: '#ffffff', border: '#059669' }, // L2a   — vert
  { bg: '#F59E0B', text: '#ffffff', border: '#D97706' }, // L2b   — ambre
  { bg: '#EF4444', text: '#ffffff', border: '#DC2626' }, // L2c   — rouge
  { bg: '#06B6D4', text: '#ffffff', border: '#0891B2' }, // L2d   — cyan
  { bg: '#EC4899', text: '#ffffff', border: '#DB2777' }, // L2e   — rose
];

const getBranchColor = (nodeId, level, branchIndex) => {
  if (level === 0) return LEVEL_COLORS[0];
  if (level === 1) return LEVEL_COLORS[1 + (branchIndex % (LEVEL_COLORS.length - 1))];
  // Les enfants héritent la couleur de leur branche parente
  const parentBranchIndex = parseInt(nodeId.split('-')[0].replace('n', '')) - 1;
  return LEVEL_COLORS[1 + (parentBranchIndex % (LEVEL_COLORS.length - 1))];
};

// ── Layout radial ──────────────────────────────────────────────────────────
const computeLayout = (nodes, edges) => {
  const ROOT_X = 500, ROOT_Y = 400;
  const positions = {};
  const childMap = {};

  edges.forEach(e => {
    if (!childMap[e.source]) childMap[e.source] = [];
    childMap[e.source].push(e.target);
  });

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  // Calcul des angles pour les branches L1
  const l1Nodes = childMap['root'] || [];
  const l1Count = l1Nodes.length;
  const startAngle = -Math.PI / 2; // démarre en haut

  positions['root'] = { x: ROOT_X, y: ROOT_Y, color: LEVEL_COLORS[0], branchIndex: -1 };

  l1Nodes.forEach((id, i) => {
    const angle = startAngle + (2 * Math.PI / l1Count) * i;
    const radius = 200;
    const x = ROOT_X + Math.cos(angle) * radius;
    const y = ROOT_Y + Math.sin(angle) * radius;
    positions[id] = { x, y, angle, branchIndex: i, color: LEVEL_COLORS[1 + (i % (LEVEL_COLORS.length - 1))] };

    // Enfants L2 de ce nœud L1
    const l2Nodes = childMap[id] || [];
    l2Nodes.forEach((l2id, j) => {
      const spread = 0.45;
      const l2Angle = angle - (spread * (l2Nodes.length - 1) / 2) + spread * j;
      const l2Radius = 160;
      positions[l2id] = {
        x: x + Math.cos(l2Angle) * l2Radius,
        y: y + Math.sin(l2Angle) * l2Radius,
        branchIndex: i,
        color: LEVEL_COLORS[1 + (i % (LEVEL_COLORS.length - 1))],
      };

      // Enfants L3
      const l3Nodes = childMap[l2id] || [];
      l3Nodes.forEach((l3id, k) => {
        const spread3 = 0.4;
        const l3Angle = l2Angle - (spread3 * (l3Nodes.length - 1) / 2) + spread3 * k;
        positions[l3id] = {
          x: positions[l2id].x + Math.cos(l3Angle) * 120,
          y: positions[l2id].y + Math.sin(l3Angle) * 120,
          branchIndex: i,
          color: LEVEL_COLORS[1 + (i % (LEVEL_COLORS.length - 1))],
        };
      });
    });
  });

  return positions;
};

// ── Composant principal ───────────────────────────────────────────────────
const MindMap = forwardRef(({ data }, ref) => {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [collapsed, setCollapsed] = useState({});
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const { nodes, edges } = data;
  const positions = computeLayout(nodes, edges);

  // ── Noeuds visibles (collapsed) ──────────────────────────────────────
  const isVisible = useCallback((nodeId) => {
    if (nodeId === 'root') return true;
    const edge = edges.find(e => e.target === nodeId);
    if (!edge) return true;
    if (collapsed[edge.source]) return false;
    return isVisible(edge.source);
  }, [collapsed, edges]);

  const visibleNodes = nodes.filter(n => isVisible(n.id));
  const visibleEdges = edges.filter(e => isVisible(e.source) && isVisible(e.target));
  const childMap = {};
  edges.forEach(e => { if (!childMap[e.source]) childMap[e.source] = []; childMap[e.source].push(e.target); });

  const toggleCollapse = (nodeId) => {
    if (nodeId === 'root') return;
    setCollapsed(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  // ── Zoom & Pan ───────────────────────────────────────────────────────
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(3, Math.max(0.3, z * delta)));
  };

  const handleMouseDown = (e) => {
    if (e.target === svgRef.current || e.target.tagName === 'svg') {
      setDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // ── Dimensions nœuds ────────────────────────────────────────────────
  const getNodeSize = (level) => {
    if (level === 0) return { w: 140, h: 48, rx: 24 };
    if (level === 1) return { w: 120, h: 40, rx: 20 };
    return { w: 100, h: 34, rx: 17 };
  };

  const getFontSize = (level) => level === 0 ? 13 : level === 1 ? 12 : 11;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden"
      style={{ height: '520px', cursor: dragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Contrôles zoom */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {[
          { icon: <ZoomIn className="w-4 h-4" />, action: () => setZoom(z => Math.min(3, z * 1.2)) },
          { icon: <ZoomOut className="w-4 h-4" />, action: () => setZoom(z => Math.max(0.3, z * 0.8)) },
          { icon: <RotateCcw className="w-4 h-4" />, action: resetView },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            {btn.icon}
          </button>
        ))}
      </div>

      {/* Légende */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500">
        <span>Molette : zoom · Glisser : déplacer · Clic nœud : plier/déplier</span>
      </div>

      <svg
        ref={ref} 
        width="100%"
        height="100%"
        style={{ display: 'block' }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Liens courbes */}
          {visibleEdges.map((edge, i) => {
            const src = positions[edge.source];
            const tgt = positions[edge.target];
            if (!src || !tgt) return null;
            const color = tgt.color?.border || '#94a3b8';
            const mx = (src.x + tgt.x) / 2;
            const my = (src.y + tgt.y) / 2;
            return (
              <path
                key={i}
                d={`M${src.x},${src.y} Q${mx},${my} ${tgt.x},${tgt.y}`}
                fill="none"
                stroke={color}
                strokeWidth={hovered === edge.source || hovered === edge.target ? 2.5 : 1.5}
                strokeOpacity={0.7}
                strokeLinecap="round"
                style={{ transition: 'stroke-width 0.15s' }}
              />
            );
          })}

          {/* Nœuds */}
          {visibleNodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;
            const { w, h, rx } = getNodeSize(node.level);
            const color = pos.color || LEVEL_COLORS[0];
            const hasChildren = !!childMap[node.id];
            const isCollapsed = collapsed[node.id];
            const isHovered = hovered === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x - w / 2}, ${pos.y - h / 2})`}
                style={{ cursor: hasChildren && node.id !== 'root' ? 'pointer' : 'default' }}
                onClick={() => toggleCollapse(node.id)}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Ombre */}
                <rect
                  x={2} y={3} width={w} height={h} rx={rx}
                  fill="rgba(0,0,0,0.12)"
                />
                {/* Corps */}
                <rect
                  x={0} y={0} width={w} height={h} rx={rx}
                  fill={color.bg}
                  stroke={isHovered ? '#fff' : color.border}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{ transition: 'all 0.15s', filter: isHovered ? 'brightness(1.1)' : 'none' }}
                />
                {/* Label */}
                <text
                  x={w / 2}
                  y={h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color.text}
                  fontSize={getFontSize(node.level)}
                  fontWeight={node.level === 0 ? 700 : node.level === 1 ? 600 : 500}
                  fontFamily="sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {node.label.length > 18 ? node.label.slice(0, 16) + '…' : node.label}
                </text>
                {/* Indicateur collapsed */}
                {hasChildren && node.id !== 'root' && (
                  <circle
                    cx={w - 8} cy={8} r={5}
                    fill={isCollapsed ? '#fff' : 'rgba(255,255,255,0.3)'}
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth={1}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
});

export default MindMap;