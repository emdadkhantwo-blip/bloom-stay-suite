import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Wifi, 
  Car, 
  Coffee, 
  Utensils,
  Star,
  ChevronRight,
  Send
} from 'lucide-react';

interface TemplateProps {
  config: {
    id: string;
    seo_title: string;
    seo_description: string;
    primary_color: string;
    secondary_color: string;
    hero_image_url: string;
    social_links: any;
  };
  property: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
  } | null;
  roomTypes: Array<{
    id: string;
    name: string;
    description: string;
    base_rate: number;
    max_occupancy: number;
    amenities: string[];
  }>;
  galleryImages: Array<{
    id: string;
    image_url: string;
    caption: string;
    category: string;
  }>;
  sections: Array<{
    type: string;
    enabled: boolean;
    content: any;
  }>;
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  breakfast: <Coffee className="h-4 w-4" />,
  restaurant: <Utensils className="h-4 w-4" />,
};

export default function ModernTemplate({ 
  config, 
  property, 
  roomTypes, 
  galleryImages,
  sections 
}: TemplateProps) {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSectionEnabled = (type: string) => {
    const section = sections.find(s => s.type === type);
    return section?.enabled !== false;
  };

  const getSectionContent = (type: string) => {
    const section = sections.find(s => s.type === type);
    return section?.content || {};
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          website_id: config.id,
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
          message: contactForm.message,
        });

      if (error) throw error;

      toast.success('Message sent successfully!');
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      {getSectionEnabled('hero') && (
        <section 
          className="relative h-[80vh] min-h-[500px] flex items-center justify-center"
          style={{
            backgroundImage: config.hero_image_url 
              ? `url(${config.hero_image_url})` 
              : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.8) 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 text-center text-white px-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {config.seo_title || property?.name || 'Welcome'}
            </h1>
            <p className="text-lg md:text-xl mb-8 opacity-90">
              {config.seo_description || 'Experience luxury and comfort like never before'}
            </p>
            <Button size="lg" className="text-lg px-8">
              Book Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      )}

      {/* About Section */}
      {getSectionEnabled('about') && (
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">About Us</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {getSectionContent('about').text || 
                `Welcome to ${property?.name || 'our hotel'}. We offer exceptional hospitality 
                and world-class amenities to make your stay unforgettable. Our dedicated team 
                ensures every guest receives personalized attention and care.`}
            </p>
          </div>
        </section>
      )}

      {/* Rooms Section */}
      {getSectionEnabled('rooms') && roomTypes.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Our Rooms</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomTypes.map((room) => (
                <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <span className="text-4xl">🛏️</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg">{room.name}</h3>
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {room.max_occupancy}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {room.description || 'Comfortable and well-appointed room'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(room.amenities || []).slice(0, 4).map((amenity, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {amenityIcons[amenity.toLowerCase()] || null}
                          <span className="ml-1">{amenity}</span>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold">৳{room.base_rate}</span>
                        <span className="text-sm text-muted-foreground">/night</span>
                      </div>
                      <Button size="sm">Book</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {getSectionEnabled('gallery') && galleryImages.length > 0 && (
        <section className="py-20 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image) => (
                <div 
                  key={image.id} 
                  className="aspect-square rounded-lg overflow-hidden bg-muted"
                >
                  <img 
                    src={image.image_url} 
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {getSectionEnabled('contact') && (
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Contact Us</h2>
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Get in Touch</h3>
                {property && (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-muted-foreground">
                          {property.address}, {property.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-muted-foreground">{property.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-muted-foreground">{property.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <Input
                  placeholder="Your Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
                <Input
                  placeholder="Phone Number"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
                <Textarea
                  placeholder="Your Message"
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-foreground text-background py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm opacity-80">
            © {new Date().getFullYear()} {property?.name || 'Hotel'}. All rights reserved.
          </p>
          <p className="text-xs opacity-60 mt-2">
            Powered by BeeHotel
          </p>
        </div>
      </footer>
    </div>
  );
}
