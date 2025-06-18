// src/components/shared/KoneLogo.tsx
import type { SVGProps } from 'react';

interface KoneLogoProps extends SVGProps<SVGSVGElement> {
  blockColor?: string;
  textColor?: string;
  separatorColor?: string;
}

export function KoneLogo({
  blockColor = "#1450f5", // Default KONE Blue
  textColor = "white",     // Default White
  separatorColor = "white",// Default White
  ...props
}: KoneLogoProps) {
  return (
    <svg
      viewBox="0 0 332 100" // Aspect ratio based on 4 blocks of ~80x100 and 3 separators of ~4x100
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="KONE Logo"
      {...props}
    >
      {/* Block K */}
      <rect x="0" y="0" width="80" height="100" fill={blockColor}/>
      <text 
        x="40" 
        y="50" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fontFamily="PT Sans, sans-serif" 
        fontSize="65" 
        fontWeight="bold" 
        fill={textColor}
      >
        K
      </text>
      
      {/* Separator 1 */}
      <rect x="80" y="0" width="4" height="100" fill={separatorColor}/>
      
      {/* Block O */}
      <rect x="84" y="0" width="80" height="100" fill={blockColor}/>
      <text 
        x="124" // 84 + 40
        y="50" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fontFamily="PT Sans, sans-serif" 
        fontSize="65" 
        fontWeight="bold" 
        fill={textColor}
      >
        O
      </text>
      
      {/* Separator 2 */}
      <rect x="164" y="0" width="4" height="100" fill={separatorColor}/>
      
      {/* Block N */}
      <rect x="168" y="0" width="80" height="100" fill={blockColor}/>
      <text 
        x="208" // 168 + 40
        y="50" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fontFamily="PT Sans, sans-serif" 
        fontSize="65" 
        fontWeight="bold" 
        fill={textColor}
      >
        N
      </text>
      
      {/* Separator 3 */}
      <rect x="248" y="0" width="4" height="100" fill={separatorColor}/>
      
      {/* Block E */}
      <rect x="252" y="0" width="80" height="100" fill={blockColor}/>
      <text 
        x="292" // 252 + 40
        y="50" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fontFamily="PT Sans, sans-serif" 
        fontSize="65" 
        fontWeight="bold" 
        fill={textColor}
      >
        E
      </text>
    </svg>
  );
}
