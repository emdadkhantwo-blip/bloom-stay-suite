import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FolderOpen, 
  Plus, 
  Search,
  FileText,
  AlertCircle,
  Upload,
  Download,
  Eye,
  Trash2,
  CreditCard,
  FileSignature,
  Award,
  File
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const DOCUMENT_TYPES = [
  { id: 'nid', name: 'NID/Passport', icon: CreditCard, color: 'text-vibrant-blue' },
  { id: 'contract', name: 'Employment Contract', icon: FileSignature, color: 'text-vibrant-purple' },
  { id: 'certificate', name: 'Certificates', icon: Award, color: 'text-vibrant-green' },
  { id: 'offer', name: 'Offer Letter', icon: FileText, color: 'text-vibrant-amber' },
  { id: 'other', name: 'Other', icon: File, color: 'text-muted-foreground' },
];

const HRDocuments = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-vibrant-cyan/10 to-vibrant-blue/10 border-l-4 border-l-vibrant-cyan">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <FolderOpen className="h-8 w-8 text-vibrant-cyan" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-green/10 to-vibrant-emerald/10 border-l-4 border-l-vibrant-green">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valid Documents</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <FileText className="h-8 w-8 text-vibrant-green" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-orange/10 border-l-4 border-l-vibrant-amber">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <AlertCircle className="h-8 w-8 text-vibrant-amber" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-vibrant-rose/10 to-vibrant-pink/10 border-l-4 border-l-vibrant-rose">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <AlertCircle className="h-8 w-8 text-vibrant-rose" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="bg-vibrant-cyan hover:bg-vibrant-cyan/90">
          <Upload className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Document Type Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedType === null ? "default" : "outline"} 
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              All Types
            </Button>
            {DOCUMENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <Button 
                  key={type.id}
                  variant={selectedType === type.id ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSelectedType(type.id)}
                >
                  <Icon className={`h-4 w-4 mr-2 ${type.color}`} />
                  {type.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-vibrant-cyan" />
            Employee Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No documents uploaded</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Upload employee documents like NID, contracts, and certificates.
            </p>
            <Button className="mt-4 bg-vibrant-cyan hover:bg-vibrant-cyan/90">
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRDocuments;
