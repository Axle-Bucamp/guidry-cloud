const proxmox = require("../config/proxmox");

class ProxmoxService {
  async getNodes() {
    try {
      const nodes = await proxmox.nodes.$get();
      return nodes.data; // Return data property
    } catch (error) {
      console.error("Error fetching nodes:", error);
      throw new Error("Failed to fetch nodes from Proxmox API");
    }
  }

  async getNodeStatus(nodeName) {
    try {
      const status = await proxmox.nodes.$(nodeName).status.$get();
      return status.data; // Return data property
    } catch (error) {
      console.error(`Error fetching status for node ${nodeName}:`, error);
      throw new Error(`Failed to fetch status for node ${nodeName}`);
    }
  }

  async getVMs(nodeName) {
    try {
      const vms = await proxmox.nodes.$(nodeName).qemu.$get({ full: true });
      return vms.data; // Return data property
    } catch (error) {
      console.error(`Error fetching VMs for node ${nodeName}:`, error);
      throw new Error(`Failed to fetch VMs for node ${nodeName}`);
    }
  }

  async getContainers(nodeName) {
    try {
      const containers = await proxmox.nodes.$(nodeName).lxc.$get();
      return containers.data; // Return data property
    } catch (error) {
      console.error(`Error fetching containers for node ${nodeName}:`, error);
      throw new Error(`Failed to fetch containers for node ${nodeName}`);
    }
  }

  async getVMConfig(nodeName, vmid) {
    try {
      const config = await proxmox.nodes.$(nodeName).qemu.$(vmid).config.$get();
      return config.data; // Return data property
    } catch (error) {
      console.error(`Error fetching config for VM ${vmid} on node ${nodeName}:`, error);
      throw new Error(`Failed to fetch config for VM ${vmid}`);
    }
  }

  async getVNCProxy(nodeName, vmid) {
    try {
      const vncDataResponse = await proxmox.nodes.$(nodeName).qemu.$(vmid).vncproxy.$post();
      const vncData = vncDataResponse.data; // Extract data
      const wsHost = process.env.PROXMOX_API_URL.replace("https://", "").replace("/api2/json", "");
      const wsUrl = `wss://${wsHost}:${vncData.port}/`;
      return { ...vncData, websocketUrl: wsUrl };
    } catch (error) {
      console.error(`Error getting VNC proxy for VM ${vmid} on node ${nodeName}:`, error);
      throw new Error(`Failed to get VNC proxy for VM ${vmid}`);
    }
  }

  async getNodeRRDData(nodeName, timeFrame = 'hour') {
    try {
      const rrdData = await proxmox.nodes.$(nodeName).rrddata.$get({ timeframe: timeFrame });
      return rrdData.data; // Return data property
    } catch (error) {
      console.error(`Error fetching RRD data for node ${nodeName}:`, error);
      throw new Error(`Failed to fetch RRD data for node ${nodeName}`);
    }
  }

  async getClusterStatus() {
    try {
      const status = await proxmox.cluster.status.$get();
      return status.data; // Return data property
    } catch (error) {
      console.error("Error fetching cluster status:", error);
      throw new Error("Failed to fetch cluster status");
    }
  }

  async getCephStatus() {
    try {
      const status = await proxmox.cluster.ceph.status.$get();
      return status.data; // Return data property
    } catch (error) {
      if (error.response && error.response.status === 500) { // Check for actual HTTP status code
        console.warn("Ceph might not be configured or available (500 error).");
        return null;
      }
      console.error("Error fetching Ceph status:", error);
      throw new Error("Failed to fetch Ceph status");
    }
  }

  // New methods for VM/LXC creation and template/ISO listing

  async getStorages(nodeName) {
    try {
      const storages = await proxmox.nodes.$(nodeName).storage.$get();
      return storages.data;
    } catch (error) {
      console.error(`Error fetching storages for node ${nodeName}:`, error);
      throw new Error(`Failed to fetch storages for node ${nodeName}`);
    }
  }

  async getIsoImages(nodeName, storageName) {
    try {
      const content = await proxmox.nodes.$(nodeName).storage.$(storageName).content.$get({ content: 'iso' });
      return content.data;
    } catch (error) {
      console.error(`Error fetching ISO images from storage ${storageName} on node ${nodeName}:`, error);
      throw new Error(`Failed to fetch ISO images from storage ${storageName} on node ${nodeName}`);
    }
  }

