import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { PrescriptionAlertsWidget } from '../components/PrescriptionAlertsWidget';
import { BIRecommendationsWidget } from '../components/BIRecommendationsWidget';
import { RefreshCw, Brain, AlertCircle, TrendingUp } from 'lucide-react';

export const IntelligentSystemDashboard: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'recommendations'>('alerts');
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === 'ecp' || user?.role === 'company_admin' || user?.role === 'admin' || user?.role === 'platform_admin') {
      loadAlerts();
      loadRecommendations();
    }
  }, [user]);

  const loadAlerts = async () => {
    setIsLoadingAlerts(true);
    try {
      const response = await fetch('/api/alerts/prescriptions');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const loadRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const response = await fetch('/api/recommendations/bi');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleDismissAlert = async (alertId: string, actionTaken?: string) => {
    try {
      await fetch(`/api/alerts/prescriptions/${alertId}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionTaken }),
      });
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const handleAcknowledgeRecommendation = async (id: string) => {
    try {
      await fetch(`/api/recommendations/bi/${id}/acknowledge`, {
        method: 'POST',
      });
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to acknowledge recommendation:', error);
    }
  };

  const handleStartImplementation = async (id: string) => {
    try {
      await fetch(`/api/recommendations/bi/${id}/start-implementation`, {
        method: 'POST',
      });
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to start implementation:', error);
    }
  };

  const handleCompleteImplementation = async (id: string) => {
    try {
      await fetch(`/api/recommendations/bi/${id}/complete-implementation`, {
        method: 'POST',
      });
      await loadRecommendations();
    } catch (error) {
      console.error('Failed to complete implementation:', error);
    }
  };

  const handleRunAnalysis = async () => {
    setIsLoadingRecs(true);
    try {
      const response = await fetch('/api/recommendations/bi/analyze', {
        method: 'POST',
      });
      if (response.ok) {
        await loadRecommendations();
        setLastAnalysisTime(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('Failed to run analysis:', error);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  if (user?.role !== 'ecp') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This dashboard is only available for ECP users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Intelligent System
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Powered by our Principal Engineer's AI analysis
                </p>
              </div>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={isLoadingRecs}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingRecs ? 'animate-spin' : ''}`} />
              Run Analysis
            </button>
          </div>

          {lastAnalysisTime && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
              Last analysis: {lastAnalysisTime}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Alerts Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Prescription Alerts
                </h2>
              </div>
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-semibold rounded-full">
                {alerts.length}
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Real-time analysis of prescription complexity and risk factors for non-adaptation.
              </p>
              <button
                onClick={() => setActiveTab('alerts')}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1"
              >
                View Details →
              </button>
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  BI Recommendations
                </h2>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-semibold rounded-full">
                {recommendations.length}
              </span>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Data-driven insights to optimize stocking, reduce errors, and boost profitability.
              </p>
              <button
                onClick={() => setActiveTab('recommendations')}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1"
              >
                View Details →
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700 flex">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                activeTab === 'alerts'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Prescription Alerts
              </div>
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                activeTab === 'recommendations'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" />
                BI Recommendations
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'alerts' ? (
              <PrescriptionAlertsWidget
                alerts={alerts}
                isLoading={isLoadingAlerts}
                onDismiss={handleDismissAlert}
              />
            ) : (
              <BIRecommendationsWidget
                recommendations={recommendations}
                isLoading={isLoadingRecs}
                onAcknowledge={handleAcknowledgeRecommendation}
                onStartImplementation={handleStartImplementation}
                onCompleteImplementation={handleCompleteImplementation}
                onRefresh={handleRunAnalysis}
              />
            )}
          </div>
        </div>

        {/* Feature Explanation */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🎯 Predictive Non-Adapt Alerts
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Our Principal Engineer's AI analyzes complex prescriptions (high-add progressives,
              high-wrap frames, astigmatism) to flag combinations with high non-adapt risk. Get
              real-time recommendations to switch lens types or materials before problems occur.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              📊 Intelligent Purchasing Assistant
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              Combines your POS sales data with our LIMS lab data to provide proactive business
              intelligence: optimize frame stocking, reduce breakage rates, identify upsell
              opportunities, and increase profitability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntelligentSystemDashboard;
