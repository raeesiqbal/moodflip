import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// 28 UNIQUE FEELING CARD ICONS (One distinct SVG per Feeling Card per BS §1.2)
// Brand Palette: #7464AC (purple primary), #4F438B (dark purple), #F4EBF5 (badge bg)
// ═════════════════════════════════════════════════════════════════════════════

// ── SAD FAMILY (6 ICONS) ─────────────────────────────────────────────────────

// 1. Lonely: Solitary figure with space and quiet reflection
export function LonelyIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Distant gentle stars */}
      <circle cx="12" cy="14" r="1.2" fill="#9D8FC4" />
      <circle cx="34" cy="13" r="1.2" fill="#9D8FC4" />
      {/* Solitary sitting figure on hill */}
      <path d="M10 35C15 31 31 31 36 35" stroke="#7464AC" strokeWidth="2" strokeLinecap="round" />
      <circle cx="23" cy="18" r="4" stroke="#4F438B" strokeWidth="2" fill="#FAF5FF" />
      <path d="M18 31C18 26 21 24 23 24C25 24 28 26 28 31" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 2. Vulnerable: Protective hands gently cradling a tender fragile heart
export function VulnerableIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Tender heart */}
      <path d="M23 21C21 16 16 17 16 20C16 23.5 23 27 23 27C23 27 30 23.5 30 20C30 17 25 16 23 21Z" fill="#FAF5FF" stroke="#7464AC" strokeWidth="1.8" strokeLinejoin="round" />
      {/* Cradling hands */}
      <path d="M13 29C15 33 20 34 23 34C26 34 31 33 33 29" stroke="#4F438B" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 25C12 28 15 30 17 31" stroke="#4F438B" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M35 25C34 28 31 30 29 31" stroke="#4F438B" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 3. Despair: Downward anchor grounding into solid stillness
export function DespairIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Anchor top loop */}
      <circle cx="23" cy="14" r="3" stroke="#4F438B" strokeWidth="2" fill="#FAF5FF" />
      {/* Vertical shank */}
      <path d="M23 17V33" stroke="#4F438B" strokeWidth="2.2" strokeLinecap="round" />
      {/* Crossbar */}
      <path d="M17 21H29" stroke="#7464AC" strokeWidth="2" strokeLinecap="round" />
      {/* Fluke curved arms */}
      <path d="M13 27C13 33 20 35 23 35C26 35 33 33 33 27" stroke="#4F438B" strokeWidth="2.2" strokeLinecap="round" />
      {/* Anchoring ground ripple */}
      <path d="M18 38H28" stroke="#9D8FC4" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// 4. Guilty: Hand over heart releasing gentle leaves of self-compassion
export function GuiltyIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Heart */}
      <path d="M23 17C21.5 13.5 17 14 17 17.5C17 21 23 25 23 25C23 25 29 21 29 17.5C29 14 24.5 13.5 23 17Z" stroke="#7464AC" strokeWidth="2" fill="#FAF5FF" />
      {/* Gentle hand palm over heart */}
      <path d="M16 28C19 25 24 25 27 28C28 29.5 27 32 25 33L19 33C17 32 15 30 16 28Z" stroke="#4F438B" strokeWidth="2" strokeLinejoin="round" fill="#F4EBF5" />
      {/* Releasing leaf */}
      <path d="M28 13C31 13 32 16 32 16C32 16 29 17 28 15Z" fill="#9D8FC4" />
    </svg>
  );
}

// 5. Depressed: Heavy storm cloud parting with ray of gentle sun
export function DepressedIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Sun peeking from behind */}
      <circle cx="30" cy="16" r="4.5" fill="#FFE082" stroke="#E5A800" strokeWidth="1.4" />
      <path d="M30 9V11M36 12L34.5 13.5M37 16H35" stroke="#E5A800" strokeWidth="1.4" strokeLinecap="round" />
      {/* Lifting cloud */}
      <path d="M15 29H31C33.5 29 35 27.5 35 25C35 22.8 33.5 21.2 31.5 21C31 17.5 28 16 25 16C22.2 16 20 18 19.5 20.5C17.5 20.8 15 22.5 15 25C15 27.5 16.5 29 19 29" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" fill="#FAF5FF" />
      {/* Gentle rain drops turning to light */}
      <circle cx="20" cy="34" r="1.2" fill="#7464AC" />
      <circle cx="26" cy="34" r="1.2" fill="#7464AC" />
    </svg>
  );
}

// 6. Hurt: Heart with tender healing bandage stitches
export function HurtIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Heart */}
      <path d="M23 20C20.5 14 14 15 14 20C14 25.5 23 31 23 31C23 31 32 25.5 32 20C32 15 25.5 14 23 20Z" fill="#FAF5FF" stroke="#4F438B" strokeWidth="2" strokeLinejoin="round" />
      {/* Bandage strip across */}
      <path d="M18 26L28 18" stroke="#7464AC" strokeWidth="3" strokeLinecap="round" />
      {/* Bandage cross-stitches */}
      <path d="M21 20L23 24M25 18L27 22" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ── FEARFUL FAMILY (6 ICONS) ─────────────────────────────────────────────────

