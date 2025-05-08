import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-700 text-white text-center p-4 mt-8">
      <p>&copy; {new Date().getFullYear()} Proxmox PaaS. All rights reserved.</p>
    </footer>
  );
};

export default Footer;

