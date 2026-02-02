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
  ChevronRight,
  Send,
  Home
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

export default function ClassicTemplate({ 
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
    <div className="min-h-screen bg-amber-50">
      {/* Navigation */}
      <nav className="bg-amber-900 text-amber-50 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6" />
            <span className="text-xl font-serif">{property?.name || 'Hotel'}</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm">
            <a href="#about" className="hover:text-amber-200 transition-colors">About</a>
            <a href="#rooms" className="hover:text-amber-200 transition-colors">Rooms</a>
            <a href="#gallery" className="hover:text-amber-200 transition-colors">Gallery</a>
            <a href="#contact" className="hover:text-amber-200 transition-colors">Contact</a>
          </div>
          <Button size="sm" className="bg-amber-100 text-amber-900 hover:bg-white">
            Book Now
          </Button>
        </div>
      </nav>

      {/* Hero Section - Classic Banner */}
      {getSectionEnabled('hero') && (
        <section 
          className="relative h-[60vh] min-h-[400px] flex items-center"
          style={{
            backgroundImage: config.hero_image_url 
              ? `url(${config.hero_image_url})` 
              : 'linear-gradient(135deg, #78350f 0%, #92400e 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              <p className="text-amber-200 font-serif italic text-lg mb-2">Welcome to</p>
              <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">
                {config.seo_title || property?.name || 'Our Hotel'}
              </h1>
              <div className="w-20 h-1 bg-amber-500 mb-6" />
              <p className="text-lg text-amber-100 mb-8">
                {config.seo_description || 'A tradition of excellence and warm hospitality'}
              </p>
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white">
                Explore Our Rooms
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {getSectionEnabled('about') && (
        <section id="about" className="py-20 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-serif italic mb-2">About Us</p>
              <h2 className="text-3xl font-serif text-amber-900 mb-4">Our Heritage</h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto" />
            </div>
            <p className="text-lg text-amber-800 leading-relaxed text-center">
              {getSectionContent('about').text || 
                `For generations, ${property?.name || 'our hotel'} has been a beacon of 
                hospitality and warmth. Our commitment to traditional values combined 
                with modern comforts ensures that every guest feels at home. Step through 
                our doors and become part of our continuing story.`}
            </p>
          </div>
        </section>
      )}

      {/* Rooms Section */}
      {getSectionEnabled('rooms') && roomTypes.length > 0 && (
        <section id="rooms" className="py-20 px-6 bg-amber-100/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-serif italic mb-2">Accommodations</p>
              <h2 className="text-3xl font-serif text-amber-900 mb-4">Our Rooms</h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roomTypes.map((room) => (
                <Card 
                  key={room.id} 
                  className="bg-white border-amber-200 overflow-hidden shadow-md"
                >
                  <div className="h-48 bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center border-b border-amber-200">
                    <span className="text-5xl">🛏️</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-serif text-xl text-amber-900">{room.name}</h3>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                        <Users className="h-3 w-3 mr-1" />
                        {room.max_occupancy}
                      </Badge>
                    </div>
                    <p className="text-sm text-amber-700 mb-4 line-clamp-2">
                      {room.description || 'Comfortable and traditionally appointed'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(room.amenities || []).slice(0, 3).map((amenity, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-xs border-amber-300 text-amber-700"
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-amber-100">
                      <div>
                        <span className="text-2xl font-serif text-amber-900">৳{room.base_rate}</span>
                        <span className="text-sm text-amber-600">/night</span>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-amber-700 hover:bg-amber-800 text-white"
                      >
                        Book Now
                      </Button>
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
        <section id="gallery" className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-600 font-serif italic mb-2">Explore</p>
              <h2 className="text-3xl font-serif text-amber-900 mb-4">Photo Gallery</h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((image) => (
                <div 
                  key={image.id} 
                  className="aspect-[4/3] rounded overflow-hidden border-4 border-amber-100 shadow-md"
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

      {/* Contact Section */}
      {getSectionEnabled('contact') && (
        <section id="contact" className="py-20 px-6 bg-amber-900 text-amber-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-amber-300 font-serif italic mb-2">Get in Touch</p>
              <h2 className="text-3xl font-serif mb-4">Contact Us</h2>
              <div className="w-16 h-1 bg-amber-500 mx-auto" />
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div className="space-y-6">
                {property && (
                  <>
                    <div className="flex items-start gap-4">
                      <MapPin className="h-5 w-5 text-amber-400 mt-1" />
                      <div>
                        <p className="font-medium">Address</p>
                        <p className="text-amber-200">
                          {property.address}, {property.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Phone className="h-5 w-5 text-amber-400 mt-1" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p className="text-amber-200">{property.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Mail className="h-5 w-5 text-amber-400 mt-1" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p className="text-amber-200">{property.email}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Contact Form */}
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <Input
                  placeholder="Your Name"
                  className="bg-amber-800 border-amber-700 text-white placeholder:text-amber-400"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  className="bg-amber-800 border-amber-700 text-white placeholder:text-amber-400"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
                <Input
                  placeholder="Phone Number"
                  className="bg-amber-800 border-amber-700 text-white placeholder:text-amber-400"
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                />
                <Textarea
                  placeholder="Your Message"
                  rows={4}
                  className="bg-amber-800 border-amber-700 text-white placeholder:text-amber-400"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full bg-amber-100 text-amber-900 hover:bg-white" 
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
      <footer className="bg-amber-950 text-amber-300 py-10 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Home className="h-8 w-8 mx-auto mb-4 text-amber-500" />
          <p className="font-serif text-xl text-amber-100 mb-2">
            {property?.name || 'Hotel'}
          </p>
          <p className="text-sm text-amber-400">
            © {new Date().getFullYear()} All rights reserved.
          </p>
          <p className="text-xs mt-2 text-amber-600">
            Powered by BeeHotel
          </p>
        </div>
      </footer>
    </div>
  );
}