// 7. Scared: Wide alert eyes with grounding anchor base
export function ScaredIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Left wide eye */}
      <circle cx="17" cy="22" r="5.5" stroke="#4F438B" strokeWidth="2" fill="#FFFFFF" />
      <circle cx="17" cy="22" r="2.5" fill="#4F438B" />
      <circle cx="16" cy="21" r="0.9" fill="#FFFFFF" />
      {/* Right wide eye */}
      <circle cx="29" cy="22" r="5.5" stroke="#4F438B" strokeWidth="2" fill="#FFFFFF" />
      <circle cx="29" cy="22" r="2.5" fill="#4F438B" />
      <circle cx="28" cy="21" r="0.9" fill="#FFFFFF" />
      {/* High arched brows */}
      <path d="M13 14C15 12 19 12 21 14" stroke="#7464AC" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M25 14C27 12 31 12 33 14" stroke="#7464AC" strokeWidth="1.8" strokeLinecap="round" />
      {/* Grounding breath smile */}
      <path d="M19 32C21 34 25 34 27 32" stroke="#7464AC" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 8. Anxious: Tangled spiral unwinding into smooth calm ribbon
export function AnxiousIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Tangled spiral unraveling */}
      <path d="M23 23C21 21 20 25 23 26C26 27 27 21 23 18C18 15 15 24 20 28C26 32 32 23 29 17C26 12 17 13 13 21C9 28 17 34 24 34C31 34 36 30 36 24" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="36" cy="24" r="1.8" fill="#7464AC" />
    </svg>
  );
}

// 9. Insecure: Tender seedling sheltered within sturdy protective circle
export function InsecureIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Sheltering arch */}
      <path d="M13 32C13 20 33 20 33 32" stroke="#9D8FC4" strokeWidth="1.8" strokeDasharray="2 3" strokeLinecap="round" />
      {/* Little seedling stem */}
      <path d="M23 34V22" stroke="#4F438B" strokeWidth="2.2" strokeLinecap="round" />
      {/* Left leaf */}
      <path d="M23 26C20 24 17 26 18 29C20 30 22 28 23 26Z" fill="#7464AC" />
      {/* Right leaf */}
      <path d="M23 23C26 21 29 23 28 26C26 27 24 25 23 23Z" fill="#4F438B" />
      {/* Ground bed */}
      <path d="M17 34H29" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 10. Weak: Bending bamboo stalk resiliently flexing without breaking
export function WeakIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Resilient flexing stalk */}
      <path d="M20 36C20 28 26 22 26 12" stroke="#4F438B" strokeWidth="2.4" strokeLinecap="round" />
      {/* Bamboo joints */}
      <path d="M18.5 30H22.5" stroke="#7464AC" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 21H26" stroke="#7464AC" strokeWidth="2" strokeLinecap="round" />
      {/* Fresh sprout leaf on tip */}
      <path d="M26 13C29 11 32 13 31 16C29 17 27 15 26 13Z" fill="#7464AC" />
      <path d="M25 15C22 13 20 15 21 17C23 18 25 17 25 15Z" fill="#9D8FC4" />
      {/* Strong root base */}
      <path d="M16 36H24" stroke="#4F438B" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

// 11. Rejected: Open door welcoming in bright light and belonging
export function RejectedIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Outer door frame */}
      <path d="M15 34V13H31V34" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" />
      {/* Light pouring out */}
      <path d="M20 14L30 18V32L17 34" fill="#FAF5FF" opacity="0.9" />
      {/* Door swung open inward */}
      <path d="M20 14V34L28 31V17L20 14Z" stroke="#7464AC" strokeWidth="2" fill="#EAE6F8" strokeLinejoin="round" />
      {/* Door knob */}
      <circle cx="26" cy="24" r="1.2" fill="#4F438B" />
      {/* Threshold step */}
      <path d="M12 34H34" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 12. Threatened: Strong protective shield with glowing star center
export function ThreatenedIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Sturdy knight shield */}
      <path d="M23 12L32 16V24C32 29.5 28 33.5 23 35C18 33.5 14 29.5 14 24V16L23 12Z" stroke="#4F438B" strokeWidth="2.2" fill="#FAF5FF" strokeLinejoin="round" />
      {/* Protective star badge */}
      <path d="M23 19L24.5 22.5L28 23L25.5 25.5L26 29L23 27.5L20 29L20.5 25.5L18 23L21.5 22.5L23 19Z" fill="#7464AC" />
    </svg>
  );
}

