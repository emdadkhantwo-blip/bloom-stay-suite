import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus } from "lucide-react";
import { POSItem, POSCategory } from "@/hooks/usePOS";

interface POSMenuGridProps {
  items: POSItem[];
  categories: POSCategory[];
  onAddItem: (item: POSItem) => void;
}

export function POSMenuGrid({ items, categories, onAddItem }: POSMenuGridProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory && item.is_available;
  });

  const groupedByCategory = filteredItems.reduce((acc, item) => {
    const categoryName = item.category?.name || "Uncategorized";
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, POSItem[]>);

  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col p-4">
        {/* Search and Category Filter */}
        <div className="mb-4 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Items Grid */}
        <ScrollArea className="flex-1">
          {Object.entries(groupedByCategory).map(([categoryName, categoryItems]) => (
            <div key={categoryName} className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {categoryName}
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {categoryItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => onAddItem(item)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium leading-tight">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.code}</p>
                        </div>
                        <Badge variant="secondary" className="ml-2 shrink-0">
                          ৳{Number(item.price).toFixed(2)}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      {!item.is_available && (
                        <Badge variant="destructive" className="mt-2">
                          Unavailable
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              No menu items found
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
