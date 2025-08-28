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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  UsersIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

const TeamAnalytics = ({ data }) => {
  if (!data) return null;

  const { teamPerformance = [], projectStats = [], totalProjects = 0, activeProjects = 0 } = data;

  // Helper function to ensure numeric values
  const safeNumber = (value, defaultValue = 0) => {
    const num = Number(value);
    return isNaN(num) || !isFinite(num) ? defaultValue : num;
  };

  // Prepare chart data with comprehensive validation
  const teamProductivityData = teamPerformance.map(member => {
    const completed = safeNumber(member.completedTasks, 0);
    const total = safeNumber(member.totalTasks, 0);
    const avgTime = safeNumber(member.avgCompletionTime, 0);
    
    return {
      name: member.user?.name || 'Unknown User',
      completed: completed,
      total: total,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgTime: avgTime > 0 ? Math.round(avgTime / (1000 * 60 * 60 * 24)) : 0
    };
  }).filter(member => member.name !== 'Unknown User' || member.total > 0); // Filter out invalid entries

  const projectStatusData = projectStats.reduce((acc, project) => {
    const status = project.status || 'active';
    const existing = acc.find(item => item.name === status);
    if (existing) {
      existing.count = safeNumber(existing.count + 1, 1);
    } else {
      acc.push({ name: status.toUpperCase(), count: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  // Calculate team statistics with safe math
  const totalTasks = teamPerformance.reduce((sum, member) => sum + safeNumber(member.totalTasks, 0), 0);
  const totalCompleted = teamPerformance.reduce((sum, member) => sum + safeNumber(member.completedTasks, 0), 0);
  const teamCompletionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  const activeMembers = teamPerformance.filter(member => safeNumber(member.totalTasks, 0) > 0).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Team Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Team Members</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {safeNumber(teamPerformance.length, 0)}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">{safeNumber(activeMembers, 0)} active contributors</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Team Completion</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {safeNumber(teamCompletionRate, 0)}%
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">{safeNumber(totalCompleted, 0)} of {safeNumber(totalTasks, 0)} tasks completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {safeNumber(totalProjects, 0)}
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">{safeNumber(activeProjects, 0)} currently active</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Top Performer</p>
              <p className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                {teamProductivityData.length > 0 
                  ? (() => {
                      const topPerformer = teamProductivityData.reduce((top, member) => {
                        const memberRate = safeNumber(member.completionRate, 0);
                        const topRate = safeNumber(top.completionRate, 0);
                        return memberRate > topRate ? member : top;
                      }, teamProductivityData[0] || { name: 'N/A', completionRate: 0 });
                      return topPerformer.name;
                    })()
                  : 'N/A'
                }
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span className="truncate">Best completion rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Team Productivity */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Team Productivity</h3>
          {teamProductivityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={teamProductivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  fontSize={10} 
                  domain={[0, 'dataMax']}
                  allowDecimals={false}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#82ca9d" name="Completed Tasks" />
                <Bar dataKey="total" fill="#8884d8" name="Total Tasks" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              <p>No team data available</p>
            </div>
          )}
        </div>

        {/* Project Status Distribution */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Project Status Distribution</h3>
          {projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              <p>No project data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Completion Rate Chart */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Member Completion Rates</h3>
        {teamProductivityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamProductivityData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                domain={[0, 100]} 
                fontSize={10}
                allowDecimals={false}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={80} 
                fontSize={10} 
                tick={{ fontSize: 10 }} 
              />
              <Tooltip formatter={(value) => [`${safeNumber(value, 0)}%`, 'Completion Rate']} />
              <Bar dataKey="completionRate" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <p>No completion data available</p>
          </div>
        )}
      </div>

      {/* Team Performance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Team Performance</h3>
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
                  <span className="hidden sm:inline">Completion Rate</span>
                  <span className="sm:hidden">Rate</span>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="hidden sm:inline">Avg. Completion Time</span>
                  <span className="sm:hidden">Avg Time</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamProductivityData.length > 0 ? teamProductivityData.map((member, index) => (
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
                    {safeNumber(member.total, 0)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-green-600">
                    {safeNumber(member.completed, 0)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 sm:h-2 mr-2 max-w-16 sm:max-w-20">
                        <div
                          className="bg-green-500 h-1.5 sm:h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, safeNumber(member.completionRate, 0)))}%` }}
                        ></div>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600 flex-shrink-0">
                        {safeNumber(member.completionRate, 0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {safeNumber(member.avgTime, 0) > 0 ? `${safeNumber(member.avgTime, 0)}d` : 'N/A'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No team performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Team Projects</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {projectStats.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <FolderIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No projects found</p>
            </div>
          ) : (
            projectStats.map((project, index) => (
              <div key={index} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FolderIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {project.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Team size: {project.teamSize}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{project.progress}% complete</p>
                      <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamAnalytics;