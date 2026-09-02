'use client';

import { useState } from 'react';
import { Calendar, LayoutGrid } from 'lucide-react';
import { Container } from '@/components/common/container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { SallesPageToolbar } from './components/salles-page-toolbar';
import { SallesStats } from './components/salles-stats';
import { SallesList } from './components/salles-list';
import { SallesPlanning } from './components/salles-planning';
import { SalleAddSheet } from './components/salle-add-sheet';
import { SalleBookingAddSheet } from './components/salle-booking-add-sheet';

export default function SallesDeFormationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isBookingSheetOpen, setIsBookingSheetOpen] = useState(false);

  return (
    <div className="flex flex-col gap-5 lg:gap-7.5 w-full min-w-0 overflow-hidden">
      <Container>
        <SallesPageToolbar onAdd={() => setIsAddSheetOpen(true)} searchQuery={searchQuery} />
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <SallesStats />

        <Tabs defaultValue="referentiel" className="w-full space-y-5">
          <TabsList className="bg-muted/50 border border-border/50 p-1">
            <TabsTrigger
              value="referentiel"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <LayoutGrid className="size-4" />
              Référentiel
            </TabsTrigger>
            <TabsTrigger
              value="planning"
              className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Calendar className="size-4" />
              Planning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referentiel" className="mt-0 focus-visible:outline-none">
            <SallesList searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          </TabsContent>

          <TabsContent value="planning" className="mt-0 focus-visible:outline-none">
            <SallesPlanning onAddBooking={() => setIsBookingSheetOpen(true)} />
          </TabsContent>
        </Tabs>
      </Container>

      <SalleAddSheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen} />
      <SalleBookingAddSheet open={isBookingSheetOpen} onOpenChange={setIsBookingSheetOpen} />
    </div>
  );
}
