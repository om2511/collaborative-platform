import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  CheckCircleIcon,
  ClockIcon,
  PlayIcon,
  FolderIcon,
  LightBulbIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const DashboardAnalytics = ({ data }) => {
  if (!data) return null;

  const { userTaskStats, recentTasks, recentIdeas, upcomingDeadlines, projectCount, activeProjects } = data;

  // Prepare chart data
  const taskStatusData = userTaskStats.map(item => ({
    name: item._id.replace('_', ' ').toUpperCase(),
    count: item.count
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  const totalTasks = userTaskStats.reduce((sum, item) => sum + item.count, 0);
  const completedTasks = userTaskStats.find(item => item._id === 'done')?.count || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Task Completion</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {completionRate}%
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">{completedTasks} of {totalTasks} tasks completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Active Projects</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {activeProjects}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">Out of {projectCount} total projects</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <LightBulbIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Recent Ideas</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {recentIdeas.length}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">Ideas contributed recently</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Upcoming Deadlines</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {upcomingDeadlines.length}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">Tasks due this week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Task Status Distribution */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">My Task Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={taskStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {taskStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Project Activity */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Project Activity</h3>
          <div className="space-y-4">
            {activeProjects === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <FolderIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">No active projects</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 sm:h-64">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">
                    {activeProjects}
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Active Projects</p>
                  <div className="mt-4 text-xs sm:text-sm text-gray-500">
                    Contributing to {projectCount} total projects
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Tasks</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTasks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent tasks</p>
            </div>
          ) : (
            recentTasks.slice(0, 5).map((task, index) => (
              <div key={index} className="p-6 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {task.status === 'done' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : task.status === 'in_progress' ? (
                    <PlayIcon className="h-5 w-5 text-blue-500" />
                  ) : (
                    <ClockIcon className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {task.project?.name || 'Unknown Project'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    task.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Deadlines</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingDeadlines.map((task, index) => (
              <div key={index} className="p-6 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </p>
                  <p className="text-sm text-gray-500">
                    {task.project?.name || 'Unknown Project'}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm text-red-600 font-medium">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Due {Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAnalytics;