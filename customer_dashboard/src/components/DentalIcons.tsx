import React from 'react';

// Common Gradient Definitions for SVGs to reuse
export const SvgGradients = () => (
  <svg className="absolute w-0 h-0" width="0" height="0">
    <defs>
      <linearGradient id="silver-metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="30%" stopColor="#E2E8F0" />
        <stop offset="70%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="primary-teal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#006670" />
        <stop offset="100%" stopColor="#00525b" />
      </linearGradient>
      <linearGradient id="orange-accent-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F58734" />
        <stop offset="100%" stopColor="#D96E14" />
      </linearGradient>
      <linearGradient id="glass-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#E2E8F0" stopOpacity="0.3" />
      </linearGradient>
      <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
      <linearGradient id="light-clinical" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
    </defs>
  </svg>
);

// 1. NSK Pana-Max High Speed Handpiece
export const NSKHandpiece: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="200" cy="240" rx="130" ry="12" fill="#E2E8F0" filter="blur(8px)" />
    
    {/* Connection base */}
    <rect x="310" y="160" width="30" height="24" rx="3" fill="url(#silver-metal)" />
    <rect x="312" y="162" width="26" height="4" fill="#10B981" /> {/* Green Band */}
    <rect x="325" y="166" width="15" height="12" fill="#475569" />
    
    {/* Main Handpiece Body */}
    <path d="M120 120 L310 162 L310 182 L124 140 Z" fill="url(#silver-metal)" />
    {/* Curved Neck */}
    <path d="M70 100 C85 95, 110 105, 120 120 L124 140 C110 128, 90 120, 75 120 Z" fill="url(#silver-metal)" />
    
    {/* Handpiece Head */}
    <path d="M50 90 C50 82, 68 76, 73 90 L62 122 C58 128, 48 116, 50 90 Z" fill="url(#silver-metal)" />
    <rect x="53" y="76" width="12" height="6" rx="1" fill="#64748B" />
    
    {/* Burr / Drill Tip */}
    <rect x="58" y="122" width="2" height="15" fill="#475569" />
    <path d="M57 137 L59 140 L61 137 Z" fill="#94A3B8" />

    {/* Body Grip Texture Lines */}
    <line x1="180" y1="145" x2="184" y2="162" stroke="#64748B" strokeWidth="1.5" />
    <line x1="190" y1="147" x2="194" y2="164" stroke="#64748B" strokeWidth="1.5" />
    <line x1="200" y1="149" x2="204" y2="166" stroke="#64748B" strokeWidth="1.5" />
    <line x1="210" y1="151" x2="214" y2="168" stroke="#64748B" strokeWidth="1.5" />
    <line x1="220" y1="153" x2="224" y2="170" stroke="#64748B" strokeWidth="1.5" />
    
    {/* Logo/Branding on handpiece */}
    <text x="240" y="168" fill="#006670" fontSize="8" fontWeight="bold" fontFamily="sans-serif" transform="rotate(12 240 168)">FAAZO</text>
  </svg>
);

// 2. Woodpecker LED Curing Light
export const WoodpeckerCuringLight: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="200" cy="260" rx="70" ry="8" fill="#E2E8F0" filter="blur(6px)" />
    
    {/* Charger Base */}
    <path d="M150 250 C150 220, 250 220, 250 250 L245 260 L155 260 Z" fill="url(#light-clinical)" stroke="#CBD5E1" strokeWidth="1.5" />
    <ellipse cx="200" cy="235" rx="25" ry="10" fill="#E2E8F0" />
    <rect x="195" y="243" width="10" height="6" fill="#10B981" rx="1" /> {/* Status indicator light */}

    {/* Curing Light Body */}
    <path d="M188 235 L192 70 C192 60, 208 60, 208 70 L212 235 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
    
    {/* Black Display Panel */}
    <rect x="194" y="100" width="12" height="45" rx="3" fill="#1E293B" />
    <circle cx="200" cy="110" r="2" fill="#38BDF8" /> {/* Screen element */}
    <rect x="197" y="125" width="6" height="4" fill="#F58734" rx="0.5" /> {/* Button */}
    <circle cx="200" cy="138" r="1.5" fill="#E2E8F0" />

    {/* Light Tip */}
    <path d="M198 70 L198 35 C198 30, 202 30, 202 35 L202 70 Z" fill="#334155" />
    
    {/* Curing Tip Cap */}
    <path d="M196 35 L204 35 L200 31 Z" fill="#F58734" />
    
    {/* Transparent Orange Protective Shield */}
    <ellipse cx="200" cy="72" rx="45" ry="18" fill="#F58734" fillOpacity="0.7" stroke="#EA580C" strokeWidth="1.5" />
    <circle cx="200" cy="72" r="8" fill="#1E293B" />
  </svg>
);

