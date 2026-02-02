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
  Star,
  ChevronRight,
  Send,
  Sparkles
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

export default function LuxuryTemplate({ 
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
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section - Full Screen with Elegant Overlay */}
      {getSectionEnabled('hero') && (
        <section 
          className="relative h-screen flex items-center justify-center"
          style={{
            backgroundImage: config.hero_image_url 
              ? `url(${config.hero_image_url})` 
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
          
          {/* Decorative Elements */}
          <div className="absolute top-8 left-8 text-amber-400">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="absolute top-8 right-8 text-amber-400">
            <Sparkles className="h-8 w-8" />
          </div>
          
          <div className="relative z-10 text-center text-white px-4 max-w-4xl">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <h1 className="text-5xl md:text-7xl font-serif mb-6 tracking-wide">
              {config.seo_title || property?.name || 'Luxury Awaits'}
            </h1>
            <div className="w-24 h-0.5 bg-amber-400 mx-auto mb-6" />
            <p className="text-xl md:text-2xl mb-10 opacity-90 font-light italic">
              {config.seo_description || 'Where elegance meets comfort'}
            </p>
            <Button 
              size="lg" 
              className="text-lg px-12 py-6 bg-amber-600 hover:bg-amber-700 text-white border-2 border-amber-400"
            >
              Reserve Your Suite
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
              <div className="w-1.5 h-3 bg-white/50 rounded-full" />
            </div>
          </div>
        </section>
      )}

      {/* About Section - Elegant */}
      {getSectionEnabled('about') && (
        <section className="py-24 px-4 bg-stone-100">
          <div className="max-w-4xl mx-auto text-center">
            <Sparkles className="h-8 w-8 text-amber-600 mx-auto mb-6" />
            <h2 className="text-4xl font-serif mb-8 text-stone-800">Our Story</h2>
            <div className="w-16 h-0.5 bg-amber-500 mx-auto mb-8" />
            <p className="text-lg text-stone-600 leading-relaxed font-light">
              {getSectionContent('about').text || 
                `Nestled in the heart of the city, ${property?.name || 'our hotel'} offers 
                an unparalleled experience of luxury and refinement. Every detail has been 
                carefully curated to provide our distinguished guests with moments of pure 
                indulgence and tranquility.`}
            </p>
          </div>
        </section>
      )}

      {/* Rooms Section - Luxury Style */}
      {getSectionEnabled('rooms') && roomTypes.length > 0 && (
        <section className="py-24 px-4 bg-stone-900 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif mb-4">Accommodations</h2>
              <div className="w-16 h-0.5 bg-amber-500 mx-auto" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roomTypes.map((room) => (
                <Card 
                  key={room.id} 
                  className="bg-stone-800 border-stone-700 overflow-hidden group"
                >
                  <div className="h-56 bg-gradient-to-br from-amber-900/30 to-stone-900 flex items-center justify-center">
                    <span className="text-5xl group-hover:scale-110 transition-transform">🛏️</span>
                  </div>
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-serif text-xl text-amber-100">{room.name}</h3>
                      <Badge className="bg-amber-600/20 text-amber-400 border-amber-500/30">
                        <Users className="h-3 w-3 mr-1" />
                        {room.max_occupancy}
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-400 mb-6 line-clamp-2">
                      {room.description || 'An exquisite retreat designed for your comfort'}
                    </p>
                    <div className="flex justify-between items-center pt-4 border-t border-stone-700">
                      <div>
                        <span className="text-3xl font-light text-amber-400">৳{room.base_rate}</span>
                        <span className="text-sm text-stone-500 ml-1">/night</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Reserve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section - Masonry Style */}
      {getSectionEnabled('gallery') && galleryImages.length > 0 && (
        <section className="py-24 px-4 bg-stone-100">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif text-stone-800 mb-4">Gallery</h2>
              <div className="w-16 h-0.5 bg-amber-500 mx-auto" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryImages.map((image, idx) => (
                <div 
                  key={image.id} 
                  className={`rounded-lg overflow-hidden ${
                    idx % 5 === 0 ? 'md:col-span-2 md:row-span-2' : ''
                  }`}
                >
                  <img 
                    src={image.image_url} 
                    alt={image.caption || 'Gallery image'}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section - Elegant */}
      {getSectionEnabled('contact') && (
        <section className="py-24 px-4 bg-stone-900 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif mb-4">Contact</h2>
              <div className="w-16 h-0.5 bg-amber-500 mx-auto" />
            </div>
            <div className="grid md:grid-cols-2 gap-16">
              {/* Contact Info */}
              <div className="space-y-8">
                <h3 className="text-2xl font-serif text-amber-100">Get in Touch</h3>
                {property && (
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-300">Address</p>
                        <p className="text-stone-500">
                          {property.address}, {property.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-300">Phone</p>
                        <p className="text-stone-500">{property.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-stone-300">Email</p>
                        <p className="text-stone-500">{property.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <Input
                  placeholder="Your Name"
                  className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
                <Input
                  placeholder="Phone Number"
                  className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
                <Textarea
                  placeholder="Your Message"
                  rows={4}
                  className="bg-stone-800 border-stone-700 text-white placeholder:text-stone-500"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white" 
                  disabled={isSubmitting}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-600 text-amber-600" />
            ))}
          </div>
          <p className="font-serif text-xl text-stone-300 mb-4">
            {property?.name || 'Hotel'}
          </p>
          <p className="text-sm">
            © {new Date().getFullYear()} All rights reserved.
          </p>
          <p className="text-xs mt-2 text-stone-600">
            Powered by BeeHotel
          </p>
        </div>
      </footer>
    </div>
  );
}
