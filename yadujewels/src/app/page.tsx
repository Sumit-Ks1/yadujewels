import dynamic from "next/dynamic";
import { Layout } from "@/components/layout/Layout";
import { HeroSection } from "@/components/home/HeroSection";
import { TrustHighlights } from "@/components/home/TrustHighlights";
import { FirstVisitPopup } from "@/components/home/FirstVisitPopup";

// Dynamic imports for below-the-fold content
// Improves initial page load by code-splitting heavy components
const BestSellers = dynamic(
  () => import("@/components/home/BestSellers").then((mod) => ({ default: mod.BestSellers })),
  { 
    loading: () => <SectionSkeleton />,
    ssr: true 
  }
);

const FeaturedCollections = dynamic(
  () => import("@/components/home/FeaturedCollections").then((mod) => ({ default: mod.FeaturedCollections })),
  { 
    loading: () => <SectionSkeleton />,
    ssr: true 
  }
);

const BrandStory = dynamic(
  () => import("@/components/home/BrandStory").then((mod) => ({ default: mod.BrandStory })),
  { ssr: true }
);

const SustainabilitySection = dynamic(
  () => import("@/components/home/SustainabilitySection").then((mod) => ({ default: mod.SustainabilitySection })),
  { ssr: true }
);

const TestimonialsSection = dynamic(
  () => import("@/components/home/TestimonialsSection").then((mod) => ({ default: mod.TestimonialsSection })),
  { ssr: true }
);

const NewsletterSection = dynamic(
  () => import("@/components/home/NewsletterSection").then((mod) => ({ default: mod.NewsletterSection })),
  { ssr: true }
);

// Skeleton for loading state
function SectionSkeleton() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <Layout>
      {/* First time visitor popup pointing to cart */}
      <FirstVisitPopup />
      
      {/* Above the fold - loaded immediately */}
      <HeroSection />
      <TrustHighlights />
      
      {/* Below the fold - lazy loaded */}
      <BestSellers />
      <FeaturedCollections />
      <BrandStory />
      <SustainabilitySection />
      <TestimonialsSection />
      <NewsletterSection />
    </Layout>
  );
}