// 3. Endo Radar Apex Locator
export const EndoRadarApexLocator: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="200" cy="240" rx="120" ry="10" fill="#E2E8F0" filter="blur(7px)" />

    {/* Console Body */}
    <path d="M100 220 L130 140 C135 125, 265 125, 270 140 L300 220 C302 226, 296 232, 290 232 L110 232 C104 232, 98 226, 100 220 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
    
    {/* Screen Frame */}
    <path d="M136 148 H264 C268 148, 272 152, 270 158 L252 212 C250 216, 246 220, 240 220 H160 C154 220, 150 216, 148 212 L130 158 C128 152, 132 148, 136 148 Z" fill="#0F172A" />

    {/* Apex Locator Graphical Screen Contents */}
    <text x="145" y="172" fill="#10B981" fontSize="18" fontWeight="bold" fontFamily="monospace">P3</text>
    {/* Level Indicator Bars */}
    <rect x="180" y="165" width="8" height="6" fill="#10B981" rx="1" />
    <rect x="192" y="163" width="8" height="8" fill="#10B981" rx="1" />
    <rect x="204" y="160" width="8" height="11" fill="#10B981" rx="1" />
    <rect x="216" y="157" width="8" height="14" fill="#64748B" rx="1" />
    <rect x="228" y="154" width="8" height="17" fill="#64748B" rx="1" />
    <rect x="240" y="151" width="8" height="20" fill="#64748B" rx="1" />
    
    <circle cx="185" cy="205" r="3" fill="#10B981" />
    <circle cx="197" cy="205" r="3" fill="#10B981" />
    <circle cx="209" cy="205" r="3" fill="#10B981" />
    <circle cx="221" cy="205" r="3" fill="#E2E8F0" />
    <circle cx="233" cy="205" r="3" fill="#E2E8F0" />

    {/* Cable Connection */}
    <path d="M280 200 C300 200, 320 220, 340 180" stroke="#94A3B8" strokeWidth="3" fill="none" />
    
    {/* Mini Handpiece attached */}
    <rect x="330" y="160" width="10" height="40" rx="2" fill="url(#silver-metal)" transform="rotate(-30 330 160)" />
    <rect x="332" y="152" width="4" height="12" fill="#475569" transform="rotate(-30 330 160)" />
  </svg>
);

// 4. 3M Filtek Universal Restorative
export const RestorativePack: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="200" cy="245" rx="120" ry="12" fill="#E2E8F0" filter="blur(8px)" />

    {/* 3M Box */}
    <path d="M110 230 L110 130 L230 110 L230 210 Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
    <path d="M230 110 L280 130 L280 230 L230 210 Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
    <path d="M110 130 L160 150 L280 130 L230 110 Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />

    {/* 3M Red Logo */}
    <text x="130" y="160" fill="#DA291C" fontSize="24" fontWeight="900" fontFamily="sans-serif">3M</text>
    <text x="130" y="175" fill="#334155" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Filtek™</text>
    <text x="130" y="185" fill="#64748B" fontSize="6" fontFamily="sans-serif">Universal Restorative</text>
    <rect x="130" y="192" width="45" height="8" fill="#10B981" rx="1" />
    <text x="134" y="198" fill="#FFFFFF" fontSize="6" fontWeight="bold" fontFamily="sans-serif">A2 Shade</text>

    {/* Restorative Syringe in front */}
    {/* Syringe Body */}
    <rect x="160" y="215" width="90" height="12" rx="2" fill="url(#glass-grad)" stroke="#94A3B8" strokeWidth="1" />
    <rect x="150" y="219" width="10" height="4" fill="#475569" />
    <path d="M142 221 L150 218 L150 224 Z" fill="#000000" /> {/* Tip cap */}
    
    {/* Syringe Plunger */}
    <rect x="250" y="219" width="40" height="4" fill="#475569" />
    <rect x="290" y="213" width="4" height="16" rx="1" fill="#475569" />
    
    {/* Syringe Label */}
    <rect x="180" y="216" width="40" height="10" fill="#10B981" />
    <text x="185" y="223" fill="#FFFFFF" fontSize="6" fontWeight="bold" fontFamily="sans-serif">Filtek A2</text>
  </svg>
);

