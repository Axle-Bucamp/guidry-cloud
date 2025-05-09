const pricing = require('../config/pricing.js');

class CostComputationService {
  calculateVmCost(vmConfig) {
    let totalCost = 0;
    // Calculate CPU cost (example: per core per hour)
    if (vmConfig.cpu && pricing.cpu) {
      totalCost += vmConfig.cpu * pricing.cpu.price_per_unit_per_hour;
    }
    // Calculate memory cost (example: per GB per hour)
    if (vmConfig.memory && pricing.memory) {
      totalCost += vmConfig.memory * pricing.memory.price_per_unit_per_hour;
    }
    // Calculate disk cost (example: per GB per month, adjust for hourly if needed)
    if (vmConfig.disk && pricing.disk) {
      totalCost += vmConfig.disk * pricing.disk.price_per_unit_per_month / (24 * 30); // Approximate hourly cost
    }
    return totalCost;
  }

  async calculateLxcCost(lxcConfig) {
    // Similar logic for LXC containers, adjust as needed
    let totalCost = 0;
    if (lxcConfig.cpu && pricing.cpu) {
      totalCost += lxcConfig.cpu * pricing.cpu.price_per_unit_per_hour;
    }
    if (lxcConfig.memory && pricing.memory) {
      totalCost += lxcConfig.memory * pricing.memory.price_per_unit_per_hour;
    }
    if (lxcConfig.disk && pricing.disk) {
      totalCost += lxcConfig.disk * pricing.disk.price_per_unit_per_month / (24 * 30); // Approximate hourly cost
    }
    return totalCost;
  }
}

module.exports = new CostComputationService();

