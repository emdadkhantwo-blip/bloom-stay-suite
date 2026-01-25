import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Hotel,
  Calendar,
  Users,
  BedDouble,
  ClipboardList,
  Wrench,
  BarChart3,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Reservations",
    description: "Manage bookings, check-ins, and check-outs with an intuitive calendar interface.",
  },
  {
    icon: BedDouble,
    title: "Room Management",
    description: "Track room status, manage room types, and optimize occupancy in real-time.",
  },
  {
    icon: Users,
    title: "Guest Profiles",
    description: "Maintain detailed guest profiles, preferences, VIP status, and stay history.",
  },
  {
    icon: ClipboardList,
    title: "Housekeeping",
    description: "Coordinate housekeeping tasks, track room cleanliness, and assign staff.",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description: "Log maintenance tickets, track repairs, and ensure rooms stay in top condition.",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    description: "Get insights on occupancy rates, revenue, and operational performance.",
  },
];

const benefits = [
  "Multi-property support",
  "Role-based access control",
  "Real-time room status",
  "Guest history tracking",
  "Automated workflows",
  "Mobile-friendly design",
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Hotel className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">HotelPMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Zap className="mr-1 h-3 w-3" />
              Modern Hotel Management
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
              Streamline Your{" "}
              <span className="text-primary">Hotel Operations</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              A comprehensive property management system designed for modern hotels. 
              Manage reservations, rooms, guests, and operations all in one place.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Everything You Need</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Powerful tools to manage every aspect of your hotel operations, 
              from reservations to maintenance.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold">
                Built for Modern Hotels
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Whether you run a boutique hotel or manage multiple properties, 
                our PMS adapts to your needs with flexible features and scalable infrastructure.
              </p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10">
                      <Check className="h-3 w-3 text-success" />
                    </div>
                    <span className="text-sm">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl" />
              <Card className="relative border-2">
                <CardHeader className="border-b bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-destructive/50" />
                    <div className="h-3 w-3 rounded-full bg-warning/50" />
                    <div className="h-3 w-3 rounded-full bg-success/50" />
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/20" />
                        <div>
                          <div className="h-3 w-24 rounded bg-foreground/20" />
                          <div className="mt-1 h-2 w-16 rounded bg-muted-foreground/20" />
                        </div>
                      </div>
                      <Badge variant="secondary">Checked In</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-warning/20" />
                        <div>
                          <div className="h-3 w-20 rounded bg-foreground/20" />
                          <div className="mt-1 h-2 w-14 rounded bg-muted-foreground/20" />
                        </div>
                      </div>
                      <Badge variant="outline">Arriving</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-success/20" />
                        <div>
                          <div className="h-3 w-28 rounded bg-foreground/20" />
                          <div className="mt-1 h-2 w-12 rounded bg-muted-foreground/20" />
                        </div>
                      </div>
                      <Badge variant="secondary">VIP</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex justify-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-4 text-3xl font-bold">
              Ready to Transform Your Operations?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Join hotels worldwide using our platform to deliver exceptional guest experiences.
            </p>
            <Button size="lg" asChild>
              <Link to="/auth">
                Get Started Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Hotel className="h-4 w-4" />
            <span>HotelPMS</span>
          </div>
          <p>© {new Date().getFullYear()} HotelPMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