// 5. Woodpecker Ultrasonic Scaler
export const UltrasonicScaler: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="200" cy="245" rx="110" ry="10" fill="#E2E8F0" filter="blur(7px)" />

    {/* Main Scaler Body */}
    <rect x="110" y="140" width="180" height="90" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
    {/* Light Mint Top accent */}
    <path d="M110 152 C110 146, 120 140, 130 140 H270 C280 140, 290 146, 290 152 V165 H110 Z" fill="url(#light-clinical)" />

    {/* Control Dial */}
    <circle cx="150" cy="195" r="18" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
    <line x1="150" y1="195" x2="160" y2="185" stroke="#006670" strokeWidth="3" strokeLinecap="round" />

    {/* Scale Power Indicators */}
    <path d="M190 205 Q200 185, 230 185" stroke="#E2E8F0" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M190 205 Q200 185, 215 190" stroke="#006670" strokeWidth="4" fill="none" strokeLinecap="round" />

    <text x="250" y="200" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">POWER</text>

    {/* Scaler Handpiece resting on bracket */}
    <rect x="270" y="170" width="40" height="14" rx="3" fill="#E2E8F0" />
    <rect x="260" y="160" width="65" height="10" rx="2" fill="url(#silver-metal)" stroke="#94A3B8" transform="rotate(-15 260 160)" />
    
    {/* Cable */}
    <path d="M290 220 C320 220, 330 260, 260 250" stroke="#CBD5E1" strokeWidth="4" fill="none" />
  </svg>
);

// 6. OPG Machine (Imaging Systems)
export const OPGMachine: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="200" cy="285" rx="90" ry="8" fill="#E2E8F0" filter="blur(6px)" />

    {/* Structural Column */}
    <rect x="185" y="60" width="30" height="220" fill="url(#silver-metal)" />
    <rect x="193" y="60" width="14" height="220" fill="#FFFFFF" fillOpacity="0.3" />
    
    {/* Base plate */}
    <path d="M150 270 H250 L260 285 H140 Z" fill="#475569" />

    {/* Overhead Arm */}
    <rect x="120" y="65" width="160" height="20" rx="5" fill="url(#light-clinical)" stroke="#CBD5E1" />
    
    {/* Panoramic Sensor & Tube Head Assemblies */}
    {/* Left Sensor block */}
    <rect x="100" y="85" width="24" height="80" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
    <rect x="104" y="95" width="16" height="50" fill="#1E293B" />
    
    {/* Right X-Ray Tube head block */}
    <rect x="276" y="85" width="30" height="70" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
    <rect x="281" y="105" width="20" height="15" fill="#006670" />

    {/* Patient Chin Support / Temple Aligners */}
    <path d="M170 145 H230 V165 H170 Z" fill="#E2E8F0" rx="2" />
    <path d="M190 145 V180 H210 V145" fill="none" stroke="#64748B" strokeWidth="2" />
    <circle cx="200" cy="180" r="5" fill="#475569" />

    {/* Control Pad Screen hanging off columns */}
    <rect x="215" y="170" width="35" height="25" rx="2" fill="#1E293B" stroke="#94A3B8" />
    <rect x="220" y="174" width="25" height="12" fill="#38BDF8" fillOpacity="0.8" />
  </svg>
);

