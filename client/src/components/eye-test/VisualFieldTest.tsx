import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crosshair, Eye } from "lucide-react";

interface FieldPoint {
  x: number;
  y: number;
  seen: boolean | null; // null = not tested, true = seen, false = not seen
}

interface Props {
  eye: "R" | "L";
  onComplete: (results: FieldPoint[]) => void;
}

export function VisualFieldTest({ eye, onComplete }: Props) {
  const [isStarted, setIsStarted] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(0);
  const [testPoints, setTestPoints] = useState<FieldPoint[]>(() => {
    // Generate test points in a pattern (24-2 pattern simplified)
    const points: FieldPoint[] = [];
    const centerX = 200;
    const centerY = 200;
    
    // Create concentric circles of test points
    const rings = [
      { radius: 40, count: 4 },
      { radius: 80, count: 8 },
      { radius: 120, count: 12 },
      { radius: 160, count: 16 },
    ];

    rings.forEach(({ radius, count }) => {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        points.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          seen: null,
        });
      }
    });

    // Add central point
    points.push({ x: centerX, y: centerY, seen: null });

    return points;
  });
  const [showingStimulus, setShowingStimulus] = useState(false);

  const startTest = () => {
    setIsStarted(true);
    showNextStimulus();
  };

  const showNextStimulus = () => {
    if (currentPoint >= testPoints.length) {
      // Test complete
      onComplete(testPoints);
      return;
    }

    // Show stimulus after random delay (200-800ms)
    const delay = Math.random() * 600 + 200;
    setTimeout(() => {
      setShowingStimulus(true);
    }, delay);
  };

  const handleSeen = () => {
    const updatedPoints = [...testPoints];
    updatedPoints[currentPoint] = {
      ...updatedPoints[currentPoint],
      seen: true,
    };
    setTestPoints(updatedPoints);
    setShowingStimulus(false);

    if (currentPoint < testPoints.length - 1) {
      setCurrentPoint(currentPoint + 1);
      showNextStimulus();
    } else {
      onComplete(updatedPoints);
    }
  };

  const handleNotSeen = () => {
    const updatedPoints = [...testPoints];
    updatedPoints[currentPoint] = {
      ...updatedPoints[currentPoint],
      seen: false,
    };
    setTestPoints(updatedPoints);
    setShowingStimulus(false);

    if (currentPoint < testPoints.length - 1) {
      setCurrentPoint(currentPoint + 1);
      showNextStimulus();
    } else {
      onComplete(updatedPoints);
    }
  };

  const reset = () => {
    setIsStarted(false);
    setCurrentPoint(0);
    setTestPoints(
      testPoints.map((p) => ({
        ...p,
        seen: null,
      }))
    );
    setShowingStimulus(false);
  };

  const calculateDefects = () => {
    const tested = testPoints.filter((p) => p.seen !== null);
    const seen = tested.filter((p) => p.seen === true);
    const missed = tested.filter((p) => p.seen === false);
    return { total: tested.length, seen: seen.length, missed: missed.length };
  };

  const isComplete = testPoints.every((p) => p.seen !== null);

  if (isComplete) {
    const stats = calculateDefects();
    const score = (stats.seen / stats.total) * 100;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            Visual Field Test Results - {eye === "R" ? "Right Eye" : "Left Eye"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full aspect-square max-w-md mx-auto bg-black rounded-lg border-2 border-border">
            <svg viewBox="0 0 400 400" className="w-full h-full">
              {/* Draw grid */}
              <line x1="200" y1="0" x2="200" y2="400" stroke="#333" strokeWidth="1" />
              <line x1="0" y1="200" x2="400" y2="200" stroke="#333" strokeWidth="1" />
              <circle cx="200" cy="200" r="160" fill="none" stroke="#333" strokeWidth="1" />
              <circle cx="200" cy="200" r="120" fill="none" stroke="#333" strokeWidth="1" />
              <circle cx="200" cy="200" r="80" fill="none" stroke="#333" strokeWidth="1" />
              <circle cx="200" cy="200" r="40" fill="none" stroke="#333" strokeWidth="1" />

              {/* Central fixation point */}
              <circle cx="200" cy="200" r="3" fill="red" />

              {/* Plot test points */}
              {testPoints.map((point, idx) => (
                <circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill={point.seen === true ? "#22c55e" : point.seen === false ? "#ef4444" : "#666"}
                  opacity={point.seen === null ? 0.3 : 0.8}
                />
              ))}
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Points Tested</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.seen}</div>
              <div className="text-sm text-muted-foreground">Seen</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.missed}</div>
              <div className="text-sm text-muted-foreground">Missed</div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium">Visual Field Score: {score.toFixed(1)}%</p>
            <p className="text-sm mt-1 text-muted-foreground">
              {score >= 95
                ? "Normal visual field"
                : score >= 85
                ? "Mild defects detected"
                : score >= 70
                ? "Moderate defects - recommend further investigation"
                : "Significant defects - refer to specialist"}
            </p>
          </div>

          <Button onClick={reset} variant="outline" className="w-full">
            Repeat Test
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crosshair className="h-5 w-5" />
          Visual Field Test - {eye === "R" ? "Right Eye" : "Left Eye"}
        </CardTitle>
        <CardDescription>
          {!isStarted
            ? "Cover the other eye and focus on the red central point. Press the button when you see a flash."
            : `Point ${currentPoint + 1} of ${testPoints.length}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full aspect-square max-w-md mx-auto bg-black rounded-lg border-2 border-border overflow-hidden">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            {/* Central fixation point */}
            <circle cx="200" cy="200" r="4" fill="red" />

            {/* Show stimulus if active */}
            {showingStimulus && currentPoint < testPoints.length && (
              <circle
                cx={testPoints[currentPoint].x}
                cy={testPoints[currentPoint].y}
                r="8"
                fill="white"
                className="animate-pulse"
              />
            )}

            {/* Show previously tested points (faint) */}
            {testPoints.slice(0, currentPoint).map((point, idx) => (
              <circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r="3"
                fill={point.seen ? "#22c55e" : "#ef4444"}
                opacity="0.3"
              />
            ))}
          </svg>
        </div>

        {!isStarted ? (
          <Button onClick={startTest} className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            Start Test
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button onClick={handleSeen} className="flex-1" variant="default">
                I See It
              </Button>
              <Button onClick={handleNotSeen} className="flex-1" variant="outline">
                Don't See It
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Keep your eye focused on the red center point
            </p>
          </div>
        )}

        <div className="flex gap-1 justify-center flex-wrap">
          {testPoints.map((point, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                point.seen === true
                  ? "bg-green-500"
                  : point.seen === false
                  ? "bg-red-500"
                  : idx === currentPoint && isStarted
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
