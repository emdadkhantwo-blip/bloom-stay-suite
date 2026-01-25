import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Upload, Save, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function BrandingSettings() {
  const { branding, settings, updateBranding, updateBrandingSettings, isUpdating } = useSettings();
  
  // Form state
  const [name, setName] = useState(branding.name);
  const [logoUrl, setLogoUrl] = useState(branding.logo_url || '');
  const [contactEmail, setContactEmail] = useState(branding.contact_email || '');
  const [contactPhone, setContactPhone] = useState(branding.contact_phone || '');
  
  // Branding settings
  const [primaryColor, setPrimaryColor] = useState(settings.branding?.primary_color || '#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState(settings.branding?.secondary_color || '#10B981');
  const [logoPosition, setLogoPosition] = useState(settings.branding?.logo_position || 'left');
  const [showPoweredBy, setShowPoweredBy] = useState(settings.branding?.show_powered_by ?? true);

  useEffect(() => {
    setName(branding.name);
    setLogoUrl(branding.logo_url || '');
    setContactEmail(branding.contact_email || '');
    setContactPhone(branding.contact_phone || '');
    setPrimaryColor(settings.branding?.primary_color || '#3B82F6');
    setSecondaryColor(settings.branding?.secondary_color || '#10B981');
    setLogoPosition(settings.branding?.logo_position || 'left');
    setShowPoweredBy(settings.branding?.show_powered_by ?? true);
  }, [branding, settings]);

  const handleSave = async () => {
    // Update tenant branding
    await updateBranding.mutateAsync({
      name,
      logo_url: logoUrl || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
    });

    // Update branding settings
    await updateBrandingSettings({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      logo_position: logoPosition as 'left' | 'center',
      show_powered_by: showPoweredBy,
    });
  };

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organization Information
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24">
                <AvatarImage src={logoUrl} alt={name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Logo
              </Button>
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Hotel Group"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Branding</CardTitle>
          <CardDescription>
            Customize the look and feel of your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#3B82F6"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#10B981"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logoPosition">Logo Position</Label>
            <Select value={logoPosition} onValueChange={(v) => setLogoPosition(v as 'left' | 'center')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="poweredBy">Show "Powered by" Badge</Label>
              <p className="text-sm text-muted-foreground">
                Display branding badge in the footer
              </p>
            </div>
            <Switch
              id="poweredBy"
              checked={showPoweredBy}
              onCheckedChange={setShowPoweredBy}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
