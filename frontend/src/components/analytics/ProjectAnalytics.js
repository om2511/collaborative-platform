import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  XCircleIcon,
  UsersIcon,
  DocumentTextIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const ProjectAnalytics = ({ data, projectId }) => {
  if (!data) return null;

  const { projectInfo, taskStats, teamStats, ideaStats, documentStats } = data;

  // Prepare chart data
  const statusData = taskStats.byStatus.map(item => ({
    name: item._id.replace('_', ' ').toUpperCase(),
    count: item.count,
    tasks: item.tasks
  }));

  const priorityData = taskStats.byPriority.map(item => ({
    name: item._id.toUpperCase(),
    count: item.count
  }));

  const teamProductivityData = teamStats.map(member => ({
    name: member.user?.name || 'Unassigned',
    completed: member.completed,
    inProgress: member.inProgress,
    total: member.total,
    completionRate: member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0
  }));

  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'done':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <PlayIcon className="h-5 w-5 text-blue-500" />;
      case 'todo':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Project Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {taskStats.completionRate}%
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">{taskStats.completedTasks} of {taskStats.totalTasks} tasks completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Team Size</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {teamStats.length}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">Active team members</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <LightBulbIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Ideas</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {ideaStats.totalIdeas}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">Avg rating: {ideaStats.averageRating?.toFixed(1) || '0.0'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Documents</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {documentStats.reduce((sum, doc) => sum + doc.count, 0)}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">Various document types</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Task Status Distribution */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Task Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Task Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Productivity */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Team Productivity</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={teamProductivityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              fontSize={10}
              tick={{ fontSize: 10 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis fontSize={10} />
            <Tooltip />
            <Legend />
            <Bar dataKey="completed" stackId="a" fill="#82ca9d" name="Completed" />
            <Bar dataKey="inProgress" stackId="a" fill="#8884d8" name="In Progress" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Team Members Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Team Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Total Tasks</span>
                  <span className="sm:hidden">Total</span>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">Done</span>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">In Progress</span>
                  <span className="sm:hidden">Progress</span>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Completion Rate</span>
                  <span className="sm:hidden">Rate</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamProductivityData.map((member, index) => (
                <tr key={index}>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-6 w-6 sm:h-8 sm:w-8">
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 sm:ml-3">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[80px] sm:max-w-none">
                          {member.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {member.total}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-green-600">
                    {member.completed}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-blue-600">
                    {member.inProgress}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 sm:h-2 mr-2">
                        <div
                          className="bg-green-500 h-1.5 sm:h-2 rounded-full"
                          style={{ width: `${member.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">{member.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectAnalytics;