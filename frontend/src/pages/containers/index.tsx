import React, {
  useEffect,
  useState,
} from 'react';

import {
  Box,
  Edit,
  Play,
  Square,
  Terminal,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Layout from '../../components/layout/Layout';

interface Container {
  id: number;
  name: string;
  status: 'running' | 'stopped';
  node: string;
  cpu: number;
  memory: number;
  disk: number;
  template: string;
  ip: string;
}

const Containers: React.FC = () => {
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const user = {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  };

  const mockContainers: Container[] = [
    {
      id: 200,
      name: 'db-container-01',
      status: 'running',
      node: 'pve',
      cpu: 2,
      memory: 1024,
      disk: 16,
      template: 'Debian 12',
      ip: '192.168.1.201',
    },
    {
      id: 201,
      name: 'cache-container-02',
      status: 'running',
      node: 'pve',
      cpu: 1,
      memory: 512,
      disk: 8,
      template: 'Alpine 3.16',
      ip: '192.168.1.202',
    },
    {
      id: 202,
      name: 'dev-container-03',
      status: 'stopped',
      node: 'pve',
      cpu: 2,
      memory: 2048,
      disk: 32,
      template: 'Ubuntu 22.04',
      ip: '-',
    },
  ];

  const [containerInfo, setContainerInfo] = useState<typeof mockContainers[0] | null>(null);

  useEffect(() => {
    const { id } = router.query;
    if (id) {
      const numericId = parseInt(Array.isArray(id) ? id[0] : id, 10);
      const container = mockContainers.find(c => c.id === numericId);
      if (container) {
        setContainerInfo(container);
      }

      // Simulate API call to get terminal connection infos
      // fetchTerminalInfo();
    }
  }, [router.query]);

  const handleStartContainer = (id: number) => {
    console.log(`Starting container ${id}`);
    setContainers(prev =>
      prev.map(container =>
        container.id === id ? { ...container, status: 'running' } : container
      )
    );
  };

  const handleStopContainer = (id: number) => {
    console.log(`Stopping container ${id}`);
    setContainers(prev =>
      prev.map(container =>
        container.id === id ? { ...container, status: 'stopped' } : container
      )
    );
  };

  const handleDeleteContainer = (id: number) => {
    if (window.confirm('Are you sure you want to delete this container?')) {
      console.log(`Deleting container ${id}`);
      setContainers(prev => prev.filter(container => container.id !== id));
    }
  };

  const handleOpenConsole = (id: number) => {
    router.push(`/containers/${id}/console`);
  };

  const handleLogout = () => {
    // Clear any session or authentication tokens here
    localStorage.removeItem('authToken'); // Example of clearing auth token
    sessionStorage.clear(); // Example of clearing session storage

    // Redirect user to login page
    router.push('/login');
  };

  return (
    <Layout user={user} onLogout={handleLogout}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">LXC Containers</h1>
          <p className="text-gray-600">Manage your LXC containers</p>
        </div>
        <Link
          href="/containers/create"
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
        >
          Create Container
        </Link>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Name',
                  'Status',
                  'Node',
                  'Resources',
                  'Template',
                  'IP Address',
                  'Actions',
                ].map(header => (
                  <th
                    key={header}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {containers.map(container => (
                <tr key={container.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Box className="h-5 w-5 text-gray-500 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{container.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        container.status === 'running'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {container.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{container.node}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {container.cpu} CPU, {container.memory} MB, {container.disk} GB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{container.template}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{container.ip}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {container.status === 'stopped' ? (
                        <button
                          onClick={() => handleStartContainer(container.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Start Container"
                        >
                          <Play className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStopContainer(container.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Stop Container"
                        >
                          <Square className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenConsole(container.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Open Console"
                      >
                        <Terminal className="h-5 w-5" />
                      </button>
                      <Link
                        href={`/containers/${container.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit Container"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteContainer(container.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Container"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default Containers;