// 7. Premium Dental Chair (Chairs & Units)
export const DentalChair: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Floor base shadow */}
    <ellipse cx="200" cy="275" rx="130" ry="12" fill="#E2E8F0" filter="blur(8px)" />

    {/* Heavy Cast Iron Floor Base */}
    <path d="M140 260 H270 L280 273 H130 Z" fill="#475569" />
    
    {/* Hydraulic Lift Cylinders */}
    <rect x="190" y="200" width="30" height="60" fill="url(#silver-metal)" />
    <rect x="195" y="180" width="20" height="30" fill="#64748B" />

    {/* Main Seat structure & Cushions */}
    {/* Underframe */}
    <path d="M130 190 L260 175 L280 185 L140 205 Z" fill="#334155" />
    
    {/* Legrest / Footrest (Teal Upholstery) */}
    <path d="M240 177 L330 170 C340 169, 345 178, 340 183 L260 200 Z" fill="#006670" />
    <path d="M300 171 H330 L320 180 H300 Z" fill="#004e56" /> {/* Foot protector pad */}

    {/* Seat Cushion */}
    <path d="M170 185 C170 175, 250 170, 255 185 L250 200 C240 195, 180 195, 170 185 Z" fill="#006670" />

    {/* Backrest Cushion */}
    <path d="M172 185 L110 115 C105 108, 115 100, 122 108 L180 175 Z" fill="#006670" />
    
    {/* Headrest */}
    <rect x="98" y="92" width="24" height="15" rx="4" fill="#004e56" transform="rotate(-15 98 92)" />

    {/* Armrest */}
    <path d="M160 155 H220 C225 155, 225 163, 220 163 H160 C155 163, 155 155, 160 155 Z" fill="#E2E8F0" stroke="#CBD5E1" />

    {/* Overhead Dentist Delivery unit with Tray & Light arm */}
    {/* Support Post */}
    <path d="M190 230 C190 140, 160 110, 230 90" stroke="#94A3B8" strokeWidth="4" fill="none" />
    
    {/* Overhead Operating Light */}
    <rect x="210" y="70" width="30" height="18" rx="4" fill="#F1F5F9" stroke="#94A3B8" />
    <circle cx="225" cy="79" r="6" fill="#FDE047" filter="drop-shadow(0px 0px 3px #F59E0B)" /> {/* Yellow LED bulb */}
  </svg>
);

// 8. Dental Instruments in a glass cup
export const InstrumentsCup: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="200" cy="255" rx="55" ry="8" fill="#E2E8F0" filter="blur(6px)" />

    {/* Glass Cup Base & body */}
    <path d="M165 250 L170 160 H230 L235 250 C235 254, 230 255, 200 255 C170 255, 165 254, 165 250 Z" fill="url(#glass-grad)" stroke="#E2E8F0" strokeWidth="1.5" />
    {/* Liquid / Water line inside glass */}
    <path d="M168 220 L169 200 C185 202, 215 202, 231 200 L232 220 C232 220, 200 225, 168 220 Z" fill="#38BDF8" fillOpacity="0.2" />

    {/* Instrument 1: Mouth Mirror */}
    <line x1="175" y1="230" x2="215" y2="70" stroke="url(#silver-metal)" strokeWidth="3" strokeLinecap="round" />
    {/* Mirror Head angled */}
    <circle cx="220" cy="55" r="14" fill="url(#silver-metal)" stroke="#94A3B8" strokeWidth="1" />
    <circle cx="220" cy="55" r="11" fill="#38BDF8" fillOpacity="0.4" />
    <path d="M213 48 L227 62" stroke="#FFFFFF" strokeWidth="1" /> {/* Shine reflection */}

    {/* Instrument 2: Dental Explorer (Hook) */}
    <line x1="195" y1="230" x2="190" y2="80" stroke="url(#silver-metal)" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M190 80 C188 65, 178 65, 180 50" stroke="url(#silver-metal)" strokeWidth="2" fill="none" strokeLinecap="round" />

    {/* Instrument 3: Periodontal Probe */}
    <line x1="215" y1="230" x2="175" y2="90" stroke="url(#silver-metal)" strokeWidth="3" strokeLinecap="round" />
    {/* Measurement stripes on probe */}
    <line x1="185" y1="125" x2="182" y2="115" stroke="#000000" strokeWidth="3.5" />
    <line x1="180" y1="108" x2="178" y2="98" stroke="#000000" strokeWidth="3.5" />
  </svg>
);

