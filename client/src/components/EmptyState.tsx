/**
 * EmptyState Component
 * 
 * UX Principle: Guide users with clear next steps when content is empty
 * Instead of blank pages, show helpful guidance
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction
}) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-6">
          <Icon className="w-12 h-12 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          {description}
        </p>
        
        {action && (
          <div className="flex gap-3">
            <Button onClick={action.onClick} size="lg">
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
            
            {secondaryAction && (
              <Button 
                onClick={secondaryAction.onClick} 
                variant="outline" 
                size="lg"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Usage example:
// <EmptyState
//   icon={Users}
//   title="No patients yet"
//   description="Add your first patient to start managing appointments and examinations"
//   action={{
//     label: "Add Patient",
//     onClick: () => setShowNewPatientModal(true),
//     icon: Plus
//   }}
//   secondaryAction={{
//     label: "Import from CSV",
//     onClick: () => setShowImportModal(true)
//   }}
// />
