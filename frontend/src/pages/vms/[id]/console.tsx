import React from 'react';

import { useRouter } from 'next/router';

import { useQuery } from '@tanstack/react-query';

import Layout from '../../../components/layout/Layout';
import NoVNC
  from '../../../components/NoVNC'; // Assuming NoVNC.tsx is in components
import apiClient from '../../../lib/apiClient';

// Define types (adjust based on actual API responses)
interface VNCDetails {
  port: number;
  ticket: string;
  websocketUrl: string; // Added by backend service
  // Add other fields if needed (e.g., node, vmid)
}

interface VMConfig {
  name: string;
  node: string; // Need node name to fetch VNC details
  // Add other config details if needed
}

const fetchVMConfig = async (node: string | undefined, vmid: string | undefined): Promise<VMConfig | null> => {
  if (!node || !vmid) return null;
  try {
    // Assuming a backend endpoint exists to get basic VM info including its node
    // Option 1: Get full VM list and filter (less efficient)
    // Option 2: Have a dedicated endpoint /api/vms/details/:vmid (better)
    // Option 3: Get config which includes node (if backend provides it)
    // Let's assume we have an endpoint like /api/vms/:node/:vmid/config that returns node info
    // For now, we might need to fetch the node list first or pass node via query param
    // Placeholder: Fetching config directly
    const { data } = await apiClient.get(`/vms/${node}/${vmid}/config`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch VM config');
    }
    // Assuming config response includes node name
    return { ...data.data, node: node }; // Add node explicitly if not in response
  } catch (error) {
    console.error("Error fetching VM config:", error);
    // If config fails, we might not know the node. Handle this case.
    return null;
  }
};

const fetchVNCDetails = async (node: string | undefined, vmid: string | undefined): Promise<VNCDetails | null> => {
  if (!node || !vmid) return null;
  try {
    const { data } = await apiClient.post(`/vnc/${node}/${vmid}`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch VNC details');
    }
    return data.data as VNCDetails;
  } catch (error) {
    console.error("Error fetching VNC details:", error);
    return null;
  }
};

const VMConsolePage: React.FC = () => {
  const router = useRouter();
  const { id, node } = router.query; // Get VM ID and potentially node from query params
  const vmid = Array.isArray(id) ? id[0] : id;
  const nodeName = Array.isArray(node) ? node[0] : node; // Use node from query if available

  // Fetch VM Config/Details (including node name if not in query)
  // We need the node name to fetch VNC details. If not in query, fetch it first.
  const { data: vmConfig, isLoading: isLoadingConfig, error: configError } = useQuery<VMConfig | null, Error>({
    queryKey: ['vmConfig', nodeName, vmid],
    queryFn: () => fetchVMConfig(nodeName, vmid),
    enabled: !!vmid && !!nodeName, // Only run if vmid and nodeName are available
  });

  // Fetch VNC Details once we have the node name and VM ID
  const { data: vncDetails, isLoading: isLoadingVNC, error: vncError } = useQuery<VNCDetails | null, Error>({
    queryKey: ['vncDetails', vmConfig?.node, vmid],
    queryFn: () => fetchVNCDetails(vmConfig?.node, vmid),
    enabled: !!vmConfig?.node && !!vmid, // Only fetch when node and vmid are known
    retry: false, // Don't retry if fetching ticket fails
    refetchOnWindowFocus: false, // Avoid refetching ticket on focus
  });

  const isLoading = isLoadingConfig || (!!vmConfig && isLoadingVNC);
  const error = configError || vncError;

  return (
    <Layout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">VNC Console - VM {vmid}</h1>
        {vmConfig && <p className="text-gray-600">Node: {vmConfig.node}</p>}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4">Loading VNC connection details...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error.message}</span>
        </div>
      )}

      {!isLoading && !error && vncDetails && (
        <div className="bg-black rounded-lg shadow-lg overflow-hidden" style={{ height: '70vh' }}>
          <NoVNC url={vncDetails.websocketUrl} ticket={vncDetails.ticket} />
        </div>
      )}

      {!isLoading && !error && !vncDetails && vmConfig && (
         <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Connection Failed!</strong>
          <span className="block sm:inline"> Could not retrieve VNC connection details. The VM might not be running or VNC might be disabled.</span>
        </div>
      )}
    </Layout>
  );
};

export default VMConsolePage;

