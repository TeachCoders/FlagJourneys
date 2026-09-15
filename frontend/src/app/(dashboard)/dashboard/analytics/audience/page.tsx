import { guardSuperAdmin } from '@/lib/authGuard';
import AnalyticsLayout from '@/components/analytics/AnalyticsLayout';
import DevicesBreakdown from '@/components/analytics/DevicesBreakdown';

export const metadata = {
  title: 'Devices | Flag Journeys',
};

export default async function DevicesPage() {
  await guardSuperAdmin();
  return (
    <AnalyticsLayout
      title="Devices"
      subtitle="Track which devices, browsers, operating systems and countries visitors come from"
    >
      <DevicesBreakdown />
    </AnalyticsLayout>
  );
}