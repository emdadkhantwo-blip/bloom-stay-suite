import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, ArrowRight, Star, CheckCircle, CircleDollarSign, TrendingUp } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative mx-auto px-4 py-20 md:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div className="text-primary-foreground">
            <Badge className="mb-6 bg-success/20 text-success border-0 px-4 py-2">
              <span className="mr-2 h-2 w-2 rounded-full bg-success animate-pulse inline-block" />
              ২০০০+ হোটেল বিশ্বস্ত সফটওয়্যার
            </Badge>
            
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              আপনার <span className="text-info">হোটেল ব্যবসা</span>
              <br />
              রূপান্তর করুন
            </h1>
            
            <p className="mb-8 text-lg opacity-90 md:text-xl max-w-xl">
              অল-ইন-ওয়ান ক্লাউড PMS সফটওয়্যার যা আপনার হোটেল অপারেশন সহজ করে তুলবে। 
              রিজার্ভেশন থেকে হাউসকিপিং - সবকিছু এক প্ল্যাটফর্মে।
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button 
                size="lg" 
                className="bg-info hover:bg-info/90 text-info-foreground gap-2"
                asChild
              >
                <Link to="/auth">
                  <Phone className="h-4 w-4" />
                  যোগাযোগ করুন
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/auth">ডেমো দেখুন</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 flex flex-wrap gap-8">
              <div>
                <div className="text-3xl font-bold md:text-4xl">২০০০+</div>
                <div className="text-sm opacity-80">সন্তুষ্ট হোটেল</div>
              </div>
              <div>
                <div className="text-3xl font-bold md:text-4xl">৯৯.৯%</div>
                <div className="text-sm opacity-80">আপটাইম</div>
              </div>
              <div>
                <div className="text-3xl font-bold md:text-4xl">২৪/৭</div>
                <div className="text-sm opacity-80">সাপোর্ট</div>
              </div>
            </div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Main Dashboard Card */}
              <div className="rounded-2xl bg-card/95 backdrop-blur-sm p-6 shadow-2xl border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-card-foreground">Dashboard</h3>
                    <p className="text-sm text-muted-foreground">Bee Hotel</p>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-full bg-destructive" />
                    <div className="h-3 w-3 rounded-full bg-warning" />
                    <div className="h-3 w-3 rounded-full bg-success" />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-card-foreground">89%</div>
                    <div className="text-xs text-muted-foreground">Rooms Occupied</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-card-foreground">$12.4K</div>
                    <div className="text-xs text-muted-foreground">Revenue</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      <span className="text-2xl font-bold text-card-foreground">4.9</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Rating</div>
                  </div>
                </div>

                {/* Chart Bars */}
                <div className="flex items-end gap-2 h-24">
                  {[60, 80, 45, 90, 70, 85, 95].map((height, i) => (
                    <div 
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-info to-room-maintenance"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Floating Notification */}
              <div className="absolute -left-8 top-1/3 bg-card rounded-xl p-4 shadow-xl border flex items-center gap-3 animate-fade-in">
                <div className="h-10 w-10 rounded-full bg-info/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-info" />
                </div>
                <div>
                  <div className="font-medium text-card-foreground text-sm">New Booking</div>
                  <div className="text-xs text-muted-foreground">Room 204 confirmed</div>
                </div>
                <ArrowRight className="h-5 w-5 text-info bg-info/20 rounded-full p-1 ml-2" />
              </div>

              {/* Guest Rating Badge */}
              <div className="absolute -right-4 bottom-16 bg-card rounded-xl p-3 shadow-xl border animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                  </div>
                  <div>
                    <div className="font-medium text-card-foreground text-sm">Guest Rating</div>
                    <div className="text-xs text-muted-foreground">4.9/5 Average</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
