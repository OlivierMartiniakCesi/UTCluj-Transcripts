"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  CreditCard,
  Crown,
  BarChart3,
  Settings,
  UserCircle,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "../../supabase/client";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Transcribe",
    href: "/dashboard/transcribe",
    icon: FileText,
  },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: CreditCard,
  },
  {
    name: "Abonnement",
    href: "/dashboard/subscription",
    icon: Crown,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    name: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      {/* Mobile burger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white border rounded-lg p-2 shadow"
        onClick={() => setOpen((o) => !o)}
        aria-label="Ouvrir le menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-white border-r shadow-lg z-40 flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <span className="text-xl font-bold">UTCluj Transcripts</span>
          <button className="md:hidden" onClick={() => setOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 px-2 py-6 space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="border-t px-6 py-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 text-base font-medium"
          >
            <UserCircle className="h-5 w-5" />
            Se déconnecter
          </button>
        </div>
      </aside>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      {/* Padding for main content */}
      <div className="md:block hidden w-64 flex-shrink-0" />
    </>
  );
} 