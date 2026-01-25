import { useState } from "react";
import { format } from "date-fns";
import {
  Briefcase,
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Users,
  Percent,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCorporateAccounts,
  useDeleteCorporateAccount,
  type CorporateAccount,
} from "@/hooks/useCorporateAccounts";
import { CreateCorporateAccountDialog } from "@/components/corporate/CreateCorporateAccountDialog";
import { CorporateAccountDetailDrawer } from "@/components/corporate/CorporateAccountDetailDrawer";

export default function CorporateAccounts() {
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: accounts = [], isLoading } = useCorporateAccounts();
  const deleteAccount = useDeleteCorporateAccount();

  const filteredAccounts = accounts.filter(
    (account) =>
      account.company_name.toLowerCase().includes(search.toLowerCase()) ||
      account.account_code.toLowerCase().includes(search.toLowerCase()) ||
      account.contact_email?.toLowerCase().includes(search.toLowerCase())
  );

  const activeAccounts = accounts.filter((a) => a.is_active).length;
  const totalLinkedGuests = accounts.reduce(
    (acc, a) => acc + (a.linked_guests_count || 0),
    0
  );

  const handleViewAccount = (account: CorporateAccount) => {
    setSelectedAccount(account);
    setDrawerOpen(true);
  };

  const handleDelete = (account: CorporateAccount) => {
    if (
      confirm(
        `Are you sure you want to delete ${account.company_name}? This will unlink all associated guests.`
      )
    ) {
      deleteAccount.mutate(account.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            Corporate Accounts
          </h1>
          <p className="text-muted-foreground">
            Manage corporate clients and travel agent accounts
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.length}</p>
                <p className="text-xs text-muted-foreground">Total Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Briefcase className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAccounts}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalLinkedGuests}</p>
                <p className="text-xs text-muted-foreground">Linked Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <CardTitle>All Accounts</CardTitle>
              <CardDescription>
                View and manage corporate accounts
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-10 w-48" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-12" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">No accounts found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{account.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.account_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {account.contact_name && (
                            <p>{account.contact_name}</p>
                          )}
                          {account.contact_email && (
                            <p className="text-muted-foreground text-xs">
                              {account.contact_email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.discount_percentage > 0 ? (
                          <Badge variant="secondary">
                            <Percent className="h-3 w-3 mr-1" />
                            {account.discount_percentage}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{account.linked_guests_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.is_active ? (
                          <Badge className="bg-success text-success-foreground">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewAccount(account)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(account)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <CreateCorporateAccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Detail Drawer */}
      <CorporateAccountDetailDrawer
        account={selectedAccount}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
