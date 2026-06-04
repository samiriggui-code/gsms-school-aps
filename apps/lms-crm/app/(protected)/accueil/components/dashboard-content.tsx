import {
  SecurityStats,
  WelcomeCallout,
  SecurityHighlights,
  MenuCardsSection,
} from './';
export const DashboardContent = () => {
  return (
    <div className="grid min-w-0 gap-5 lg:gap-8">
      {/* Section Stats Rapides */}
      <div className="grid min-w-0 gap-5 lg:gap-8">
        <SecurityStats />
      </div>

      {/* Section Bienvenue + Highlights */}
      <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
        <div className="min-w-0 lg:col-span-2">
          <WelcomeCallout className="h-full" />
        </div>
        <div className="min-w-0 lg:col-span-1">
          <SecurityHighlights limit={5} />
        </div>
      </div>

      {/* Section Menu Cards */}
      <MenuCardsSection />
    </div>
  );
};
