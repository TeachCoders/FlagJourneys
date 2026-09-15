import { guardSuperAdmin } from '@/lib/authGuard';
import AnalyticsLayout from '@/components/analytics/AnalyticsLayout';
import TrafficSourcesPanel from '@/components/analytics/TrafficSourcesPanel';

export const metadata = {
  title: 'Traffic Sources | Flag Journeys',
};

export default async function TrafficSourcesPage() {
  await guardSuperAdmin();
  return (
    <AnalyticsLayout
      title="Traffic Sources"
      subtitle="How and where visitors found your website"
    >
      <TrafficSourcesPanel />
    </AnalyticsLayout>
  );
}