import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="page-gradient min-h-screen">
      <Navbar
        variant="app"
        showMenuButton
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 pb-8">{children}</main>
      </div>
    </div>
  );
}
