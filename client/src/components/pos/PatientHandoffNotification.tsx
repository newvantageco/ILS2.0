/**
 * Patient Handoff Notification Component
 * 
 * This is the "magic" of the Dispenser role - automatically shows
 * when a patient has completed an exam and is ready for dispensing.
 * 
 * Displays:
 * - Patient name and recent exam info
 * - Diagnosis from the eye_examination
 * - Recommended products (e.g., "Progressive Lenses")
 * - One-click action to load patient and filter products
 */

import { useState, useEffect } from "react";
import { X, Eye, ArrowRight, Clock, Stethoscope } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface RecentExamination {
  id: string;
  patientId: string;
  patientName: string;
  examinationDate: string;
  diagnosis: string;
  managementPlan: string;
  performedBy: string;
  status: string;
}

interface PatientHandoffNotificationProps {
  onSelectPatient: (patientId: string, examination: RecentExamination) => void;
  onDismiss: () => void;
}

export function PatientHandoffNotification({
  onSelectPatient,
  onDismiss,
}: PatientHandoffNotificationProps) {
  const [recentExams, setRecentExams] = useState<RecentExamination[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecentExaminations();
    
    // Poll every 30 seconds for new exams
    const interval = setInterval(fetchRecentExaminations, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentExaminations = async () => {
    try {
      // Get examinations from the last 2 hours that are completed
      const response = await fetch('/api/examinations/recent?hours=2&status=completed');
      
      if (!response.ok) {
        console.error('Failed to fetch recent examinations');
        return;
      }

      const data = await response.json();
      setRecentExams(data.examinations || []);
    } catch (error) {
      console.error('Error fetching recent examinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (examId: string) => {
    setDismissed(prev => {
      const newSet = new Set(prev);
      newSet.add(examId);
      return newSet;
    });
  };

  const handleSelectPatient = (exam: RecentExamination) => {
    onSelectPatient(exam.patientId, exam);
    handleDismiss(exam.id);
  };

  // Filter out dismissed exams
  const activeExams = recentExams.filter(exam => !dismissed.has(exam.id));

  if (loading || activeExams.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 z-50 space-y-3 max-w-md">
      {activeExams.map((exam) => (
        <Card
          key={exam.id}
          className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg animate-in slide-in-from-right"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-full">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-gray-900">
                  {exam.patientName}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleDismiss(exam.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-3 w-3" />
                <span>
                  Exam completed {formatDistanceToNow(new Date(exam.examinationDate), { addSuffix: true })}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Stethoscope className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Diagnosis:</span>
                    <span className="ml-2 text-gray-900">{exam.diagnosis}</span>
                  </div>
                </div>

                {exam.managementPlan && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
                    <p className="text-sm">
                      <span className="font-medium text-amber-900">Recommended:</span>
                      <span className="ml-2 text-amber-800">{exam.managementPlan}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Dr. {exam.performedBy}
                </Badge>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Ready for Dispensing
                </Badge>
              </div>

              <Button
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => handleSelectPatient(exam)}
              >
                <span>Begin Dispensing</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

/**
 * Hook to use patient handoff data in the POS page
 */
export function usePatientHandoff() {
  const [selectedExam, setSelectedExam] = useState<RecentExamination | null>(null);

  const handlePatientSelect = (patientId: string, examination: RecentExamination) => {
    setSelectedExam(examination);
    return { patientId, examination };
  };

  const clearExam = () => setSelectedExam(null);

  return {
    selectedExam,
    handlePatientSelect,
    clearExam,
  };
}
