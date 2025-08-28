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
  AreaChart,
  Area
} from 'recharts';
import {
  UsersIcon,
  FolderIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const SystemAnalytics = ({ data }) => {
  if (!data) return null;

  const { overview, distributions, growth, recentActivity } = data;

  // Prepare chart data
  const usersByRoleData = distributions.usersByRole.map(item => ({
    name: item._id.toUpperCase(),
    count: item.count
  }));

  const projectsByStatusData = distributions.projectsByStatus.map(item => ({
    name: item._id.toUpperCase(),
    count: item.count
  }));

  const tasksByStatusData = distributions.tasksByStatus.map(item => ({
    name: item._id.replace('_', ' ').toUpperCase(),
    count: item.count
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  const MetricCard = ({ title, value, change, trend, icon: Icon, color, subtitle }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        {change !== undefined && (
          <div className="flex-shrink-0">
            <div className={`flex items-center ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trend === 'up' ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : trend === 'down' ? (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              ) : null}
              <span className="text-sm font-medium">{change}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={overview.totalUsers.toLocaleString()}
          change={overview.userGrowthRate}
          trend={overview.userGrowthRate > 0 ? 'up' : overview.userGrowthRate < 0 ? 'down' : 'neutral'}
          icon={UsersIcon}
          color="text-blue-500"
          subtitle={`${overview.activeUsers} active`}
        />
        
        <MetricCard
          title="Projects"
          value={overview.totalProjects.toLocaleString()}
          change={overview.projectGrowthRate}
          trend={overview.projectGrowthRate > 0 ? 'up' : overview.projectGrowthRate < 0 ? 'down' : 'neutral'}
          icon={FolderIcon}
          color="text-purple-500"
          subtitle={`${overview.activeProjects} active`}
        />
        
        <MetricCard
          title="Task Completion"
          value={`${overview.taskCompletionRate}%`}
          icon={CheckCircleIcon}
          color="text-green-500"
          subtitle={`${overview.completedTasks}/${overview.totalTasks} tasks`}
        />
        
        <MetricCard
          title="Ideas Generated"
          value={overview.totalIdeas.toLocaleString()}
          icon={LightBulbIcon}
          color="text-yellow-500"
        />
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Growth</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">New Users This Month</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {growth.newUsersThisMonth}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">New Projects This Month</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {growth.newProjectsThisMonth}
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500">
                Growth rates are calculated based on total volumes
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Users</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: `${(overview.activeUsers / overview.totalUsers) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {((overview.activeUsers / overview.totalUsers) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Projects</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${(overview.activeProjects / overview.totalProjects) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {((overview.activeProjects / overview.totalProjects) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Task Completion</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${overview.taskCompletionRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {overview.taskCompletionRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users by Role */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Users by Role</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={usersByRoleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {usersByRoleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Projects by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Projects by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={projectsByStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {projectsByStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks by Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tasksByStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent New Users</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent user activity</p>
            </div>
          ) : (
            recentActivity.slice(0, 10).map((user, index) => (
              <div key={index} className="p-6 flex items-center space-x-4">
                <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <UsersIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="flex-shrink-0 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">System Health Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {((overview.activeUsers / overview.totalUsers) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">User Engagement</div>
            <div className="text-xs text-gray-500 mt-1">
              Active users ratio
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {((overview.activeProjects / overview.totalProjects) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Project Activity</div>
            <div className="text-xs text-gray-500 mt-1">
              Active projects ratio
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {overview.taskCompletionRate}%
            </div>
            <div className="text-sm text-gray-600">Task Completion</div>
            <div className="text-xs text-gray-500 mt-1">
              Overall completion rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;