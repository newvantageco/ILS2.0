/**
 * UX Flows Documentation Platform
 * 
 * Interactive viewer for all user flows in ILS 2.0
 * Provides searchable, filterable documentation with live status tracking
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText,
  TrendingUp,
  Users,
  Zap,
  ExternalLink,
  ChevronRight,
  BarChart
} from 'lucide-react';

// Flow status types
type FlowStatus = 'completed' | 'broken' | 'in_progress' | 'planned';
type FlowPriority = 'critical' | 'high' | 'standard';

interface UserFlow {
  id: string;
  number: number;
  title: string;
  description: string;
  status: FlowStatus;
  priority: FlowPriority;
  roles: string[];
  entryPoints: string[];
  successCriteria: string[];
  documentPath: string;
  implementationProgress: number;
  lastUpdated: string;
  metrics?: {
    completionRate?: number;
    errorRate?: number;
    avgTime?: string;
  };
  relatedFeatures?: string[];
  codeReferences?: string[];
}

// All 15 user flows
const allFlows: UserFlow[] = [
  {
    id: 'ai-assistant',
    number: 1,
    title: 'AI Assistant Interaction',
    description: 'User interacts with AI Assistant to get business insights and answers',
    status: 'broken',
    priority: 'critical',
    roles: ['ECP', 'Lab', 'Dispenser', 'Supplier', 'Admin'],
    entryPoints: ['Dashboard AI button', '/ai-assistant route', 'Keyboard shortcut'],
    successCriteria: [
      'AI Assistant loads without errors',
      'Learning progress displays',
      'User can ask and receive answers',
      'Conversation persists'
    ],
    documentPath: '/docs/ux/flows/01_ai_assistant_interaction.md',
    implementationProgress: 85,
    lastUpdated: '2025-11-29',
    metrics: {
      completionRate: 0,
      errorRate: 100,
      avgTime: 'N/A'
    },
    relatedFeatures: ['/ai-assistant'],
    codeReferences: [
      'server/services/AIAssistantService.ts',
      'server/routes.ts (5175-5330)'
    ]
  },
  {
    id: 'eye-examination',
    number: 2,
    title: 'ECP Eye Examination',
    description: '6-step wizard for comprehensive eye examination and prescription generation',
    status: 'completed',
    priority: 'critical',
    roles: ['ECP', 'Optometrist', 'Ophthalmologist'],
    entryPoints: ['Patient dashboard → New Examination', 'Appointments → Start Exam', 'Quick Examination shortcut'],
    successCriteria: [
      'All 6 steps completed',
      'Prescription generated and saved',
      'Patient record updated',
      'Ready for dispensing'
    ],
    documentPath: '/docs/ux/flows/02_ecp_eye_examination.md',
    implementationProgress: 100,
    lastUpdated: '2025-11-29',
    metrics: {
      completionRate: 95,
      errorRate: 2,
      avgTime: '15-20 min'
    },
    relatedFeatures: ['/eye-test'],
    codeReferences: [
      'client/src/pages/EyeTest.tsx',
      'client/src/components/WizardStepper.tsx'
    ]
  },
  {
    id: 'order-placement',
    number: 3,
    title: 'Order Placement & Lab Routing',
    description: 'Place orders, route to labs, track fulfillment',
    status: 'planned',
    priority: 'critical',
    roles: ['Dispenser', 'ECP'],
    entryPoints: ['Patient record → New Order', 'Frame selection → Place Order'],
    successCriteria: [
      'Order created with all details',
      'Lab selected and notified',
      'Tracking enabled',
      'Patient notified'
    ],
    documentPath: '/docs/ux/flows/03_order_placement.md',
    implementationProgress: 0,
    lastUpdated: '2025-11-29'
  },
  {
    id: 'patient-checkin',
    number: 4,
    title: 'Patient Check-in & Registration',
    description: 'Register new patients or check-in returning patients',
    status: 'planned',
    priority: 'critical',
    roles: ['ECP', 'Receptionist'],
    entryPoints: ['Dashboard → New Patient', 'Appointments → Check In'],
    successCriteria: [
      'Patient demographics captured',
      'Insurance verified',
      'Medical history recorded',
      'Appointment created'
    ],
    documentPath: '/docs/ux/flows/04_patient_checkin.md',
    implementationProgress: 0,
    lastUpdated: '2025-11-29'
  },
  {
    id: 'lab-processing',
    number: 5,
    title: 'Lab Order Processing',
    description: 'Lab receives, processes, and fulfills orders',
    status: 'planned',
    priority: 'high',
    roles: ['Lab'],
    entryPoints: ['Lab dashboard → New Orders', 'Email notification'],
    successCriteria: [
      'Order received and reviewed',
      'Materials checked',
      'Processing started',
      'Completed and shipped'
    ],
    documentPath: '/docs/ux/flows/05_lab_order_processing.md',
    implementationProgress: 0,
    lastUpdated: '2025-11-29'
  },
  {
    id: 'cl-fitting',
    number: 6,
    title: 'Contact Lens Fitting',
    description: 'Specialized contact lens fitting workflow',
    status: 'planned',
    priority: 'high',
    roles: ['ECP', 'Optometrist'],
    entryPoints: ['Examination → CL Fitting', 'Patient record → CL Order'],
    successCriteria: [
      'Keratometry completed',
      'Trial lenses fitted',
      'Comfort assessed',
      'CL prescription generated'
    ],
    documentPath: '/docs/ux/flows/06_contact_lens_fitting.md',
    implementationProgress: 0,
    lastUpdated: '2025-11-29'
  },
  // Add remaining flows 7-15 as planned
];

const UXFlows: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FlowStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<FlowPriority | 'all'>('all');
  const [selectedFlow, setSelectedFlow] = useState<UserFlow | null>(null);

  // Filter and search flows
  const filteredFlows = useMemo(() => {
    return allFlows.filter(flow => {
      const matchesSearch = flow.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           flow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           flow.roles.some(r => r.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || flow.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || flow.priority === filterPriority;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [searchQuery, filterStatus, filterPriority]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = allFlows.length;
    const completed = allFlows.filter(f => f.status === 'completed').length;
    const broken = allFlows.filter(f => f.status === 'broken').length;
    const inProgress = allFlows.filter(f => f.status === 'in_progress').length;
    const avgProgress = Math.round(allFlows.reduce((sum, f) => sum + f.implementationProgress, 0) / total);
    
    return { total, completed, broken, inProgress, avgProgress };
  }, []);

  // Status badge component
  const StatusBadge: React.FC<{ status: FlowStatus }> = ({ status }) => {
    const configs = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Complete' },
      broken: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Broken' },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Progress' },
      planned: { color: 'bg-gray-100 text-gray-800', icon: FileText, label: 'Planned' }
    };
    
    const config = configs[status];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Priority badge
  const PriorityBadge: React.FC<{ priority: FlowPriority }> = ({ priority }) => {
    const configs = {
      critical: { color: 'bg-red-100 text-red-800', label: '🔴 Critical' },
      high: { color: 'bg-yellow-100 text-yellow-800', label: '🟡 High' },
      standard: { color: 'bg-blue-100 text-blue-800', label: '🟢 Standard' }
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${configs[priority].color}`}>
        {configs[priority].label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">UX User Flows</h1>
              <p className="mt-1 text-sm text-gray-600">
                Interactive documentation for all user journeys in ILS 2.0
              </p>
            </div>
            <Link
              to="/docs/ux/USER_FLOWS_INDEX.md"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <FileText className="w-4 h-4" />
              View Index
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <Users className="w-4 h-4" />
                Total Flows
              </div>
              <div className="mt-1 text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                Completed
              </div>
              <div className="mt-1 text-2xl font-bold text-green-700">{stats.completed}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Broken
              </div>
              <div className="mt-1 text-2xl font-bold text-red-700">{stats.broken}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <Clock className="w-4 h-4" />
                In Progress
              </div>
              <div className="mt-1 text-2xl font-bold text-blue-700">{stats.inProgress}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-600 text-sm">
                <TrendingUp className="w-4 h-4" />
                Avg Progress
              </div>
              <div className="mt-1 text-2xl font-bold text-purple-700">{stats.avgProgress}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search flows by name, description, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FlowStatus | 'all')}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="broken">Broken</option>
              <option value="in_progress">In Progress</option>
              <option value="planned">Planned</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as FlowPriority | 'all')}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="standard">Standard</option>
            </select>
          </div>
        </div>

        {/* Flow List */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFlows.map(flow => (
            <div
              key={flow.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedFlow(flow)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500">
                        #{flow.number.toString().padStart(2, '0')}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {flow.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{flow.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>

                {/* Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge status={flow.status} />
                  <PriorityBadge priority={flow.priority} />
                </div>

                {/* Roles */}
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-1">Roles:</div>
                  <div className="flex flex-wrap gap-1">
                    {flow.roles.map(role => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Implementation Progress</span>
                    <span className="font-semibold">{flow.implementationProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        flow.implementationProgress === 100
                          ? 'bg-green-600'
                          : flow.implementationProgress > 50
                          ? 'bg-blue-600'
                          : 'bg-yellow-600'
                      }`}
                      style={{ width: `${flow.implementationProgress}%` }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                {flow.metrics && (
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-gray-500">Completion</div>
                      <div className="font-semibold">{flow.metrics.completionRate}%</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-gray-500">Errors</div>
                      <div className="font-semibold">{flow.metrics.errorRate}%</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-gray-500">Avg Time</div>
                      <div className="font-semibold">{flow.metrics.avgTime}</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Link
                    to={flow.documentPath}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FileText className="w-4 h-4" />
                    View Docs
                  </Link>
                  {flow.relatedFeatures && flow.relatedFeatures[0] && (
                    <Link
                      to={flow.relatedFeatures[0]}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Zap className="w-4 h-4" />
                      Try It
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredFlows.length === 0 && (
          <div className="mt-12 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No flows found</h3>
            <p className="mt-2 text-sm text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Flow Detail Modal (to be implemented) */}
      {selectedFlow && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedFlow(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">{selectedFlow.title}</h2>
              <p className="text-gray-600 mb-4">{selectedFlow.description}</p>
              
              {/* Add more detailed flow visualization here */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Full flow diagram and documentation coming soon...
                </p>
              </div>
              
              <button
                onClick={() => setSelectedFlow(null)}
                className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UXFlows;