  async getAllIsoImages(nodeName) {
    const storages = await this.getStorages(nodeName);
    let allIsos = [];
    if (storages) {
        for (const storage of storages) {
            if (storage.content && storage.content.includes('iso')) {
                try {
                    const isos = await this.getIsoImages(nodeName, storage.storage);
                    if (isos) {
                        allIsos = allIsos.concat(isos.map(iso => ({ ...iso, storage: storage.storage })));
                    }
                } catch (error) {
                    console.warn(`Could not fetch ISOs from storage ${storage.storage} on node ${nodeName}: ${error.message}`);
                }
            }
        }
    }
    return allIsos;
  }

  async getVmTemplates(nodeName) {
    try {
      const vms = await proxmox.nodes.$(nodeName).qemu.$get();
      if (vms.data) {
        const templates = vms.data.filter(vm => vm.template && parseInt(vm.template) === 1);
        return templates;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching VM templates on node ${nodeName}:`, error);
      throw new Error(`Failed to fetch VM templates on node ${nodeName}`);
    }
  }

  async getLxcTemplates(nodeName, storageName) {
    try {
      const content = await proxmox.nodes.$(nodeName).storage.$(storageName).content.$get({ content: 'vztmpl' });
      return content.data;
    } catch (error) {
      console.error(`Error fetching LXC templates from storage ${storageName} on node ${nodeName}:`, error);
      throw new Error(`Failed to fetch LXC templates from storage ${storageName} on node ${nodeName}`);
    }
  }

  async getAllLxcTemplates(nodeName) {
    const storages = await this.getStorages(nodeName);
    let allLxcTemplates = [];
    if (storages) {
        for (const storage of storages) {
            if (storage.content && storage.content.includes('vztmpl')) {
                try {
                    const templates = await this.getLxcTemplates(nodeName, storage.storage);
                    if (templates) {
                        allLxcTemplates = allLxcTemplates.concat(templates.map(tmpl => ({ ...tmpl, storage: storage.storage })));
                    }
                } catch (error) {
                    console.warn(`Could not fetch LXC templates from storage ${storage.storage} on node ${nodeName}: ${error.message}`);
                }
            }
        }
    }
    return allLxcTemplates;
  }

  async getNextVmid() {
    try {
      const nextId = await proxmox.cluster.nextid.$get();
      return nextId.data;
    } catch (error) {
      console.error("Error fetching next available VMID:", error);
      throw new Error("Failed to fetch next available VMID");
    }
  }

  async createVmFromTemplate(nodeName, templateVmid, newVmid, options = {}) {
    try {
      const cloneOptions = {
        newid: newVmid,
        name: options.name || `vm-${newVmid}`,
        full: options.fullClone ? 1 : 0,
        target: options.targetNode || nodeName,
        description: options.description,
        pool: options.pool,
        storage: options.storage, // Target storage for the new disk
        format: options.format, // e.g. qcow2, raw
        // Add other relevant clone options from Proxmox API documentation as needed
      };
      // Remove undefined options to avoid sending them as empty strings
      Object.keys(cloneOptions).forEach(key => cloneOptions[key] === undefined && delete cloneOptions[key]);

      const result = await proxmox.nodes.$(nodeName).qemu.$(templateVmid).clone.$post(cloneOptions);
      
      if (options.config) {
        // Ensure target node is correct if specified in cloneOptions
        const targetNodeForConfig = cloneOptions.target || nodeName;
        await proxmox.nodes.$(targetNodeForConfig).qemu.$(newVmid).config.$post(options.config);
      }
      // Optionally start the VM after creation
      if (options.start) {
        await proxmox.nodes.$(cloneOptions.target || nodeName).qemu.$(newVmid).status.start.$post();
      }
      return { vmid: newVmid, task: result.data, message: `VM ${newVmid} cloning initiated from template ${templateVmid}.` };
    } catch (error) {
      console.error(`Error creating VM from template ${templateVmid} on node ${nodeName}:`, error.response ? error.response.data : error);
      throw new Error(`Failed to create VM from template: ${error.response ? error.response.data.message || JSON.stringify(error.response.data.errors) : error.message}`);
    }
  }

  async createVmFromIso(nodeName, newVmid, isoPath, options = {}) {
    try {
      const vmConfig = {
        vmid: newVmid,
        name: options.name || `vm-${newVmid}`,
        memory: options.memory || 2048,
        cores: options.cores || 1,
        sockets: options.sockets || 1,
        ostype: options.ostype || 'l26',
        net0: options.net0 || 'virtio,bridge=vmbr0',
        ide2: `${isoPath},media=cdrom`,
        scsihw: options.scsihw || 'virtio-scsi-pci',
        boot: options.boot || 'order=ide2;ide0', // Assuming ide0 for disk, adjust if using virtio0 etc.
        // Disk configuration needs to be explicit, e.g., ide0 or sata0 or virtio0
        // Example: options.disk = "ide0:local-lvm,size=32G" or options.disk = "virtio0:local-lvm,size=32G"
        ...(options.disk && { [options.disk.split(':')[0]]: `${options.disk.split(':')[1]},size=${options.diskSize || '32G'}` }),
        ...options.additionalConfig,
      };
      if (!options.disk) {
        throw new Error("Disk configuration (e.g., 'ide0:local-lvm' or 'virtio0:local-lvm') and diskSize must be provided in options for ISO creation.");
      }

      const result = await proxmox.nodes.$(nodeName).qemu.$post(vmConfig);
      // Optionally start the VM after creation
      if (options.start) {
        await proxmox.nodes.$(nodeName).qemu.$(newVmid).status.start.$post();
      }
      return { vmid: newVmid, task: result.data, message: `VM ${newVmid} creation initiated from ISO ${isoPath}.` };
    } catch (error) {
      console.error(`Error creating VM ${newVmid} from ISO on node ${nodeName}:`, error.response ? error.response.data : error);
      throw new Error(`Failed to create VM from ISO: ${error.response ? error.response.data.message || JSON.stringify(error.response.data.errors) : error.message}`);
    }
  }

  async createLxcFromTemplate(nodeName, templatePath, newVmid, options = {}) {
    try {
      if (!options.password && !(options.unprivileged && options.pubkey)) {
        throw new Error("Password or (unprivileged and SSH public key) is required for LXC creation.");
      }
      const lxcConfig = {
        vmid: newVmid,
        ostemplate: templatePath, 
        hostname: options.hostname || `ct-${newVmid}`,
        password: options.password,
        memory: options.memory || 512,
        cores: options.cores || 1,
        net0: options.net0 || 'name=eth0,bridge=vmbr0,ip=dhcp',
        storage: options.storage || 'local-lvm', // Storage for rootfs volume, not the template storage
        rootfs: `${options.rootfsDiskSize || 8}`, // Just size, storage is separate param. e.g. 8 for 8GB
        unprivileged: options.unprivileged ? 1 : 0,
        pubkey: options.pubkey, // SSH public key
        features: options.features, // e.g., nesting=1
        onboot: options.onboot ? 1 : 0,
        ...options.additionalConfig,
      };
      // Remove undefined options
      Object.keys(lxcConfig).forEach(key => lxcConfig[key] === undefined && delete lxcConfig[key]);

      const result = await proxmox.nodes.$(nodeName).lxc.$post(lxcConfig);
      // Optionally start the container after creation
      if (options.start) {
        await proxmox.nodes.$(nodeName).lxc.$(newVmid).status.start.$post();
      }
      return { vmid: newVmid, task: result.data, message: `LXC ${newVmid} creation initiated from template ${templatePath}.` };
    } catch (error) {
      console.error(`Error creating LXC from template ${templatePath} on node ${nodeName}:`, error.response ? error.response.data : error);
      throw new Error(`Failed to create LXC from template: ${error.response ? error.response.data.message || JSON.stringify(error.response.data.errors) : error.message}`);
    }
  }

  async getTaskStatus(nodeName, taskId) {
    try {
      // GET /nodes/{node}/tasks/{upid}/status
      const status = await proxmox.nodes.$(nodeName).tasks.$(taskId).status.$get();
      return status.data;
    } catch (error) {
      console.error(`Error fetching status for task ${taskId} on node ${nodeName}:`, error);
      throw new Error(`Failed to fetch status for task ${taskId}`);
    }
  }

}

module.exports = new ProxmoxService();