// ── ANGRY FAMILY (8 ICONS) ───────────────────────────────────────────────────

// 13. Let down: Snapped thread softly catching a firm safety net
export function LetDownIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Upper thread */}
      <path d="M23 11V19" stroke="#9D8FC4" strokeWidth="2" strokeLinecap="round" />
      <circle cx="23" cy="20" r="1.5" fill="#7464AC" />
      {/* Gentle floating parachute/leaf catching fall */}
      <path d="M15 28C15 23 31 23 31 28C31 28 27 30 23 30C19 30 15 28 15 28Z" stroke="#4F438B" strokeWidth="2" fill="#FAF5FF" strokeLinejoin="round" />
      <path d="M17 28L23 35M29 28L23 35" stroke="#7464AC" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="23" cy="35" r="2" fill="#4F438B" />
    </svg>
  );
}

// 14. Humiliated: Head lifting upright with noble inner dignity beam
export function HumiliatedIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Upright dignified profile/figure */}
      <circle cx="23" cy="18" r="4.5" stroke="#4F438B" strokeWidth="2" fill="#FAF5FF" />
      <path d="M16 34C16 28 20 26 23 26C26 26 30 28 30 34" stroke="#4F438B" strokeWidth="2.2" strokeLinecap="round" />
      {/* Inner crown/dignity rays */}
      <path d="M23 9V12M17 11L18.5 13M29 11L27.5 13" stroke="#7464AC" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 15. Bitter: Dropping bitter citrus seed neutralizing into pure clear drop
export function BitterIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Droplet outline */}
      <path d="M23 12C23 12 15 22 15 27C15 31.5 18.5 35 23 35C27.5 35 31 31.5 31 27C31 22 23 12 23 12Z" stroke="#4F438B" strokeWidth="2" fill="#FAF5FF" strokeLinejoin="round" />
      {/* Neutralizing ripple in drop */}
      <path d="M19 28C21 30 25 30 27 28" stroke="#7464AC" strokeWidth="1.8" strokeLinecap="round" />
      {/* Pure sparkle */}
      <circle cx="21" cy="21" r="1.5" fill="#7464AC" />
    </svg>
  );
}

// 16. Mad: Crackling steam valve venting cooling vapor to earth
export function MadIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Cooling ice-crystal / snowflake energy */}
      <path d="M23 12V34M12 23H34" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" />
      <path d="M15 15L31 31M31 15L15 31" stroke="#7464AC" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="23" cy="23" r="3" fill="#FAF5FF" stroke="#4F438B" strokeWidth="1.8" />
    </svg>
  );
}

// 17. Aggressive: Clenched fist releasing into peaceful open palm
export function AggressiveIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Open peaceful palm facing forward */}
      <path d="M18 20V15C18 13.5 19.5 13.5 19.5 15V22M22 17V13C22 11.5 23.5 11.5 23.5 13V22M26 18V14C26 12.5 27.5 12.5 27.5 14V23M15 22V19C15 17.5 16.5 17.5 16.5 19V25C16.5 29 19 33 24 33C29 33 31 29 31 25V23" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#FAF5FF" />
    </svg>
  );
}

// 18. Frustrated: Knot unwinding with a clear pathway arrow
export function FrustratedIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Maze breakthrough step */}
      <path d="M14 16H22V24H30V32" stroke="#7464AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Direct step arrow */}
      <path d="M26 32H32M32 32L29 29M32 32L29 35" stroke="#4F438B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Origin start circle */}
      <circle cx="14" cy="16" r="2" fill="#4F438B" />
    </svg>
  );
}

// 19. Distant: Two stepping stones across a pond connected by warm bridge
export function DistantIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Left stone */}
      <ellipse cx="16" cy="24" rx="4" ry="2.5" fill="#FAF5FF" stroke="#4F438B" strokeWidth="2" />
      {/* Right stone */}
      <ellipse cx="30" cy="24" rx="4" ry="2.5" fill="#FAF5FF" stroke="#4F438B" strokeWidth="2" />
      {/* Reconnecting arch bridge */}
      <path d="M16 22C19 16 27 16 30 22" stroke="#7464AC" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 3" />
      {/* Calming water ripples */}
      <path d="M12 30H34M16 33H30" stroke="#9D8FC4" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// 20. Critical: Magnifying glass reframing judgment into appreciation
export function CriticalIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Magnifying lens */}
      <circle cx="21" cy="20" r="7" stroke="#4F438B" strokeWidth="2.2" fill="#FAF5FF" />
      {/* Handle */}
      <path d="M26 25L33 32" stroke="#4F438B" strokeWidth="2.5" strokeLinecap="round" />
      {/* Appreciation sparkle inside */}
      <path d="M21 16V24M17 20H25" stroke="#7464AC" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── DISGUSTED FAMILY (4 ICONS) ───────────────────────────────────────────────

