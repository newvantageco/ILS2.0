import * as React from "react";
import { motion, useAnimation } from "framer-motion";
import { Sparkles, Wand2, Lightbulb, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "magnetic" | "ripple" | "shine" | "particles";
  children: React.ReactNode;
}

export function MagneticButton({
  variant = "magnetic",
  children,
  className,
  ...props
}: InteractiveButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const controls = useAnimation();

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || variant !== "magnetic") return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === "ripple") {
      const rect = buttonRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      controls.start({
        scale: [0, 2],
        opacity: [1, 0],
        transition: { duration: 0.6 },
      });
    }

    if (props.onClick) {
      props.onClick(e);
    }
  };

  const { onClick: _, ...restProps } = props;
  
  return (
    <motion.div
      animate={{
        x: position.x,
        y: position.y,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ display: 'inline-block' }}
    >
      <button
        ref={buttonRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden px-6 py-3 rounded-lg font-medium transition-colors",
          "bg-primary text-primary-foreground hover:opacity-90",
          className
        )}
        {...restProps}
      >
      {variant === "ripple" && (
        <motion.span
          animate={controls}
          className="absolute inset-0 bg-white/30 rounded-full"
          style={{ transformOrigin: "center" }}
        />
      )}
      
      {variant === "shine" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      )}

      <span className="relative z-10">{children}</span>
    </button>
    </motion.div>
  );
}

// Floating action button with micro-interactions
export function FloatingActionButton({
  icon: Icon = Sparkles,
  label,
  onClick,
  position = "bottom-right",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  onClick: () => void;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  const positions = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <motion.div
      className={cn("fixed z-50", positions[position])}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-shadow"
        animate={{
          boxShadow: isHovered
            ? "0 20px 25px -5px rgb(0 0 0 / 0.3)"
            : "0 10px 15px -3px rgb(0 0 0 / 0.2)",
        }}
      >
        <Icon className="h-6 w-6" />
        
        {/* Pulse animation */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary"
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
        />
      </motion.button>

      {label && isHovered && (
        <motion.div
          initial={{ opacity: 0, x: position.includes("right") ? 10 : -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "absolute top-1/2 -translate-y-1/2 whitespace-nowrap",
            "bg-popover border rounded-lg px-3 py-2 text-sm shadow-lg",
            position.includes("right") ? "right-full mr-2" : "left-full ml-2"
          )}
        >
          {label}
        </motion.div>
      )}
    </motion.div>
  );
}

// Button with loading state and success animation
export function SmartButton({
  children,
  onClickAsync,
  loading = false,
  success = false,
  className,
  ...props
}: {
  children: React.ReactNode;
  onClickAsync?: () => void | Promise<void>;
  loading?: boolean;
  success?: boolean;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const [internalSuccess, setInternalSuccess] = React.useState(false);

  const isLoading = loading || internalLoading;
  const isSuccess = success || internalSuccess;

  const handleClick = async () => {
    if (isLoading || isSuccess) return;

    if (onClickAsync) {
      setInternalLoading(true);
      try {
        await onClickAsync();
        setInternalSuccess(true);
        setTimeout(() => {
          setInternalSuccess(false);
          setInternalLoading(false);
        }, 2000);
      } catch (error) {
        setInternalLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isSuccess}
      className={cn(
        "relative px-6 py-3 rounded-lg font-medium transition-all",
        "bg-primary text-primary-foreground hover:opacity-90 hover:scale-102",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      <motion.span
        animate={{
          opacity: isLoading || isSuccess ? 0 : 1,
        }}
      >
        {children}
      </motion.span>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
          />
        </motion.div>
      )}

      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
      )}
    </button>
  );
}
