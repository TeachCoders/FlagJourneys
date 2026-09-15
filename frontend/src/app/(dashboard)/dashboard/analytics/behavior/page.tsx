import { guardSuperAdmin } from '@/lib/authGuard';
import AnalyticsLayout from '@/components/analytics/AnalyticsLayout';
import EngagementPanel from '@/components/analytics/EngagementPanel';

export const metadata = {
  title: 'Engagement | Flag Journeys',
};

export default async function EngagementPage() {
  await guardSuperAdmin();
  return (
    <AnalyticsLayout
      title="Engagement"
      subtitle="How long visitors spend time and what they do"
    >
      <EngagementPanel />
    </AnalyticsLayout>
  );
}