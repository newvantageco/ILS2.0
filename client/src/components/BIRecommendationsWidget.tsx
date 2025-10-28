import React, { useState } from 'react';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Target,
  Zap,
  DollarSign,
  BarChart3,
  X,
} from 'lucide-react';

interface BiRecommendation {
  id: string;
  recommendationType: 'stocking' | 'upsell' | 'cross_sell' | 'breakage_reduction' | 'error_reduction';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  actionItems: Array<{ action: string; details?: string }>;
  estimatedRevenueLift?: number;
  estimatedErrorReduction?: number;
  acknowledged: boolean;
  implementationStartedAt?: string;
  implementationCompletedAt?: string;
  createdAt: string;
}

interface BIRecommendationCardProps {
  recommendation: BiRecommendation;
  onAcknowledge: (id: string) => void;
  onStartImplementation: (id: string) => void;
  onCompleteImplementation: (id: string) => void;
}

const typeIcons = {
  stocking: <Target className="w-5 h-5" />,
  upsell: <TrendingUp className="w-5 h-5" />,
  cross_sell: <Zap className="w-5 h-5" />,
  breakage_reduction: <AlertCircle className="w-5 h-5" />,
  error_reduction: <BarChart3 className="w-5 h-5" />,
};

const typeColors = {
  stocking: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  upsell: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  cross_sell: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  breakage_reduction: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  error_reduction: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-300',
};

const BIRecommendationCard: React.FC<BIRecommendationCardProps> = ({
  recommendation,
  onAcknowledge,
  onStartImplementation,
  onCompleteImplementation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const implementationStatus = recommendation.implementationCompletedAt
    ? 'completed'
    : recommendation.implementationStartedAt
    ? 'in_progress'
    : recommendation.acknowledged
    ? 'acknowledged'
    : 'pending';

  return (
    <div
      className={`border rounded-lg p-4 mb-3 transition-all cursor-pointer hover:shadow-md ${
        typeColors[recommendation.recommendationType]
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-gray-700 dark:text-gray-300">
          {typeIcons[recommendation.recommendationType]}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {recommendation.title}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {recommendation.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  priorityColors[recommendation.priority]
                }`}
              >
                {recommendation.priority.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 mt-3 mb-3">
            {recommendation.estimatedRevenueLift && (
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800/50 rounded p-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-gray-700 dark:text-gray-300">
                  +${(Number(recommendation.estimatedRevenueLift) / 1000).toFixed(1)}k potential
                </span>
              </div>
            )}
            {recommendation.estimatedErrorReduction && (
              <div className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800/50 rounded p-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700 dark:text-gray-300">
                  {Math.round(Number(recommendation.estimatedErrorReduction) * 100)}% error reduction
                </span>
              </div>
            )}
          </div>

          {/* Expandable Details */}
          {isExpanded && (
            <div className="bg-white dark:bg-gray-800/50 rounded p-3 mb-3 border border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-xs text-gray-900 dark:text-gray-100 mb-2">
                IMPACT
              </h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {recommendation.impact}
              </p>

              <h5 className="font-semibold text-xs text-gray-900 dark:text-gray-100 mb-2">
                ACTION ITEMS
              </h5>
              <ul className="space-y-2">
                {recommendation.actionItems?.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex gap-2">
                      <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {idx + 1}.
                      </span>
                      <div>
                        <p className="font-medium">{item.action}</p>
                        {item.details && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {item.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline mb-3 flex items-center gap-1"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
            <ChevronRight
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>

          {/* Implementation Status & Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {implementationStatus === 'completed' && (
                <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </div>
              )}
              {implementationStatus === 'in_progress' && (
                <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                  <Clock className="w-4 h-4 animate-spin" />
                  In Progress
                </div>
              )}
              {implementationStatus === 'acknowledged' && (
                <div className="flex items-center gap-1 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  Acknowledged
                </div>
              )}
              {implementationStatus === 'pending' && (
                <div className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <AlertCircle className="w-4 h-4" />
                  Pending Review
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {implementationStatus === 'pending' && (
                <button
                  onClick={() => onAcknowledge(recommendation.id)}
                  className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Review & Approve
                </button>
              )}
              {implementationStatus === 'acknowledged' && (
                <button
                  onClick={() => onStartImplementation(recommendation.id)}
                  className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Start Implementation
                </button>
              )}
              {implementationStatus === 'in_progress' && (
                <button
                  onClick={() => onCompleteImplementation(recommendation.id)}
                  className="px-3 py-1 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BIRecommendationsWidgetProps {
  recommendations: BiRecommendation[];
  isLoading?: boolean;
  onAcknowledge: (id: string) => void;
  onStartImplementation: (id: string) => void;
  onCompleteImplementation: (id: string) => void;
  onRefresh?: () => void;
}

export const BIRecommendationsWidget: React.FC<BIRecommendationsWidgetProps> = ({
  recommendations,
  isLoading = false,
  onAcknowledge,
  onStartImplementation,
  onCompleteImplementation,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>(
    'all'
  );

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"
          />
        ))}
      </div>
    );
  }

  const filtered = recommendations.filter(rec => {
    if (filter === 'pending') return !rec.acknowledged && !rec.implementationStartedAt;
    if (filter === 'in_progress') return rec.implementationStartedAt && !rec.implementationCompletedAt;
    if (filter === 'completed') return rec.implementationCompletedAt;
    return true;
  });

  const stats = {
    total: recommendations.length,
    pending: recommendations.filter(
      r => !r.acknowledged && !r.implementationStartedAt
    ).length,
    inProgress: recommendations.filter(
      r => r.implementationStartedAt && !r.implementationCompletedAt
    ).length,
    completed: recommendations.filter(r => r.implementationCompletedAt).length,
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats.total}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
        </div>
        {stats.pending > 0 && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Pending</p>
          </div>
        )}
        {stats.inProgress > 0 && (
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">In Progress</p>
          </div>
        )}
        {stats.completed > 0 && (
          <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        {(['all', 'pending', 'in_progress', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === f
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            {f === 'all' && 'All'}
            {f === 'pending' && 'Pending Review'}
            {f === 'in_progress' && 'In Progress'}
            {f === 'completed' && 'Completed'}
          </button>
        ))}
      </div>

      {/* Recommendations List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all'
              ? 'No recommendations available yet. Run analysis to generate recommendations.'
              : `No ${filter.replace('_', ' ')} recommendations.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered
            .sort((a, b) => {
              const priorityOrder = { high: 0, medium: 1, low: 2 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .map(recommendation => (
              <BIRecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onAcknowledge={onAcknowledge}
                onStartImplementation={onStartImplementation}
                onCompleteImplementation={onCompleteImplementation}
              />
            ))}
        </div>
      )}
    </div>
  );
};
