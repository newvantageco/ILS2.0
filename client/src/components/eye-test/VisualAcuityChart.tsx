import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Eye } from "lucide-react";

const SNELLEN_CHART = [
  { size: "6/60", letters: "E", fontSize: "120px" },
  { size: "6/36", letters: "F P", fontSize: "80px" },
  { size: "6/24", letters: "T O Z", fontSize: "60px" },
  { size: "6/18", letters: "L P E D", fontSize: "48px" },
  { size: "6/12", letters: "P E C F D", fontSize: "36px" },
  { size: "6/9", letters: "E D F C Z P", fontSize: "28px" },
  { size: "6/6", letters: "F E L O P Z D", fontSize: "24px" },
  { size: "6/5", letters: "D E F P O T E C", fontSize: "20px" },
];

interface Props {
  eye: "R" | "L";
  onResult: (result: string) => void;
  initialValue?: string;
}

export function VisualAcuityChart({ eye, onResult, initialValue }: Props) {
  const [selectedLine, setSelectedLine] = useState(initialValue || "");

  const handleSelect = (value: string) => {
    setSelectedLine(value);
    onResult(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Visual Acuity - {eye === "R" ? "Right Eye" : "Left Eye"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-border min-h-[400px] flex flex-col items-center justify-center">
          <div className="space-y-4 text-center">
            {SNELLEN_CHART.map((line) => (
              <div key={line.size} className="space-y-1">
                <div
                  style={{ fontSize: line.fontSize }}
                  className="font-mono font-bold text-black tracking-wider"
                >
                  {line.letters}
                </div>
                <div className="text-xs text-muted-foreground">{line.size}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Patient can read up to:</Label>
          <RadioGroup value={selectedLine} onValueChange={handleSelect}>
            {SNELLEN_CHART.map((line) => (
              <div key={line.size} className="flex items-center space-x-2">
                <RadioGroupItem value={line.size} id={`${eye}-${line.size}`} />
                <Label htmlFor={`${eye}-${line.size}`} className="cursor-pointer">
                  {line.size} - {line.letters}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
