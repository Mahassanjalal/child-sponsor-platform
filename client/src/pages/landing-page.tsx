import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  AnimatedContainer,
  StaggerContainer,
  StaggerItem,
  HoverScale,
} from "@/components/animated-container";
import {
  Heart,
  Users,
  FileText,
  Shield,
  ArrowRight,
  Sparkles,
  GraduationCap,
  Stethoscope,
  Utensils,
  Globe,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Child } from "@shared/schema";
import { useRef } from "react";

const impactStats = [
  { value: "500+", label: "Children Supported", icon: Users },
  { value: "98%", label: "Funds to Programs", icon: Shield },
  { value: "12", label: "Countries Reached", icon: Globe },
  { value: "1000+", label: "Active Sponsors", icon: Heart },
];

const features = [
  {
    icon: GraduationCap,
    title: "Education",
    description: "Funding school fees, uniforms, and learning materials for academic success.",
  },
  {
    icon: Stethoscope,
    title: "Healthcare",
    description: "Providing medical check-ups, vaccinations, and emergency care when needed.",
  },
  {
    icon: Utensils,
    title: "Nutrition",
    description: "Ensuring daily nutritious meals for healthy growth and development.",
  },
  {
    icon: Heart,
    title: "Emotional Support",
    description: "Counseling and mentorship programs for holistic child development.",
  },
];

const testimonials = [
  {
    quote: "Seeing the monthly progress reports fills my heart with joy. Knowing I'm making a real difference in Maria's life is incredibly rewarding.",
    author: "Sarah Johnson",
    role: "Sponsor since 2021",
  },
  {
    quote: "The transparency and regular updates from HopeConnect give me complete confidence that my contribution is truly helping.",
    author: "Michael Chen",
    role: "Sponsor since 2020",
  },
  {
    quote: "I started sponsoring one child and now support three. The connection you build through the platform is truly meaningful.",
    author: "Emily Rodriguez",
    role: "Sponsor since 2019",
  },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const { data: children } = useQuery<Child[]>({
    queryKey: ["/api/children/featured"],
  });

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight * 0.9, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <motion.div 
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                HopeConnect
              </span>
            </motion.div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-about">
              About
            </a>
            <a href="#impact" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-impact">
              Our Impact
            </a>
            <a href="#children" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-children">
              Children
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth">
              <Button variant="outline" data-testid="button-login">
                Log In
              </Button>
            </Link>
            <Link href="/auth?mode=register">
              <Button data-testid="button-get-started">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
                             radial-gradient(circle at 80% 50%, hsl(var(--accent) / 0.15) 0%, transparent 50%)`,
          }}
        />
        
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 container mx-auto px-4 text-center"
        >
          <AnimatedContainer delay={0.1}>
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Making a difference since 2015
            </Badge>
          </AnimatedContainer>

          <AnimatedContainer delay={0.2}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Sponsor a Child,
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
                Change a Life
              </span>
            </h1>
          </AnimatedContainer>

          <AnimatedContainer delay={0.3}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Join our community of compassionate sponsors providing education, healthcare, 
              and hope to children in need. Your monthly contribution creates lasting change.
            </p>
          </AnimatedContainer>

          <AnimatedContainer delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?mode=register">
                <Button size="lg" className="text-lg px-8 group" data-testid="button-sponsor-now">
                  Sponsor Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8" onClick={scrollToContent} data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </AnimatedContainer>

          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            onClick={scrollToContent}
          >
            <ChevronDown className="w-8 h-8 text-muted-foreground" />
          </motion.div>
        </motion.div>

        <motion.div
          className="absolute -bottom-20 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent"
          style={{ opacity: heroOpacity }}
        />
      </section>

      <section id="about" className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <AnimatedContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How Your Support Helps</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Every sponsorship provides comprehensive support covering a child's essential needs
              </p>
            </div>
          </AnimatedContainer>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <HoverScale>
                  <Card className="h-full border-border/50 bg-card/80 backdrop-blur">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <feature.icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </HoverScale>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section id="impact" className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Impact</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Together with our sponsors, we're creating lasting change in communities worldwide
              </p>
            </div>
          </AnimatedContainer>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {impactStats.map((stat) => (
              <StaggerItem key={stat.label}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50"
                >
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section id="children" className="py-24 bg-card/50">
        <div className="container mx-auto px-4">
          <AnimatedContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Children Waiting for Sponsors</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These children are waiting for someone special like you to change their lives
              </p>
            </div>
          </AnimatedContainer>

          {children && children.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {children.slice(0, 3).map((child) => (
                <StaggerItem key={child.id}>
                  <HoverScale>
                    <Card className="overflow-hidden group">
                      <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        {child.photoUrl ? (
                          <img
                            src={child.photoUrl}
                            alt={`${child.firstName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-16 h-16 text-muted-foreground/50" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-1">{child.firstName}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{child.location}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {child.story}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">${child.monthlyAmount}/month</span>
                          <Link href="/auth?mode=register">
                            <Button size="sm" data-testid={`button-sponsor-child-${child.id}`}>
                              Sponsor
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </HoverScale>
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Loading children...</p>
            </div>
          )}

          <AnimatedContainer delay={0.4}>
            <div className="text-center mt-12">
              <Link href="/auth?mode=register">
                <Button size="lg" variant="outline" data-testid="button-view-all-children">
                  View All Children
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </AnimatedContainer>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <AnimatedContainer>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Sponsors Say</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Hear from our community of sponsors about their experience
              </p>
            </div>
          </AnimatedContainer>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <StaggerItem key={index}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} className="w-4 h-4 text-primary" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <AnimatedContainer>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Start your sponsorship journey today and become part of a child's story of hope and transformation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth?mode=register">
                <Button size="lg" className="text-lg px-8" data-testid="button-start-sponsoring">
                  <Heart className="mr-2 w-5 h-5" />
                  Start Sponsoring
                </Button>
              </Link>
            </div>
          </AnimatedContainer>
        </div>
      </section>

      <section className="py-16 bg-card border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">HopeConnect</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Creating sustainable, long-term impact through child sponsorship programs.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#impact" className="hover:text-foreground transition-colors">Our Impact</a></li>
                <li><a href="#children" className="hover:text-foreground transition-colors">Sponsor a Child</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Contact Us</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">FAQ</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Trust & Transparency</h4>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Verified Nonprofit
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Monthly Progress Reports
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  Secure Payments
                </div>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} HopeConnect. All rights reserved. A JTT Initiative.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
