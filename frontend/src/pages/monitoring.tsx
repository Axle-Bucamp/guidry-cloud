// Define types for RRD data (adjust based on actual API response)
interface RRDDataPoint {
  time: number; // Assuming timestamp
  value: number | null;
}

interface RRDDataSet {
  [key: string]: RRDDataPoint[]; // e.g., cpu: [...], memory: [...]
}

// Function to fetch RRD data
const fetchRRDData = async (node: string, timeframe: string): Promise<RRDDataSet | null> => {
  if (node === 'all') {
    // Need to decide how to handle 'all' nodes - maybe fetch for each and aggregate?
    // For now, return null or fetch for the first node as an example.
    // Let's fetch for the first node in the mock list for now.
    const firstNode = 'pve'; // Replace with dynamic logic if needed
    console.warn("Fetching RRD data for 'all' nodes is not fully implemented, fetching for", firstNode);
    const { data } = await apiClient.get(`/monitoring/rrd?node=${firstNode}&timeframe=${timeframe}&type=node`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch RRD data');
    }
    return data.data;
  } else {
    const { data } = await apiClient.get(`/monitoring/rrd?node=${node}&timeframe=${timeframe}&type=node`);
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch RRD data');
    }
    return data.data;
  }
};

const Monitoring: React.FC = () => {
  const router = useRouter();
  // Remove mock loading/error states, useQuery handles this
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('hour'); // Default to hour
  const [selectedNode, setSelectedNode] = useState('pve'); // Default to first node

  // Mock user data - in a real app, this would come from an authentication context or session
  const user = {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin'
  };

  // Fetch node list (replace mock with API call if needed, or pass from dashboard)
  const { data: nodesData, isLoading: isLoadingNodes } = useQuery({
    queryKey: ['nodesList'],
    queryFn: async () => {
      const { data } = await apiClient.get('/nodes');
      if (!data.success) throw new Error('Failed to fetch nodes');
      return data.data as { node: string }[]; // Assuming API returns { node: string }[]
    },
    initialData: [{ node: 'pve' }, { node: 'pve2' }] // Keep mock as initial data
  });
  const nodes = nodesData || [];

  // Fetch RRD data using React Query
  const { data: rrdData, isLoading, error } = useQuery<RRDDataSet | null, Error>({
    queryKey: ['rrdData', selectedNode, timeRange],
    queryFn: () => fetchRRDData(selectedNode, timeRange),
    enabled: !!selectedNode, // Only fetch if a node is selected
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // Remove mock data generation
  // const generateTimeSeriesData = ...
  // const getChartData = ...

  // Remove simulated API call
  // useEffect(() => { ... }, [timeRange, selectedNode]);

  const handleLogout = () => {
    // Handle logout logic here (e.g., using next-auth signOut)
    router.push('/login');
  };

  // Process fetched RRD data for charts
  const processRRDDataForChart = (dataSet: RRDDataPoint[] | undefined) => {
    if (!dataSet) return { labels: [], data: [] };
    const labels = dataSet.map(dp => new Date(dp.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    // Assuming RRD data might be in bytes for memory/disk, convert to % if needed
    // Assuming CPU is already a percentage or fraction * 100
    // Handle null values
    const data = dataSet.map(dp => dp.value !== null ? Math.max(0, Math.min(100, dp.value)) : 0); // Clamp between 0-100, replace null with 0
    return { labels, data };
  };

  const cpuChartProcessed = processRRDDataForChart(rrdData?.cpu);
  const memoryChartProcessed = processRRDDataForChart(rrdData?.mem); // Assuming 'mem' key from API
  const diskChartProcessed = processRRDDataForChart(rrdData?.disk); // Assuming 'disk' key from API
  const networkChartProcessed = processRRDDataForChart(rrdData?.netin); // Assuming 'netin' key from API

  // Chart options (remain mostly the same)
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        min: 0,
        // max: 100, // Let chart auto-scale y-axis based on data, or adjust based on metric type
        ticks: {
          // callback: function(value) {
          //   return value + '%'; // Only add % if data is actually percentage
          // }
        }
      }
    },
    maintainAspectRatio: false,
  };

  // Update Chart data to use processed RRD data
  const cpuChartData = {
    labels: cpuChartProcessed.labels,
    datasets: [
      {
        label: 'CPU Usage',
        data: cpuChartProcessed.data,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  const memoryChartData = {
    labels: memoryChartProcessed.labels,
    datasets: [
      {
        label: 'Memory Usage', // Might need conversion from bytes
        data: memoryChartProcessed.data,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const diskChartData = {
    labels: diskChartProcessed.labels,
    datasets: [
      {
        label: 'Disk I/O', // RRD data is likely IOPS or throughput, not percentage usage
        data: diskChartProcessed.data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const networkChartData = {
    labels: networkChartProcessed.labels,
    datasets: [
      {
        label: 'Network In', // RRD data is likely bytes/sec
        data: networkChartProcessed.data,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      },
      // Optionally add 'netout' if available
    ],
  };

  // TODO: Fetch CEPH data from dashboard endpoint or dedicated endpoint
  // For now, keep mock CEPH data
  const cephData = {
    labels: ['Used', 'Available'],
    datasets: [
      {
        label: 'Storage',
        data: [38, 62],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgb(255, 99, 132)',
          'rgb(75, 192, 192)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const cephOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'CEPH Storage Usage (%)',
      },
    },
    maintainAspectRatio: false,
  };

  // Update Layout props if needed (remove mock user/logout)
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Monitoring</h1>
        <p className="text-gray-600">System performance and resource usage</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
             <option value="year">Last Year</option> {/* Match API timeframes */}
          </select>
        </div>
        <div>
          <label htmlFor="node" className="block text-sm font-medium text-gray-700 mb-1">Node</label>
          <select
            id="node"
            value={selectedNode}
            onChange={(e) => setSelectedNode(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            disabled={isLoadingNodes}
          >
            {/* <option value="all">All Nodes</option> */}{/* Removed 'all' until implemented */}
            {nodes.map(node => (
              <option key={node.node} value={node.node}>{node.node}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading || isLoadingNodes ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error.message}</span>
        </div>
      ) : !rrdData ? (
         <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">No Data!</strong>
          <span className="block sm:inline"> No monitoring data available for the selected node and time range.</span>
        </div>
      ) : (
        <>
          {/* Resource Usage Overview - Needs data from node status, not RRD */}
          {/* Consider fetching node status here or removing this section */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"> ... </div> */}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">CPU Usage Over Time</h3>
              <div className="h-80">
                <Line options={lineChartOptions} data={cpuChartData} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Usage Over Time</h3>
              <div className="h-80">
                <Line options={lineChartOptions} data={memoryChartData} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Disk I/O Over Time</h3>
              <div className="h-80">
                <Line options={lineChartOptions} data={diskChartData} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Network In Over Time</h3>
              <div className="h-80">
                <Line options={lineChartOptions} data={networkChartData} />
              </div>
            </div>
          </div>

          {/* CEPH Storage - TODO: Fetch real data */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">CEPH Storage</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="col-span-1">
                <div className="h-60">
                  <Bar options={cephOptions} data={cephData} />
                </div>
              </div>
              <div className="col-span-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">CEPH Status (Mock Data)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Health</span>
                      <span className="font-medium text-green-600">HEALTH_OK</span>
                    </div>
                    {/* ... other mock ceph details ... */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data</span>
                      <span className="font-medium">3.8 TB / 10 TB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default Monitoring;
