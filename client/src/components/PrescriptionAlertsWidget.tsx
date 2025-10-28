import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, X, TrendingUp } from 'lucide-react';

interface PrescriptionAlert {
  id: string;
  orderId: string;
  severity: 'info' | 'warning' | 'critical';
  alertType: string;
  riskScore: number;
  explanation: string;
  recommendedLensType?: string;
  recommendedMaterial?: string;
  recommendedCoating?: string;
  dismissedAt?: string;
}

interface PrescriptionAlertProps {
  alert: PrescriptionAlert;
  onDismiss: (alertId: string, actionTaken?: string) => void;
}

export const PrescriptionAlertCard: React.FC<PrescriptionAlertProps> = ({ alert, onDismiss }) => {
  const severityColors = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
  };

  const severityIcons = {
    critical: <AlertTriangle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <AlertCircle className="w-5 h-5 text-blue-600" />,
  };

  const riskPercentage = Math.round(alert.riskScore * 100);

  return (
    <div
      className={`border-l-4 rounded-lg p-4 mb-3 transition-all ${severityColors[alert.severity]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">{severityIcons[alert.severity]}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {alert.alertType.replace(/_/g, ' ').toUpperCase()}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {alert.explanation}
            </p>

            {/* Risk Score Display */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-xs">
                <div
                  className={`h-2 rounded-full transition-all ${
                    alert.severity === 'critical'
                      ? 'bg-red-600'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-600'
                      : 'bg-blue-600'
                  }`}
                  style={{ width: `${riskPercentage}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                {riskPercentage}% Risk
              </span>
            </div>

            {/* Recommendations */}
            {(alert.recommendedLensType ||
              alert.recommendedMaterial ||
              alert.recommendedCoating) && (
              <div className="bg-white dark:bg-gray-800/50 rounded p-3 mb-3 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Recommended Options:
                </p>
                <div className="flex flex-wrap gap-2">
                  {alert.recommendedLensType && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {alert.recommendedLensType}
                    </span>
                  )}
                  {alert.recommendedMaterial && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {alert.recommendedMaterial}
                    </span>
                  )}
                  {alert.recommendedCoating && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {alert.recommendedCoating}
                    </span>
                  )}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Order ID: {alert.orderId}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(alert.id, 'recommendation_accepted')}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

interface PrescriptionAlertsProps {
  alerts: PrescriptionAlert[];
  isLoading?: boolean;
  onDismiss: (alertId: string, actionTaken?: string) => void;
}

export const PrescriptionAlertsWidget: React.FC<PrescriptionAlertsProps> = ({
  alerts,
  isLoading = false,
  onDismiss,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-gray-400">
          No active prescription alerts. All orders look good!
        </p>
      </div>
    );
  }

  // Count by severity
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {criticalCount > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
            <p className="text-xs text-red-600 dark:text-red-400">Critical</p>
          </div>
        )}
        {warningCount > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Warnings</p>
          </div>
        )}
        {infoCount > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-600">{infoCount}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Info</p>
          </div>
        )}
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {alerts
          .sort((a, b) => {
            const severityOrder = { critical: 0, warning: 1, info: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          })
          .map(alert => (
            <PrescriptionAlertCard
              key={alert.id}
              alert={alert}
              onDismiss={onDismiss}
            />
          ))}
      </div>
    </div>
  );
};
