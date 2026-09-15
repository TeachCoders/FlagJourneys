import { guardSuperAdmin } from '@/lib/authGuard';
import AnalyticsLayout from '@/components/analytics/AnalyticsLayout';
import SearchIntentPanel from '@/components/analytics/SearchIntentPanel';

export const metadata = {
  title: 'Search Intent | Flag Journeys',
};

export default async function SearchIntentPage() {
  await guardSuperAdmin();
  return (
    <AnalyticsLayout
      title="Search Intent"
      subtitle="What visitors are searching for on your website"
    >
      <SearchIntentPanel />
    </AnalyticsLayout>
  );
}