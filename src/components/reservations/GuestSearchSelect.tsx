import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Plus, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGuests, type Guest } from "@/hooks/useGuests";

interface GuestSearchSelectProps {
  value: string | null;
  onSelect: (guest: Guest | null) => void;
  onCreateNew: () => void;
}

export function GuestSearchSelect({ value, onSelect, onCreateNew }: GuestSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: guests, isLoading } = useGuests(searchQuery);

  const selectedGuest = useMemo(() => {
    return guests?.find((g) => g.id === value) || null;
  }, [guests, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedGuest ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>
                {selectedGuest.first_name} {selectedGuest.last_name}
              </span>
              {selectedGuest.is_vip && (
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">Select guest...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search guests by name, email, or phone..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Searching..." : "No guests found."}
            </CommandEmpty>
            <CommandGroup heading="Guests">
              {guests?.map((guest) => (
                <CommandItem
                  key={guest.id}
                  value={guest.id}
                  onSelect={() => {
                    onSelect(guest);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === guest.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {guest.first_name} {guest.last_name}
                        </span>
                        {guest.is_vip && (
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        )}
                      </div>
                      {(guest.email || guest.phone) && (
                        <p className="text-xs text-muted-foreground">
                          {guest.email || guest.phone}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {guest.total_stays} stay{guest.total_stays !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onCreateNew();
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Create new guest</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
