import { Settings, Play, TrendingUp } from "lucide-react";
import feature1 from "@/assets/feature-1.jpg";
import feature2 from "@/assets/feature-2.jpg";

const steps = [
  {
    number: "০১",
    icon: Settings,
    title: "হোটেল সেটআপ করুন",
    description: "আপনার হোটেলের রুম, ক্যাটাগরি, ভাড়া ও অন্যান্য তথ্য যোগ করুন। আমাদের টিম আপনাকে সাহায্য করবে।",
    image: feature1,
    color: "bg-emerald-500",
  },
  {
    number: "০২",
    icon: Play,
    title: "দৈনন্দিন কাজ চালান",
    description: "বুকিং নিন, চেক-ইন/আউট করুন, বিল তৈরি করুন—সব কিছু এক ড্যাশবোর্ড থেকে।",
    image: feature2,
    color: "bg-amber-500",
  },
  {
    number: "০৩",
    icon: TrendingUp,
    title: "রিপোর্ট দেখে সিদ্ধান্ত নিন",
    description: "রেভিনিউ, অকুপেন্সি, গেস্ট ডাটা—সব তথ্য বিশ্লেষণ করে স্মার্ট সিদ্ধান্ত নিন।",
    image: feature1,
    color: "bg-purple-500",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            কিভাবে <span className="text-info">কাজ করে?</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            মাত্র ৩টি সহজ ধাপে আপনার হোটেল হয়ে যাবে সম্পূর্ণ ডিজিটাল
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className={`flex flex-col lg:flex-row gap-8 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Image */}
              <div className="flex-1 relative">
                <div className={`absolute -top-4 -left-4 ${step.color} text-white rounded-full h-12 w-12 flex items-center justify-center font-bold text-lg z-10`}>
                  {step.number}
                </div>
                <img 
                  src={step.image}
                  alt={step.title}
                  className="rounded-2xl shadow-xl w-full aspect-video object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${step.color}/10 mb-4`}>
                  <step.icon className={`h-6 w-6`} style={{ color: step.color.replace('bg-', 'text-').includes('emerald') ? '#10b981' : step.color.includes('amber') ? '#f59e0b' : '#a855f7' }} />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-lg">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
