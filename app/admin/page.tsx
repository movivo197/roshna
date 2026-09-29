import type { Metadata } from "next";
import { AdminPanel } from "../../components/admin-panel";
import "./admin.css";

export const metadata: Metadata = {
  title: "پنل مدیریت | روشنا",
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function AdminPage() { return <AdminPanel />; }
