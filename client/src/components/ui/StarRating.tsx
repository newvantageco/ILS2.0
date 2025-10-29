import * as React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = "md",
  readonly = false,
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: max }, (_, i) => i + 1).map((rating) => {
        const isFilled = rating <= (hoverValue ?? value);
        
        return (
          <motion.button
            key={rating}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(rating)}
            onMouseEnter={() => !readonly && setHoverValue(rating)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            whileHover={!readonly ? { scale: 1.2 } : {}}
            whileTap={!readonly ? { scale: 0.9 } : {}}
            className={cn(
              "transition-colors",
              !readonly && "cursor-pointer",
              readonly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizes[size],
                isFilled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </motion.button>
        );
      })}
      
      {showValue && (
        <span className="ml-2 text-sm font-medium">
          {value.toFixed(1)} / {max}
        </span>
      )}
    </div>
  );
}

// Feedback component with rating
interface FeedbackWidgetProps {
  onSubmit: (rating: number, comment: string) => void;
  title?: string;
  placeholder?: string;
}

export function FeedbackWidget({
  onSubmit,
  title = "Rate your experience",
  placeholder = "Tell us more about your experience...",
}: FeedbackWidgetProps) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setRating(0);
        setComment("");
      }, 2000);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 bg-green-50 dark:bg-green-950/20 border border-green-500 rounded-lg text-center"
      >
        <p className="text-green-700 dark:text-green-400 font-medium">
          Thank you for your feedback!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-card border rounded-lg space-y-4"
    >
      <h3 className="font-semibold text-lg">{title}</h3>
      
      <div className="flex justify-center">
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      {rating > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={placeholder}
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
          />
          
          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Submit Feedback
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
