/**
 * Proxmox LXC Router for PaaS
 */
const express = require('express');
const router = express.Router();
const TerraformService = require('../services/terraform');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

/**
 * @route POST /api/lxc
 * @desc Create a new Proxmox LXC container
 * @access Authenticated users
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const lxcConfig = req.body;
    const workspaceName = `lxc-${lxcConfig.name}`;

    const result = await TerraformService.createLXC(lxcConfig, workspaceName);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.status(201).json({
      success: true,
      lxcId: result.lxcId,
      lxcName: result.lxcName,
      lxcIp: result.lxcIp
    });
  } catch (error) {
    console.error('Error creating LXC container:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route DELETE /api/lxc/:workspaceName
 * @desc Destroy a Proxmox LXC container (by workspace)
 * @access Admin only
 */
router.delete('/:workspaceName', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { workspaceName } = req.params;

    const result = await TerraformService.destroyWorkspace(workspaceName);

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.status(200).json({
      success: true,
      message: 'Workspace destroyed successfully'
    });
  } catch (error) {
    console.error('Error destroying workspace:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
