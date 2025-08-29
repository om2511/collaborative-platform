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
  ArrowDownIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  HeartIcon
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
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden hover:bg-white/80 transition-all duration-300">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-5 translate-x-5"></div>
      
      <div className="flex items-center relative">
        <div className="flex-shrink-0 p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-white/30 shadow-lg">
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-semibold text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs">{subtitle}</p>
          )}
        </div>
        {change !== undefined && (
          <div className="flex-shrink-0">
            <div className={`flex items-center px-3 py-1 rounded-full backdrop-blur-sm border shadow-sm ${
              trend === 'up' ? 'text-green-700 bg-green-100/80 border-green-200/50' : 
              trend === 'down' ? 'text-red-700 bg-red-100/80 border-red-200/50' : 
              'text-gray-700 bg-gray-100/80 border-gray-200/50'
            }`}>
              {trend === 'up' ? (
                <ArrowUpIcon className="h-4 w-4 mr-1" />
              ) : trend === 'down' ? (
                <ArrowDownIcon className="h-4 w-4 mr-1" />
              ) : null}
              <span className="text-sm font-bold">{change}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 relative">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-transparent rounded-full -translate-y-8 -translate-x-8"></div>
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-100/20 to-transparent rounded-full translate-y-6 translate-x-6"></div>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
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
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-100/30 to-transparent rounded-full -translate-y-6 translate-x-6"></div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative">
            <div className="p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 mr-3">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
            </div>
            Monthly Growth
          </h3>
          <div className="space-y-4 relative">
            <div className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">New Users This Month</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                {growth.newUsersThisMonth}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700">New Projects This Month</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                {growth.newProjectsThisMonth}
              </span>
            </div>
            <div className="pt-4 border-t border-white/30">
              <div className="text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/30">
                Growth rates are calculated based on total volumes
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-100/30 to-transparent rounded-full -translate-y-6 -translate-x-6"></div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative">
            <div className="p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 mr-3">
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </div>
            User Activity
          </h3>
          <div className="space-y-3 relative">
            <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
              <span className="text-sm font-medium text-gray-700">Active Users</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200/60 backdrop-blur-sm rounded-full h-2 mr-3 border border-gray-300/30">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full shadow-sm"
                    style={{ 
                      width: `${(overview.activeUsers / overview.totalUsers) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {((overview.activeUsers / overview.totalUsers) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
              <span className="text-sm font-medium text-gray-700">Active Projects</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200/60 backdrop-blur-sm rounded-full h-2 mr-3 border border-gray-300/30">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-indigo-500 h-2 rounded-full shadow-sm"
                    style={{ 
                      width: `${(overview.activeProjects / overview.totalProjects) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {((overview.activeProjects / overview.totalProjects) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30">
              <span className="text-sm font-medium text-gray-700">Task Completion</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200/60 backdrop-blur-sm rounded-full h-2 mr-3 border border-gray-300/30">
                  <div
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full shadow-sm"
                    style={{ width: `${overview.taskCompletionRate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-bold text-gray-900">
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
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-purple-100/30 to-transparent rounded-full -translate-y-5 translate-x-5"></div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative">
            <div className="p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 mr-3">
              <UsersIcon className="h-5 w-5 text-purple-600" />
            </div>
            Users by Role
          </h3>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 p-2">
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
        </div>

        {/* Projects by Status */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full translate-y-5 -translate-x-5"></div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative">
            <div className="p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 mr-3">
              <FolderIcon className="h-5 w-5 text-blue-600" />
            </div>
            Projects by Status
          </h3>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 p-2">
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
        </div>

        {/* Tasks by Status */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-orange-100/30 to-transparent rounded-full -translate-y-5 -translate-x-5"></div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative">
            <div className="p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 mr-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
            </div>
            Tasks by Status
          </h3>
          <div className="bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 p-2">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tasksByStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255, 255, 255, 0.3)', borderRadius: '12px' }} />
                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-100/20 to-transparent rounded-full -translate-y-8 translate-x-8"></div>
        
        <div className="px-6 py-4 border-b border-white/30 bg-white/30 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <div className="p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 mr-3">
              <UsersIcon className="h-5 w-5 text-green-600" />
            </div>
            Recent New Users
          </h3>
        </div>
        <div className="divide-y divide-white/30">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/30 inline-block mb-4">
                <UsersIcon className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <p className="font-medium">No recent user activity</p>
            </div>
          ) : (
            recentActivity.slice(0, 10).map((user, index) => (
              <div key={index} className="p-6 flex items-center space-x-4 hover:bg-white/50 backdrop-blur-sm transition-all duration-200">
                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-lg border border-white/30">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-600 truncate">
                    {user.email}
                  </p>
                </div>
                <div className="flex-shrink-0 text-sm font-medium text-gray-700 bg-white/50 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/30">
                  {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-indigo-100/20 to-transparent rounded-full -translate-y-10 -translate-x-10"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-100/20 to-transparent rounded-full translate-y-8 translate-x-8"></div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center relative">
          <div className="p-2 bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 mr-3">
            <HeartIcon className="h-5 w-5 text-red-600" />
          </div>
          System Health Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="text-center bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 p-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              {((overview.activeUsers / overview.totalUsers) * 100).toFixed(1)}%
            </div>
            <div className="text-sm font-bold text-gray-700">User Engagement</div>
            <div className="text-xs text-gray-500 mt-1">
              Active users ratio
            </div>
          </div>
          
          <div className="text-center bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 p-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {((overview.activeProjects / overview.totalProjects) * 100).toFixed(1)}%
            </div>
            <div className="text-sm font-bold text-gray-700">Project Activity</div>
            <div className="text-xs text-gray-500 mt-1">
              Active projects ratio
            </div>
          </div>
          
          <div className="text-center bg-white/50 backdrop-blur-sm rounded-xl border border-white/30 p-4">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {overview.taskCompletionRate}%
            </div>
            <div className="text-sm font-bold text-gray-700">Task Completion</div>
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