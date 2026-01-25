import { useState } from "react";
import { Search, Filter, Plus, Receipt, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFolios, useFolioStats } from "@/hooks/useFolios";
import { FolioStatsBar } from "@/components/folios/FolioStatsBar";
import { FolioCard } from "@/components/folios/FolioCard";
import { FolioDetailDrawer } from "@/components/folios/FolioDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import type { Folio } from "@/hooks/useFolios";

export default function Folios() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [selectedFolio, setSelectedFolio] = useState<Folio | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data: folios, isLoading: foliosLoading } = useFolios(activeTab);
  const { data: stats, isLoading: statsLoading } = useFolioStats();

  const filteredFolios = folios?.filter((folio) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      folio.folio_number.toLowerCase().includes(query) ||
      folio.guest?.first_name.toLowerCase().includes(query) ||
      folio.guest?.last_name.toLowerCase().includes(query) ||
      folio.reservation?.confirmation_number.toLowerCase().includes(query)
    );
  });

  const handleFolioClick = (folio: Folio) => {
    setSelectedFolio(folio);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      <FolioStatsBar stats={stats} isLoading={statsLoading} />

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by folio number, guest, or confirmation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "open" | "closed")}>
        <TabsList>
          <TabsTrigger value="open" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Open Folios
            {stats && <span className="ml-1 text-xs bg-primary/10 px-1.5 py-0.5 rounded">{stats.total_open}</span>}
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Closed Folios
            {stats && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded">{stats.total_closed}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-6">
          {foliosLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredFolios?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No open folios</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Open folios will appear here when guests check in
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFolios?.map((folio) => (
                <FolioCard
                  key={folio.id}
                  folio={folio}
                  onClick={() => handleFolioClick(folio)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          {foliosLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : filteredFolios?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No closed folios</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Closed folios will appear here after checkout
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFolios?.map((folio) => (
                <FolioCard
                  key={folio.id}
                  folio={folio}
                  onClick={() => handleFolioClick(folio)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Folio Detail Drawer */}
      <FolioDetailDrawer
        folio={selectedFolio}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  );
}
