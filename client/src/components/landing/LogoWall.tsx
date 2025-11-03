import { Building2 } from "lucide-react";

interface LogoWallProps {
  logos?: string[];
}

export function LogoWall({ logos = [] }: LogoWallProps) {
  // Placeholder logos - in production, these would be actual client logos
  const placeholderLogos = [
    "VisionFirst Practice",
    "OptiCore Group",
    "ClearSight Optical",
    "PremiumVision",
    "EyeCare Solutions",
    "Modern Optics Co",
  ];

  const displayLogos = logos.length > 0 ? logos : placeholderLogos;

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-muted-foreground font-medium">
        Trusted by leading optical practices
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {displayLogos.map((logo, index) => (
          <div
            key={index}
            className="flex items-center justify-center p-4 rounded-lg border border-border bg-background hover:border-primary/30 hover:bg-muted/50 transition-all"
          >
            <div className="text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xs font-medium text-muted-foreground leading-tight">
                {logo}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-center text-muted-foreground/70 italic">
        [Client logos with permission - Placeholder]
      </div>
    </div>
  );
}
