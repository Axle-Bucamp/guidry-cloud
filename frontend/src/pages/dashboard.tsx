import React, { useEffect } from 'react';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

import { useQuery } from '@tanstack/react-query';

import apiClient from '../lib/apiClient';

// Define types for the dashboard data
interface NodeResourceUsage {
  cpu: number;
  memory: { total: number; used: number; free: number; usagePercentage: number };
  swap: { total: number; used: number; free: number; usagePercentage: number };
  uptime: number;
  loadAverage: number[];
}

interface NodeInfo {
  name: string;
  status: string;
  resources: NodeResourceUsage | null;
}

interface CephStatus {
  health: { status: string };
  pgmap: { bytes_used: number; bytes_total: number };
  // Add other relevant CEPH fields if needed
}

interface DashboardData {
  cluster: { nodes: number; status: string };
  nodes: NodeInfo[];
  ceph: CephStatus | null;
}

// Function to fetch dashboard data from the backend
const fetchDashboardData = async () => {
  const { data } = await apiClient.get("/monitoring/dashboard"); // Adjust API endpoint if needed
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch dashboard data');
  }
  return data.data as DashboardData;
};

const DashboardPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch dashboard data using React Query
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData, Error>({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    enabled: status === 'authenticated', // Only fetch if authenticated
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return; // Wait until session status is determined
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error loading dashboard: {error.message}</div>;
  }

  if (!session) {
    // Should be redirected by useEffect, but render nothing just in case
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Cluster Overview */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Cluster Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Nodes</p>
            <p className="text-2xl font-bold">{dashboardData?.cluster?.nodes ?? 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Cluster Status</p>
            <p className={`text-2xl font-bold ${dashboardData?.cluster?.status === 'OK' ? 'text-green-500' : 'text-red-500'}`}>
              {dashboardData?.cluster?.status ?? 'N/A'}
            </p>
          </div>
          {dashboardData?.ceph && (
            <div>
              <p className="text-sm text-gray-500">Ceph Status</p>
              <p className={`text-2xl font-bold ${dashboardData.ceph.health.status === 'HEALTH_OK' ? 'text-green-500' : 'text-red-500'}`}>
                {dashboardData.ceph.health.status}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Node Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Node Status</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Node</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Load Avg</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData?.nodes?.map((node) => (
                <tr key={node.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{node.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${node.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.resources ? `${node.resources.cpu.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.resources ? `${node.resources.memory.usagePercentage.toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {node.resources ? node.resources.loadAverage.map(l => l.toFixed(2)).join(', ') : 'N/A'}
                  </td>
                </tr>
              )) ?? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No node data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add more dashboard widgets as needed, e.g., recent activity, resource summaries */}

    </div>
  );
};

export default DashboardPage;

