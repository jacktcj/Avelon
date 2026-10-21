// Original SVG character illustrations. All artwork is hand-built for this app.
import { useId } from 'react';
import type { Role } from '../game/rules';
import { ROLE_INFO } from '../game/rules';
import { useI18n } from '../i18n';

const PALETTE = {
  good: { sky1: '#1b4f86', sky2: '#081a36', glow: '#8fd3ff', rim: '#d9b65c' },
  evil: { sky1: '#6e121b', sky2: '#1a0508', glow: '#ff7a6a', rim: '#d9b65c' },
};

interface Props {
  role: Role;
  className?: string;
}

/** A framed portrait card for a character. */
export function RoleArt({ role, className }: Props) {
  const uid = useId().replace(/:/g, '');
  const { roleName } = useI18n();
  const team = ROLE_INFO[role].team;
  const p = PALETTE[team];
  const id = (s: string) => `${s}-${uid}`;
  return (
    <svg viewBox="0 0 200 260" className={className} role="img" aria-label={roleName(role)}>
      <defs>
        <radialGradient id={id('sky')} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor={p.sky1} />
          <stop offset="100%" stopColor={p.sky2} />
        </radialGradient>
        <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6e7b8" />
          <stop offset="50%" stopColor="#d9b65c" />
          <stop offset="100%" stopColor="#8a6a22" />
        </linearGradient>
        <linearGradient id={id('cloth')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={team === 'good' ? '#2a5ea8' : '#5a1520'} />
          <stop offset="100%" stopColor={team === 'good' ? '#0c2147' : '#1c0509'} />
        </linearGradient>
        <linearGradient id={id('steel')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e6ecf5" />
          <stop offset="55%" stopColor="#8a97ab" />
          <stop offset="100%" stopColor="#3b4456" />
        </linearGradient>
        <linearGradient id={id('dark')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2233" />
          <stop offset="100%" stopColor="#09060c" />
        </linearGradient>
        <clipPath id={id('arch')}>
          <path d="M14 250 V92 A86 86 0 0 1 186 92 V250 Z" />
        </clipPath>
      </defs>

      {/* Frame */}
      <rect x="2" y="2" width="196" height="256" rx="14" fill="#0a0f1f" stroke={`url(#${id('gold')})`} strokeWidth="3" />
      <g clipPath={`url(#${id('arch')})`}>
        <rect x="0" y="0" width="200" height="260" fill={`url(#${id('sky')})`} />
        <Stars color={p.glow} />
        <circle cx="100" cy="110" r="90" fill={`url(#${id('halo')})`} />
        <Figure role={role} id={id} />
      </g>
      <path
        d="M14 250 V92 A86 86 0 0 1 186 92 V250"
        fill="none"
        stroke={`url(#${id('gold')})`}
        strokeWidth="2.5"
      />
      <Corner x={8} y={8} id={id} />
      <Corner x={192} y={8} flip id={id} />
    </svg>
  );
}

function Corner({ x, y, flip, id }: { x: number; y: number; flip?: boolean; id: (s: string) => string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}
      d="M0 0 L16 0 Q6 4 4 16 L0 16 Z"
      fill={`url(#${id('gold')})`}
      opacity="0.9"
    />
  );
}

function Stars({ color }: { color: string }) {
  const pts = [
    [30, 40], [60, 24], [150, 30], [172, 58], [40, 78], [168, 96], [24, 120], [182, 140], [120, 18], [84, 44],
  ];
  return (
    <g fill={color}>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9} opacity={0.5 + (i % 4) * 0.12} />
      ))}
    </g>
  );
}

/** Shoulders/robe shared by most characters. */
function Robe({ fill, trim }: { fill: string; trim?: string }) {
  return (
    <g>
      <path d="M28 262 C34 200 62 178 100 176 C138 178 166 200 172 262 Z" fill={fill} />
      {trim && <path d="M100 178 L100 262" stroke={trim} strokeWidth="3" opacity="0.8" />}
    </g>
  );
}

function Face({ skin = '#e8c9a6', shade = '#c49a74' }: { skin?: string; shade?: string }) {
  return (
    <g>
      <rect x="90" y="150" width="20" height="30" fill={shade} />
      <ellipse cx="100" cy="135" rx="25" ry="30" fill={skin} />
      <path d="M78 142 Q100 168 122 142 Q120 165 100 168 Q80 165 78 142Z" fill={shade} opacity="0.35" />
    </g>
  );
}

function Figure({ role, id }: { role: Role; id: (s: string) => string }) {
  const gold = `url(#${id('gold')})`;
  const cloth = `url(#${id('cloth')})`;
  const steel = `url(#${id('steel')})`;
  const dark = `url(#${id('dark')})`;

  switch (role) {
    case 'merlin':
      return (
        <g>
          {/* staff */}
          <rect x="150" y="70" width="5" height="190" rx="2" fill="#6b4a2b" />
          <circle cx="152.5" cy="66" r="12" fill="#bfe9ff" opacity="0.9" />
          <circle cx="152.5" cy="66" r="20" fill="#8fd3ff" opacity="0.25" className="animate-glow" />
          <Robe fill={cloth} trim={gold} />
          <Face />
          {/* beard */}
          <path d="M76 140 Q78 205 100 222 Q122 205 124 140 Q112 160 100 158 Q88 160 76 140Z" fill="#eef1f6" />
          <path d="M88 150 Q100 158 112 150" stroke="#c9ced8" strokeWidth="2" fill="none" />
          {/* eyes */}
          <path d="M88 130 h8 M104 130 h8" stroke="#3a2a1c" strokeWidth="2.5" strokeLinecap="round" />
          {/* hat */}
          <path d="M62 116 Q100 100 138 116 L104 22 Q100 16 96 24 Z" fill={cloth} />
          <ellipse cx="100" cy="116" rx="44" ry="9" fill="#0c2147" />
          <path d="M66 114 Q100 104 134 114" stroke={gold} strokeWidth="3" fill="none" />
          <Star x={96} y={60} s={7} fill={gold} />
          <Star x={110} y={86} s={4.5} fill={gold} />
          <Star x={86} y={92} s={4} fill={gold} />
        </g>
      );
    case 'percival':
      return (
        <g>
          <Robe fill={cloth} trim={gold} />
          {/* pauldrons */}
          <ellipse cx="54" cy="200" rx="26" ry="16" fill={steel} />
          <ellipse cx="146" cy="200" rx="26" ry="16" fill={steel} />
          {/* helm */}
          <path d="M70 140 Q70 88 100 84 Q130 88 130 140 L130 168 Q100 178 70 168Z" fill={steel} />
          <rect x="76" y="124" width="48" height="6" rx="3" fill="#1b2232" />
          <rect x="97" y="130" width="6" height="30" rx="2" fill="#1b2232" opacity="0.85" />
          <path d="M100 86 L100 168" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" />
          {/* plume */}
          <path d="M100 86 Q92 52 122 34 Q114 58 132 60 Q112 70 108 88Z" fill="#4fb3f0" />
          <path d="M104 84 Q102 60 120 44" stroke="#bfe9ff" strokeWidth="1.5" fill="none" />
          {/* shield */}
          <path d="M120 186 h46 v26 Q166 244 143 256 Q120 244 120 212Z" fill={cloth} stroke={gold} strokeWidth="3" />
          <path d="M134 204 h18 Q152 220 143 224 Q134 220 134 204Z M140 224 h6 v10 h6 v4 h-18 v-4 h6Z" fill={gold} />
        </g>
      );
    case 'servant':
      return (
        <g>
          {/* spear & banner */}
          <rect x="44" y="40" width="4" height="220" fill="#6b4a2b" />
          <path d="M46 26 L52 42 L40 42Z" fill={steel} />
          <path d="M48 48 h40 v44 l-20 -10 l-20 10Z" fill="#2a8fd6" stroke={gold} strokeWidth="2" />
          <path d="M68 56 v22 M58 66 h20" stroke={gold} strokeWidth="3" />
          <Robe fill={cloth} />
          {/* tabard */}
          <path d="M74 182 h52 v80 h-52Z" fill="#e9e1cc" />
          <path d="M100 196 v40 M86 212 h28" stroke="#2a8fd6" strokeWidth="6" />
          <Face />
          <path d="M88 132 h7 M105 132 h7" stroke="#3a2a1c" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M94 150 Q100 154 106 150" stroke="#8a5a3c" strokeWidth="2" fill="none" />
          {/* coif */}
          <path d="M72 140 Q70 96 100 98 Q130 96 128 140 Q128 112 100 110 Q72 112 72 140Z" fill={steel} />
        </g>
      );
    case 'assassin':
      return (
        <g>
          {/* crossed daggers */}
          <g transform="rotate(-35 100 150)">
            <path d="M97 40 L103 40 L104 120 L96 120Z" fill={steel} />
            <rect x="88" y="120" width="24" height="5" fill={gold} />
            <rect x="97" y="125" width="6" height="20" fill="#3a2414" />
          </g>
          <g transform="rotate(35 100 150)">
            <path d="M97 40 L103 40 L104 120 L96 120Z" fill={steel} />
            <rect x="88" y="120" width="24" height="5" fill={gold} />
            <rect x="97" y="125" width="6" height="20" fill="#3a2414" />
          </g>
          <Robe fill={dark} />
          {/* hood */}
          <path d="M60 190 Q56 96 100 82 Q144 96 140 190 Q120 170 100 170 Q80 170 60 190Z" fill={dark} />
          <ellipse cx="100" cy="138" rx="24" ry="28" fill="#06040a" />
          {/* mask & eyes */}
          <path d="M78 140 Q100 132 122 140 L122 160 Q100 172 78 160Z" fill="#3a0b12" />
          <path d="M86 128 l10 3 M114 128 l-10 3" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case 'morgana':
      return (
        <g>
          {/* hair */}
          <path d="M64 230 Q52 150 72 110 Q100 80 128 110 Q148 150 136 230Z" fill="#1a0b22" />
          <Robe fill="#3c1048" trim={gold} />
          <Face skin="#e6cfd8" shade="#b897a6" />
          <path d="M86 130 q6 -4 12 0 M102 130 q6 -4 12 0" stroke="#4a1a5a" strokeWidth="2.5" fill="none" />
          <path d="M94 152 Q100 156 106 152" stroke="#8a1a3a" strokeWidth="2.5" fill="none" />
          {/* fringe */}
          <path d="M74 126 Q80 98 100 100 Q120 98 126 126 Q114 110 100 112 Q86 110 74 126Z" fill="#1a0b22" />
          {/* crescent diadem */}
          <path d="M80 104 Q100 92 120 104" stroke={gold} strokeWidth="3" fill="none" />
          <path d="M100 74 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24Z" fill={gold} />
          {/* orb */}
          <circle cx="100" cy="226" r="16" fill="#b46aff" opacity="0.85" />
          <circle cx="100" cy="226" r="26" fill="#b46aff" opacity="0.2" className="animate-glow" />
        </g>
      );
    case 'mordred':
      return (
        <g>
          <Robe fill={dark} trim="#a51d29" />
          <ellipse cx="54" cy="200" rx="26" ry="16" fill="#2d2f3a" />
          <ellipse cx="146" cy="200" rx="26" ry="16" fill="#2d2f3a" />
          {/* dark helm */}
          <path d="M70 140 Q70 92 100 88 Q130 92 130 140 L126 170 Q100 182 74 170Z" fill="#2d2f3a" />
          <path d="M80 130 L96 136 M120 130 L104 136" stroke="#ff4d4d" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M100 140 v26" stroke="#111" strokeWidth="3" />
          {/* spiked crown */}
          <path d="M68 100 L74 66 L84 92 L92 56 L100 88 L108 56 L116 92 L126 66 L132 100 Q100 90 68 100Z" fill={gold} />
          <circle cx="100" cy="94" r="4" fill="#d42f3a" />
        </g>
      );
    case 'oberon':
      return (
        <g>
          {/* mist */}
          <ellipse cx="100" cy="250" rx="110" ry="30" fill="#a0a8b8" opacity="0.15" />
          <Robe fill="#1f2a1c" />
          {/* antlers */}
          <path d="M80 100 Q60 70 56 40 M62 64 Q48 60 40 48 M70 82 Q54 84 46 76" stroke="#7a5a3a" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M120 100 Q140 70 144 40 M138 64 Q152 60 160 48 M130 82 Q146 84 154 76" stroke="#7a5a3a" strokeWidth="5" fill="none" strokeLinecap="round" />
          {/* hood */}
          <path d="M62 196 Q58 98 100 88 Q142 98 138 196 Q120 172 100 172 Q80 172 62 196Z" fill="#26321f" />
          <ellipse cx="100" cy="140" rx="24" ry="28" fill="#070a06" />
          <path d="M90 136 h6 M104 136 h6" stroke="#b6ff7a" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
          {/* thorny vines */}
          <path d="M70 210 q10 -8 20 0 t20 0 t20 0" stroke="#4a6a2a" strokeWidth="3" fill="none" />
        </g>
      );
    case 'minion':
      return (
        <g>
          <Robe fill={dark} />
          <path d="M58 200 Q56 92 100 80 Q144 92 142 200 Q120 174 100 174 Q80 174 58 200Z" fill="#3a0b12" />
          <path d="M66 190 Q64 104 100 92 Q136 104 134 190" fill="none" stroke="#6e121b" strokeWidth="3" />
          <ellipse cx="100" cy="140" rx="25" ry="30" fill="#06040a" />
          <circle cx="90" cy="136" r="3.5" fill="#ff4d4d" />
          <circle cx="110" cy="136" r="3.5" fill="#ff4d4d" />
          <circle cx="90" cy="136" r="8" fill="#ff4d4d" opacity="0.25" className="animate-glow" />
          <circle cx="110" cy="136" r="8" fill="#ff4d4d" opacity="0.25" className="animate-glow" />
          {/* sickle-shaped clasp */}
          <path d="M92 196 a10 10 0 1 0 16 0" stroke={gold} strokeWidth="3" fill="none" />
        </g>
      );
  }
}

function Star({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  const d = `M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3}Z`;
  return <path d={d} fill={fill} />;
}

/** Team crest: a winged sword for Good, a horned skull-sigil for Evil. */
export function TeamCrest({ team, className }: { team: 'good' | 'evil'; className?: string }) {
  if (team === 'good')
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden>
        <circle cx="32" cy="32" r="30" fill="#0c2147" stroke="#4fb3f0" strokeWidth="2.5" />
        <path d="M32 8 L35 14 L35 42 L29 42 L29 14Z" fill="#e6ecf5" />
        <rect x="22" y="42" width="20" height="4" rx="1" fill="#d9b65c" />
        <rect x="30" y="46" width="4" height="10" fill="#d9b65c" />
        <path d="M28 30 Q16 26 10 16 Q18 30 28 36Z M36 30 Q48 26 54 16 Q46 30 36 36Z" fill="#8fd3ff" />
      </svg>
    );
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="30" fill="#2a070c" stroke="#f05a5a" strokeWidth="2.5" />
      <path d="M16 14 Q22 26 24 30 M48 14 Q42 26 40 30" stroke="#d9b65c" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M20 34 Q32 16 44 34 Q44 46 32 52 Q20 46 20 34Z" fill="#a51d29" />
      <path d="M25 36 l6 3 M39 36 l-6 3" stroke="#ffb0a0" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Face-down card back with a sword-in-stone emblem. */
export function CardBack({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 200 260" className={className} aria-hidden>
      <defs>
        <linearGradient id={`cbg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#18306b" />
          <stop offset="100%" stopColor="#050a1c" />
        </linearGradient>
        <linearGradient id={`cgd-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f6e7b8" />
          <stop offset="100%" stopColor="#9a7628" />
        </linearGradient>
        <pattern id={`cpt-${uid}`} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 10 H20" stroke="#d9b65c" strokeOpacity="0.08" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="2" y="2" width="196" height="256" rx="14" fill={`url(#cbg-${uid})`} stroke={`url(#cgd-${uid})`} strokeWidth="3" />
      <rect x="2" y="2" width="196" height="256" rx="14" fill={`url(#cpt-${uid})`} />
      <rect x="14" y="14" width="172" height="232" rx="8" fill="none" stroke={`url(#cgd-${uid})`} strokeOpacity="0.6" />
      <circle cx="100" cy="130" r="58" fill="none" stroke={`url(#cgd-${uid})`} strokeWidth="2" />
      <path d="M96 64 L100 56 L104 64 L104 140 L96 140Z" fill="#e6ecf5" />
      <rect x="82" y="138" width="36" height="6" rx="2" fill={`url(#cgd-${uid})`} />
      <rect x="97" y="144" width="6" height="8" fill="#6b4a2b" />
      <path d="M66 176 Q70 150 100 150 Q130 150 134 176Z" fill="#5d6577" />
      <path d="M72 176 h56" stroke="#2a2f3c" strokeWidth="2" />
    </svg>
  );
}

/** Home screen hero: a castle under a crescent moon. */
export function CastleHero({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 180" className={className} aria-hidden>
      <defs>
        <linearGradient id="castle-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2b5c" />
          <stop offset="100%" stopColor="#060b1e" />
        </linearGradient>
        <radialGradient id="moon-g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f6e7b8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#f6e7b8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="236" cy="46" r="44" fill="url(#moon-g)" />
      <path d="M236 22 a24 24 0 1 0 18 40 a19 19 0 1 1 -18 -40Z" fill="#f6e7b8" />
      <g fill="url(#castle-g)" stroke="#d9b65c" strokeOpacity="0.35">
        <path d="M40 180 V96 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 V180Z" />
        <path d="M248 180 V96 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 V180Z" />
        <path d="M80 180 V118 h160 V180Z" />
        <path d="M118 180 V64 h10 v-10 h10 v10 h10 v-10 h10 v10 h10 v-10 h10 v10 h4 V180Z" />
        <path d="M136 54 L160 10 L184 54Z" />
        <path d="M44 88 L60 58 L76 88Z" />
        <path d="M252 88 L268 58 L284 88Z" />
      </g>
      <path d="M160 10 v-8 l12 4 l-12 4" fill="#d42f3a" />
      <g fill="#ecd48a">
        <rect x="154" y="88" width="12" height="18" rx="6" />
        <rect x="56" y="120" width="6" height="10" rx="3" />
        <rect x="262" y="120" width="6" height="10" rx="3" />
        <rect x="104" y="136" width="6" height="10" rx="3" />
        <rect x="210" y="136" width="6" height="10" rx="3" />
      </g>
      <path d="M148 180 v-24 a12 12 0 0 1 24 0 v24Z" fill="#05081a" />
      <path d="M0 180 Q80 166 160 172 T320 168 V180Z" fill="#050a1c" />
    </svg>
  );
}
