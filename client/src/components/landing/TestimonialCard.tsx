import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  title: string;
  company: string;
  imagePlaceholder?: string;
}

export function TestimonialCard({
  quote,
  author,
  title,
  company,
  imagePlaceholder = "Professional headshot",
}: TestimonialProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-8 space-y-6">
        {/* Quote Icon */}
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Quote className="h-6 w-6 text-primary" />
        </div>

        {/* Quote Text */}
        <blockquote className="text-lg font-medium leading-relaxed">
          &ldquo;{quote}&rdquo;
        </blockquote>

        {/* Author Info */}
        <div className="flex items-center gap-4 pt-4 border-t">
          {/* Avatar Placeholder */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-primary">
              {author.split(" ").map((n) => n[0]).join("")}
            </span>
          </div>

          {/* Details */}
          <div>
            <div className="font-semibold text-foreground">{author}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-sm text-muted-foreground font-medium">{company}</div>
          </div>
        </div>

        {/* Image Placeholder Note */}
        <div className="text-xs text-muted-foreground/70 italic pt-2 border-t">
          [{imagePlaceholder}]
        </div>
      </CardContent>
    </Card>
  );
}
