import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palette, Check, X } from "lucide-react";

// Simplified Ishihara plate simulation (numbered plates)
const ISHIHARA_PLATES = [
  { id: 1, number: "12", correctAnswer: "12", description: "Control Plate" },
  { id: 2, number: "8", correctAnswer: "8", description: "Red-Green Deficiency Test" },
  { id: 3, number: "6", correctAnswer: "6", description: "Red-Green Deficiency Test" },
  { id: 4, number: "29", correctAnswer: "29", description: "Red-Green Deficiency Test" },
  { id: 5, number: "57", correctAnswer: "57", description: "Red-Green Deficiency Test" },
  { id: 6, number: "5", correctAnswer: "5", description: "Red-Green Deficiency Test" },
  { id: 7, number: "3", correctAnswer: "3", description: "Red-Green Deficiency Test" },
  { id: 8, number: "15", correctAnswer: "15", description: "Red-Green Deficiency Test" },
  { id: 9, number: "74", correctAnswer: "74", description: "Red-Green Deficiency Test" },
  { id: 10, number: "2", correctAnswer: "2", description: "Red-Green Deficiency Test" },
];

interface Props {
  onComplete: (result: ColorBlindnessResult) => void;
}

export interface ColorBlindnessResult {
  totalPlates: number;
  correctAnswers: number;
  incorrectAnswers: number;
  interpretation: string;
  details: Array<{ plateId: number; correct: boolean }>;
}

export function ColorBlindnessTest({ onComplete }: Props) {
  const [currentPlate, setCurrentPlate] = useState(0);
  const [answers, setAnswers] = useState<Array<{ plateId: number; userAnswer: string; correct: boolean }>>([]);
  const [userInput, setUserInput] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const handleAnswer = () => {
    const plate = ISHIHARA_PLATES[currentPlate];
    const isCorrect = userInput === plate.correctAnswer;

    const newAnswers = [
      ...answers,
      {
        plateId: plate.id,
        userAnswer: userInput,
        correct: isCorrect,
      },
    ];

    setAnswers(newAnswers);
    setUserInput("");

    if (currentPlate < ISHIHARA_PLATES.length - 1) {
      setCurrentPlate(currentPlate + 1);
    } else {
      // Test complete
      const correctCount = newAnswers.filter((a) => a.correct).length;
      const incorrectCount = newAnswers.length - correctCount;
      
      let interpretation = "";
      if (correctCount === ISHIHARA_PLATES.length) {
        interpretation = "Normal color vision";
      } else if (correctCount >= ISHIHARA_PLATES.length - 2) {
        interpretation = "Borderline - recommend full color vision assessment";
      } else if (correctCount >= ISHIHARA_PLATES.length - 4) {
        interpretation = "Mild color vision deficiency detected";
      } else {
        interpretation = "Significant color vision deficiency detected - refer for specialist assessment";
      }

      const result: ColorBlindnessResult = {
        totalPlates: ISHIHARA_PLATES.length,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        interpretation,
        details: newAnswers.map((a) => ({
          plateId: a.plateId,
          correct: a.correct,
        })),
      };

      setIsComplete(true);
      onComplete(result);
    }
  };

  const handleSkip = () => {
    const plate = ISHIHARA_PLATES[currentPlate];
    const newAnswers = [
      ...answers,
      {
        plateId: plate.id,
        userAnswer: "skipped",
        correct: false,
      },
    ];

    setAnswers(newAnswers);

    if (currentPlate < ISHIHARA_PLATES.length - 1) {
      setCurrentPlate(currentPlate + 1);
    }
  };

  const reset = () => {
    setCurrentPlate(0);
    setAnswers([]);
    setUserInput("");
    setIsComplete(false);
  };

  if (isComplete) {
    const correctCount = answers.filter((a) => a.correct).length;
    const score = (correctCount / ISHIHARA_PLATES.length) * 100;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Vision Test Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{correctCount}</div>
              <div className="text-sm text-muted-foreground">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {answers.length - correctCount}
              </div>
              <div className="text-sm text-muted-foreground">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{score.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">Interpretation:</p>
            <p className="text-sm mt-1">
              {answers.filter((a) => a.correct).length === ISHIHARA_PLATES.length
                ? "Normal color vision"
                : answers.filter((a) => a.correct).length >= ISHIHARA_PLATES.length - 2
                ? "Borderline - recommend full assessment"
                : "Color vision deficiency detected"}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={reset} variant="outline" className="flex-1">
              Repeat Test
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const plate = ISHIHARA_PLATES[currentPlate];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Ishihara Color Blindness Test
        </CardTitle>
        <CardDescription>
          Plate {currentPlate + 1} of {ISHIHARA_PLATES.length} - {plate.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-br from-gray-200 to-gray-300 p-8 rounded-lg border-2 border-border aspect-square flex items-center justify-center">
          <div className="relative w-full h-full max-w-md max-h-md">
            {/* Simulated Ishihara plate */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-9xl font-bold opacity-30" style={{ color: "#8B4513" }}>
                {plate.number}
              </div>
            </div>
            <div className="absolute inset-0">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {/* Background dots */}
                {Array.from({ length: 200 }).map((_, i) => {
                  const x = Math.random() * 400;
                  const y = Math.random() * 400;
                  const r = Math.random() * 8 + 4;
                  const colors = ["#90EE90", "#98FB98", "#00FF00", "#32CD32"];
                  const color = colors[Math.floor(Math.random() * colors.length)];
                  return <circle key={i} cx={x} cy={y} r={r} fill={color} />;
                })}
                {/* Number dots (slightly different color) */}
                {Array.from({ length: 80 }).map((_, i) => {
                  const angle = (i / 80) * Math.PI * 2;
                  const radius = 120;
                  const x = 200 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40;
                  const y = 200 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40;
                  const r = Math.random() * 8 + 4;
                  const colors = ["#FF6B6B", "#FF8E8E", "#FFB3B3"];
                  const color = colors[Math.floor(Math.random() * colors.length)];
                  return <circle key={`num-${i}`} cx={x} cy={y} r={r} fill={color} />;
                })}
              </svg>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">What number do you see?</label>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Enter the number you see"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === "Enter" && userInput) {
                  handleAnswer();
                }
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAnswer}
              disabled={!userInput}
              className="flex-1"
            >
              Submit Answer
            </Button>
            <Button onClick={handleSkip} variant="outline">
              Can't See Number
            </Button>
          </div>
        </div>

        <div className="flex gap-1 justify-center">
          {ISHIHARA_PLATES.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx < currentPlate
                  ? answers[idx]?.correct
                    ? "bg-green-500"
                    : "bg-red-500"
                  : idx === currentPlate
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
