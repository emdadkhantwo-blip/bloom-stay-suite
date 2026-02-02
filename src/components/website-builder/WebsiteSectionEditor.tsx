import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  GripVertical, 
  ChevronDown, 
  Image, 
  Type, 
  Bed, 
  Star, 
  Phone, 
  MapPin,
  Utensils,
  Sparkles,
  Users
} from 'lucide-react';

interface Section {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  content: any;
}

const SECTION_ICONS: Record<string, any> = {
  hero: Image,
  about: Type,
  rooms: Bed,
  testimonials: Star,
  contact: Phone,
  location: MapPin,
  dining: Utensils,
  amenities: Sparkles,
  team: Users,
};

const DEFAULT_SECTIONS: Section[] = [
  { id: 'hero', type: 'hero', enabled: true, order: 1, content: { title: 'Welcome to Our Hotel', subtitle: 'Experience luxury and comfort' } },
  { id: 'about', type: 'about', enabled: true, order: 2, content: { title: 'About Us', description: '' } },
  { id: 'rooms', type: 'rooms', enabled: true, order: 3, content: { title: 'Our Rooms', showPrices: true } },
  { id: 'amenities', type: 'amenities', enabled: true, order: 4, content: { title: 'Amenities', items: [] } },
  { id: 'testimonials', type: 'testimonials', enabled: true, order: 5, content: { title: 'Guest Reviews' } },
  { id: 'contact', type: 'contact', enabled: true, order: 6, content: { title: 'Contact Us', showForm: true } },
  { id: 'location', type: 'location', enabled: true, order: 7, content: { title: 'Location', showMap: true } },
];

interface WebsiteSectionEditorProps {
  sections: Section[] | null;
  onUpdate: (sections: Section[]) => void;
}

export default function WebsiteSectionEditor({
  sections,
  onUpdate,
}: WebsiteSectionEditorProps) {
  const currentSections = sections || DEFAULT_SECTIONS;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (sectionId: string, enabled: boolean) => {
    const updated = currentSections.map(s =>
      s.id === sectionId ? { ...s, enabled } : s
    );
    onUpdate(updated);
  };

  const updateSectionContent = (sectionId: string, content: any) => {
    const updated = currentSections.map(s =>
      s.id === sectionId ? { ...s, content: { ...s.content, ...content } } : s
    );
    onUpdate(updated);
  };

  const sortedSections = [...currentSections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Website Sections</h3>
        <p className="text-sm text-muted-foreground">
          Enable, disable, and customize each section of your website
        </p>
      </div>

      <div className="space-y-3">
        {sortedSections.map((section) => {
          const Icon = SECTION_ICONS[section.type] || Type;
          
          return (
            <Card key={section.id} className={!section.enabled ? 'opacity-60' : ''}>
              <Collapsible
                open={expandedSection === section.id}
                onOpenChange={(open) => setExpandedSection(open ? section.id : null)}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium capitalize">{section.type}</h4>
                      <p className="text-sm text-muted-foreground">
                        {section.content?.title || `${section.type} section`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={section.enabled}
                      onCheckedChange={(checked) => toggleSection(section.id, checked)}
                    />
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedSection === section.id ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4 border-t">
                    <div className="pt-4 space-y-4">
                      <SectionContentEditor
                        section={section}
                        onUpdate={(content) => updateSectionContent(section.id, content)}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SectionContentEditor({ section, onUpdate }: { section: Section; onUpdate: (content: any) => void }) {
  const content = section.content || {};

  switch (section.type) {
    case 'hero':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={content.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Welcome to Our Hotel"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtitle</Label>
            <Input
              value={content.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              placeholder="Experience luxury and comfort"
            />
          </div>
          <div className="space-y-2">
            <Label>Call-to-Action Text</Label>
            <Input
              value={content.ctaText || 'Book Now'}
              onChange={(e) => onUpdate({ ctaText: e.target.value })}
              placeholder="Book Now"
            />
          </div>
        </div>
      );

    case 'about':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={content.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="About Our Hotel"
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={content.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Tell your hotel's story..."
              rows={4}
            />
          </div>
        </div>
      );

    case 'rooms':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={content.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Our Rooms"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Prices</Label>
              <p className="text-xs text-muted-foreground">Display room rates on the website</p>
            </div>
            <Switch
              checked={content.showPrices !== false}
              onCheckedChange={(checked) => onUpdate({ showPrices: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Booking Button</Label>
              <p className="text-xs text-muted-foreground">Allow visitors to book directly</p>
            </div>
            <Switch
              checked={content.showBooking !== false}
              onCheckedChange={(checked) => onUpdate({ showBooking: checked })}
            />
          </div>
        </div>
      );

    case 'contact':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={content.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Contact Us"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Contact Form</Label>
              <p className="text-xs text-muted-foreground">Allow visitors to send messages</p>
            </div>
            <Switch
              checked={content.showForm !== false}
              onCheckedChange={(checked) => onUpdate({ showForm: checked })}
            />
          </div>
        </div>
      );

    case 'location':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input
              value={content.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Location"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Show Map</Label>
              <p className="text-xs text-muted-foreground">Display Google Maps embed</p>
            </div>
            <Switch
              checked={content.showMap !== false}
              onCheckedChange={(checked) => onUpdate({ showMap: checked })}
            />
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          <Label>Section Title</Label>
          <Input
            value={content.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Section title"
          />
        </div>
      );
  }
}
