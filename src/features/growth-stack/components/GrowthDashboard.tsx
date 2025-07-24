import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Activity, 
  Zap,
  AlertCircle,
  Filter,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

import { useGrowthStore } from '../store/growthStore';
import { TimePeriod, UserSegment } from '../types';

interface GrowthDashboardProps {
  className?: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' }
];

const SEGMENT_OPTIONS: { value: UserSegment; label: string }[] = [
  { value: 'new_users', label: 'New Users' },
  { value: 'returning_users', label: 'Returning Users' },
  { value: 'power_users', label: 'Power Users' },
  { value: 'at_risk_users', label: 'At Risk Users' },
  { value: 'churned_users', label: 'Churned Users' }
];

export function GrowthDashboard({ className = '' }: GrowthDashboardProps) {
  const {
    // State
    engagementMetrics,
    userSegments,
    experiments,
    growthMetrics,
    growthInsights,
    selectedTimePeriod,
    selectedSegment,
    dashboardLoading,
    error,
    
    // Actions
    setTimePeriod,
    setSelectedSegment,
    refreshDashboard,
    loadEngagementMetrics,
    loadUserSegments,
    loadGrowthMetrics,
    loadGrowthInsights,
    setError
  } = useGrowthStore();

  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize dashboard
  useEffect(() => {
    refreshDashboard();
  }, []);

  // Auto refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshDashboard();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshDashboard]);

  // Load data when period changes
  useEffect(() => {
    loadEngagementMetrics(selectedTimePeriod);
    loadGrowthMetrics(selectedTimePeriod);
  }, [selectedTimePeriod]);

  const currentMetrics = engagementMetrics[selectedTimePeriod] || {};
  const runningExperiments = experiments.filter(exp => exp.status === 'running');
  const completedExperiments = experiments.filter(exp => exp.status === 'completed');

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/growth/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: selectedTimePeriod,
          segment: selectedSegment,
          includeExperiments: true,
          includeEngagement: true
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `growth-data-${selectedTimePeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: unknown) {
      setError('Failed to export data');
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    description 
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ElementType;
    color?: string;
    description?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-sm ${
            change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-600">{title}</p>
      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}
    </motion.div>
  );

  const InsightCard = ({ insight }: { insight: any }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-lg border-l-4 ${
        insight.type === 'opportunity' ? 'border-green-500 bg-green-50' :
        insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
        'border-blue-500 bg-blue-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              insight.impact === 'high' ? 'bg-red-100 text-red-700' :
              insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {insight.impact} impact
            </span>
            <span className="text-xs text-gray-500">
              Priority: {insight.priority}
            </span>
          </div>
        </div>
        <Info className="w-5 h-5 text-gray-400" />
      </div>
    </motion.div>
  );

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            refreshDashboard();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Growth Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor key growth metrics and experiments</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={refreshDashboard}
            disabled={dashboardLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  value={selectedTimePeriod}
                  onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {PERIOD_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Segment
                </label>
                <select
                  value={selectedSegment || ''}
                  onChange={(e) => setSelectedSegment(e.target.value as UserSegment || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Users</option>
                  {SEGMENT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Refresh
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Every 5 minutes</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Daily Active Users"
          value={currentMetrics.dailyActiveUsers || 0}
          change={5.2}
          icon={Users}
          color="blue"
          description="Users who visited today"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${(currentMetrics.conversionRate || 0).toFixed(1)}%`}
          change={-2.1}
          icon={Target}
          color="green"
          description="Users who completed key actions"
        />
        <MetricCard
          title="Engagement Score"
          value={currentMetrics.engagementScore || 0}
          change={8.4}
          icon={Activity}
          color="purple"
          description="Overall user engagement level"
        />
        <MetricCard
          title="Active Experiments"
          value={runningExperiments.length}
          icon={Zap}
          color="orange"
          description="Currently running A/B tests"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segments Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Segments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(userSegments).map(([key, value]) => ({
                  name: key.replace('_', ' '),
                  value,
                  color: COLORS[Object.keys(userSegments).indexOf(key)]
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(userSegments).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Metrics Chart */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Experiments and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Experiments */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Experiments</h3>
          <div className="space-y-3">
            {runningExperiments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active experiments</p>
            ) : (
              runningExperiments.map((experiment) => (
                <motion.div
                  key={experiment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{experiment.name}</h4>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      Running
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{experiment.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Target: {experiment.target_metric}</span>
                    <span>Variants: {experiment.variants.length}</span>
                    <span>Traffic: {experiment.traffic_allocation}%</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Growth Insights */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Insights</h3>
          <div className="space-y-3">
            {growthInsights.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No insights available</p>
            ) : (
              growthInsights.slice(0, 3).map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {dashboardLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-gray-700">Loading dashboard...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}