// 21. Disapproving: Balanced scales resting in non-judgmental harmony
export function DisapprovingIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Pillar */}
      <path d="M23 14V33" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 33H28" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" />
      {/* Beam */}
      <path d="M14 17H32" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" />
      {/* Left pan */}
      <path d="M14 17L12 24H16L14 17Z" stroke="#7464AC" strokeWidth="1.6" strokeLinejoin="round" fill="#FAF5FF" />
      {/* Right pan */}
      <path d="M32 17L30 24H34L32 17Z" stroke="#7464AC" strokeWidth="1.6" strokeLinejoin="round" fill="#FAF5FF" />
    </svg>
  );
}

// 22. Uncomfortable: Pebble settling smoothly into peaceful water ripples
export function UncomfortableIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Smooth concentric ripples */}
      <ellipse cx="23" cy="24" rx="13" ry="5.5" stroke="#9D8FC4" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="23" cy="24" rx="8" ry="3.5" stroke="#7464AC" strokeWidth="1.6" strokeLinecap="round" />
      {/* Smooth grounding stone */}
      <circle cx="23" cy="23" r="3.5" fill="#4F438B" />
    </svg>
  );
}

// 23. Awful: Fresh breeze clearing heavy air with renewed vitality
export function AwfulIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Breeze waves flowing */}
      <path d="M12 18H28C31 18 33 16 31 14C29 12 27 14 27 15" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M14 24H30C33 24 35 26 33 28C31 30 29 28 29 27" stroke="#7464AC" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M16 30H24" stroke="#9D8FC4" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 24. Repelled: Gentle semi-circular aura redirecting energy gracefully
export function RepelledIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Protective graceful boundary arc */}
      <path d="M21 13C27 13 32 17.5 32 23C32 28.5 27 33 21 33" stroke="#4F438B" strokeWidth="2.4" strokeLinecap="round" />
      {/* Clean deflect arrow */}
      <path d="M14 23H22M22 23L18 19M22 23L18 27" stroke="#7464AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── BAD FAMILY (4 ICONS) ─────────────────────────────────────────────────────

// 25. Tired: Peaceful crescent moon resting on cozy cloud
export function TiredIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Resting crescent moon */}
      <path d="M26 13C20 14 17 19 18 25C19 30 24 33 29 31C21 35 14 26 18 18C19.5 15 22.5 13.5 26 13Z" fill="#FAF5FF" stroke="#4F438B" strokeWidth="2" strokeLinejoin="round" />
      {/* Zzz calm indicators */}
      <path d="M28 14H32L28 18H32" stroke="#7464AC" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 11H25.5L23 13.5H25.5" stroke="#9D8FC4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 26. Stressed: Taut spring gently releasing into smooth stillness
export function StressedIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Coiled spring releasing down to balance */}
      <path d="M23 12V16C19 16 19 19 23 19C27 19 27 22 23 22C19 22 19 25 23 25C27 25 27 28 23 28V33" stroke="#4F438B" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="23" cy="34" r="2" fill="#7464AC" />
    </svg>
  );
}

// 27. Busy: Clock dial with serene single minute hand and calm center
export function BusyIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Clock body */}
      <circle cx="23" cy="23" r="12" stroke="#4F438B" strokeWidth="2.2" fill="#FAF5FF" />
      {/* Focused calm clock hands */}
      <path d="M23 16V23L27 26" stroke="#7464AC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="23" cy="23" r="1.8" fill="#4F438B" />
      {/* Hour tick marks */}
      <circle cx="23" cy="14" r="0.8" fill="#9D8FC4" />
      <circle cx="32" cy="23" r="0.8" fill="#9D8FC4" />
      <circle cx="23" cy="32" r="0.8" fill="#9D8FC4" />
      <circle cx="14" cy="23" r="0.8" fill="#9D8FC4" />
    </svg>
  );
}

// 28. Bored: Lightbulb / spark ignition lighting up fresh curiosity
export function BoredIcon({ className, size = 46 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="23" cy="23" r="21" fill="#F4EBF5" stroke="#E2D9EE" strokeWidth="1.5" />
      {/* Lightbulb glass */}
      <path d="M17 21C17 17.5 19.5 15 23 15C26.5 15 29 17.5 29 21C29 23.5 27.5 25.5 26 27V29H20V27C18.5 25.5 17 23.5 17 21Z" stroke="#4F438B" strokeWidth="2" fill="#FAF5FF" strokeLinejoin="round" />
      {/* Base screw */}
      <path d="M21 32H25" stroke="#4F438B" strokeWidth="2" strokeLinecap="round" />
      {/* Glowing filament */}
      <path d="M21 22L23 20L25 22" stroke="#7464AC" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Radiating sparks */}
      <path d="M23 10V12M13 17L15 18M33 17L31 18" stroke="#7464AC" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