// 9. Dental Lab CAD/CAM Milling Machine
export const DentalLabCADCAM: React.FC<{ className?: string }> = ({ className = "w-full h-full" }) => (
  <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Shadow */}
    <ellipse cx="200" cy="275" rx="110" ry="10" fill="#E2E8F0" filter="blur(7px)" />

    {/* Outer Cabin Body */}
    <rect x="110" y="80" width="180" height="180" rx="16" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="3" />
    <rect x="120" y="90" width="160" height="30" rx="4" fill="#006670" />
    <text x="135" y="110" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">FAAZO DENTAL LAB</text>

    {/* Milling Chamber Window */}
    <rect x="125" y="135" width="150" height="110" rx="8" fill="#0F172A" />
    {/* Chamber light glow (Blue) */}
    <rect x="130" y="140" width="140" height="100" rx="6" fill="#0284C7" fillOpacity="0.25" />

    {/* Rotary Block Clamp */}
    <circle cx="200" cy="190" r="24" fill="#334155" stroke="#64748B" strokeWidth="2" />
    <rect x="190" y="185" width="20" height="10" fill="#E2E8F0" rx="1" /> {/* Ceramic Crown Block */}

    {/* Milling Spindle & Drills */}
    <path d="M160 150 L180 180" stroke="url(#silver-metal)" strokeWidth="4" />
    <circle cx="180" cy="180" r="1.5" fill="#F58734" filter="drop-shadow(0px 0px 2px #EF4444)" />
    
    <path d="M240 150 L220 180" stroke="url(#silver-metal)" strokeWidth="4" />
    <circle cx="220" cy="180" r="1.5" fill="#F58734" filter="drop-shadow(0px 0px 2px #EF4444)" />

    {/* Status Indicator LED */}
    <circle cx="270" cy="105" r="4" fill="#10B981" />
  </svg>
);


// BRAND LOGO SVG COMPONENTS

// 3M Logo
export const Brand3M: React.FC = () => (
  <svg viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 md:h-10">
    <path d="M10 5 H35 V13 H24 V17 H35 V25 H24 V29 H35 V37 H10 Z" fill="#DA291C" />
    <path d="M40 5 H50 L58 20 L66 5 H76 V37 H66 V18 L58 32 L50 18 V37 H40 Z" fill="#DA291C" />
  </svg>
);

// Dentsply Sirona Logo
export const BrandDentsply: React.FC = () => (
  <svg viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 md:h-8">
    {/* Icon Emblem (Crescent waves) */}
    <path d="M12 25 C18 25, 24 15, 30 15 C36 15, 42 25, 48 25" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
    <path d="M6 15 C12 15, 18 5, 24 5 C30 5, 36 15, 42 15" stroke="#006670" strokeWidth="4" strokeLinecap="round" />
    {/* Text */}
    <text x="55" y="27" fill="#1E293B" fontSize="16" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.5">Dentsply</text>
    <text x="122" y="27" fill="#64748B" fontSize="14" fontFamily="sans-serif">Sirona</text>
  </svg>
);

// Ivoclar Logo
export const BrandIvoclar: React.FC = () => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 md:h-8">
    <text x="10" y="26" fill="#005691" fontSize="20" fontWeight="bold" fontFamily="sans-serif">ivoclar</text>
    <circle cx="92" cy="23" r="3" fill="#005691" />
  </svg>
);

// NSK Logo
export const BrandNSK: React.FC = () => (
  <svg viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 md:h-9">
    <path d="M5 32 L15 8 H24 L14 32 H5 Z" fill="#004C97" />
    <path d="M20 32 L30 8 H38 L28 32 H20 Z" fill="#004C97" />
    <text x="45" y="27" fill="#004C97" fontSize="24" fontWeight="900" fontStyle="italic" fontFamily="sans-serif" letterSpacing="-1">NSK</text>
  </svg>
);

// Woodpecker Logo
export const BrandWoodpecker: React.FC = () => (
  <svg viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 md:h-9">
    {/* Woodpecker bird silhouette */}
    <path d="M8 20 C8 12, 14 6, 20 6 C23 6, 26 8, 28 12 L22 18 L32 18 L26 26 C22 30, 14 30, 8 20 Z" fill="#DA291C" />
    <path d="M22 18 L35 15 L28 12 Z" fill="#DA291C" /> {/* Beak */}
    
    <text x="42" y="26" fill="#DA291C" fontSize="14" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">WOODPECKER</text>
  </svg>
);

// Coltene Logo
export const BrandColtene: React.FC = () => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 md:h-8">
    <path d="M10 10 H18 V16 H24 V10 H32 V30 H24 V24 H18 V30 H10 Z" fill="#0F4C81" />
    <text x="35" y="26" fill="#0F4C81" fontSize="16" fontWeight="bold" fontFamily="sans-serif" letterSpacing="0.5">COLTENE</text>
  </svg>
);

// Planmeca Logo
export const BrandPlanmeca: React.FC = () => (
  <svg viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 md:h-8">
    <text x="10" y="27" fill="#0A3C71" fontSize="20" fontWeight="900" fontFamily="sans-serif" letterSpacing="1.5">PLANMECA</text>
  </svg>
);
