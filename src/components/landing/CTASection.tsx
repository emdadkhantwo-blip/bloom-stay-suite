import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, CreditCard, Headphones } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const benefits = [
  { icon: Check, text: "৩০ দিনের মানি-ব্যাক গ্যারান্টি" },
  { icon: CreditCard, text: "ক্রেডিট কার্ড লাগবে না" },
  { icon: Headphones, text: "ফ্রি সেটআপ ও ট্রেনিং" },
];

export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/80 to-primary/60" />
      </div>

      {/* Decorative Sun */}
      <div className="absolute top-0 right-20 w-32 h-32 bg-warning/30 rounded-full blur-3xl" />

      {/* Content */}
      <div className="container relative mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-warning/20 text-warning-foreground px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium text-primary-foreground">আজই শুরু করুন</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
            বাংলাদেশের হোটেল চালান আরও
            <br />
            <span className="text-info">সহজ, সুন্দর ও লাভজনকভাবে</span>
          </h2>

          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Cox's Bazar-এর সমুদ্র থেকে Sajek-এর পাহাড়—বাংলাদেশের প্রতিটি হোটেল আমাদের সাথে আরও স্মার্ট হচ্ছে।
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-primary-foreground/90">
                <div className="h-5 w-5 rounded-full bg-success/20 flex items-center justify-center">
                  <benefit.icon className="h-3 w-3 text-success" />
                </div>
                <span className="text-sm">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Button 
            size="lg" 
            className="bg-info hover:bg-info/90 text-info-foreground text-lg px-8 py-6"
            asChild
          >
            <Link to="/auth">
              ফ্রি ট্রায়াল শুরু করুন
            </Link>
          </Button>
        </div>
      </div>

      {/* Scrolling Benefits */}
      <div className="relative mt-16 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex gap-8">
          {[...benefits, ...benefits, ...benefits].map((benefit, index) => (
            <div 
              key={index}
              className="inline-flex items-center gap-2 text-primary-foreground/70"
            >
              <benefit.icon className="h-4 w-4 text-success" />
              <span>{benefit.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
