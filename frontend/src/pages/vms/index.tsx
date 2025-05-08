import React, { useEffect } from 'react';

import axios from 'axios';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// Define types for VM data
interface VM {
  vmid: number;
  name: string;
  status: string;
  node: string;
  cpu: number;
  maxmem: number;
  maxdisk: number;
}

// Function to fetch VMs from the backend
const fetchVMs = async () => {
  const { data } = await axios.get('/api/vms'); // Adjust API endpoint if needed
  if (!data.success) {
    throw new Error(data.message || 'Failed to fetch VMs');
  }
  return data.data as VM[];
};

// Function to start a VM
const startVM = async ({ node, vmid }: { node: string; vmid: number }) => {
  const { data } = await axios.post(`/api/vms/${node}/${vmid}/start`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to start VM');
  }
  return data.data;
};

// Function to stop a VM
const stopVM = async ({ node, vmid }: { node: string; vmid: number }) => {
  const { data } = await axios.post(`/api/vms/${node}/${vmid}/stop`);
  if (!data.success) {
    throw new Error(data.message || 'Failed to stop VM');
  }
  return data.data;
};

const VMListPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch VM data
  const { data: vms, isLoading, error } = useQuery<VM[], Error>({
    queryKey: ['vms'],
    queryFn: fetchVMs,
    enabled: status === 'authenticated',
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  // Mutations for starting/stopping VMs
  const startMutation = useMutation({ 
    mutationFn: startVM, 
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vms'] }) 
  });
  const stopMutation = useMutation({ 
    mutationFn: stopVM, 
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vms'] }) 
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);

  if (status === 'loading' || isLoading) {
    return <div className="text-center p-10">Loading VMs...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error loading VMs: {error.message}</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Virtual Machines</h1>
      
      {/* Add VM Button (Optional) */}
      {/* <button className="mb-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">Add VM</button> */}

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Node</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vms?.map((vm) => (
              <tr key={vm.vmid}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vm.vmid}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vm.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${vm.status === 'running' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {vm.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vm.node}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vm.cpu} core(s)</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(vm.maxmem / (1024 * 1024 * 1024)).toFixed(1)} GB</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {vm.status !== 'running' && (
                    <button 
                      onClick={() => startMutation.mutate({ node: vm.node, vmid: vm.vmid })}
                      disabled={startMutation.isPending}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                  {vm.status === 'running' && (
                    <button 
                      onClick={() => stopMutation.mutate({ node: vm.node, vmid: vm.vmid })}
                      disabled={stopMutation.isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      Stop
                    </button>
                  )}
                  <Link href={`/vms/${vm.vmid}/console`} className="text-indigo-600 hover:text-indigo-900">
                    Console
                  </Link>
                  {/* Add other actions like Edit, Delete, etc. */}
                </td>
              </tr>
            )) ?? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No VMs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VMListPage;
