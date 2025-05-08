import React from 'react';

import {
  LogOut,
  User,
} from 'lucide-react';
import {
  signOut,
  useSession,
} from 'next-auth/react';
import Link from 'next/link';

const Header: React.FC = () => {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold hover:text-gray-300">
          Proxmox PaaS
        </Link>
        <div className="flex items-center space-x-4">
          {session ? (
            <>
              <span className="flex items-center">
                <User className="h-5 w-5 mr-1" />
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-gray-300">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;

