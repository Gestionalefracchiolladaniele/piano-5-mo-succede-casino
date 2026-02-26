import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-white">
      <div className="flex">
        <aside className="min-h-screen w-64 border-r border-white/10 p-6">
          <h2 className="mb-8 text-xl font-semibold">Revenue OS</h2>
          <nav className="space-y-3 text-slate-300">
            <Link href="/dashboard" className="block hover:text-white">Dashboard</Link>
            <Link href="/dashboard/simulator" className="block hover:text-white">Simulator</Link>
          </nav>
        </aside>
        <div className="flex-1">
          <header className="border-b border-white/10 px-8 py-4 text-sm text-slate-400">Revenue control center</header>
          <main className="p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
