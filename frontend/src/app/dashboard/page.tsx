import type { Metadata } from 'next';
import DashboardHome from '@/components/DashboardHome';

export const metadata: Metadata = {
  title: 'Dashboard — Megladon MD',
  description: 'Live pharmacy scan, price grid, trends, and Supermemory-backed context.',
};

export default function DashboardPage() {
  return <DashboardHome />;
}
