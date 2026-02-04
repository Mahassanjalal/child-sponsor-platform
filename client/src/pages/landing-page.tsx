import { Link } from "wouter";
import { motion } from "framer-motion";
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
  ArrowRight,
  GraduationCap,
  BookX,
  Hammer,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Child } from "@shared/schema";

import heroChildImage from "@/assets/images/hero-child.jpg";
import crisisImage1 from "@/assets/images/education-crisis_1.jpg";
import crisisImage2 from "@/assets/images/education-crisis_2.jpg";
import crisisImage3 from "@/assets/images/education-crisis_3.jpg";
import crisisImage4 from "@/assets/images/education-crisis_4.jpg";

const educationConsequences = [
  { image: crisisImage1, label: "School fees unpaid", icon: BookX },
  { image: crisisImage2, label: "Children leave classrooms", icon: GraduationCap },
  { image: crisisImage3, label: "Forced into labor", icon: Hammer },
  { image: crisisImage4, label: "Childhood ends early", icon: Clock },
];

const programFeatures = [
  "Children Stay in School",
  "Monthly Support Tracked",
  "Transparent Progress Updates",
];

export default function LandingPage() {
  const { data: children } = useQuery<Child[]>({
    queryKey: ["/api/children/featured"],
  });

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#f5f0e8]/90 border-b border-[#d4c9b8]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <motion.div 
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c45a2c] to-[#4a7c59] flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#2d2d2d]">
                HopeConnect
              </span>
            </motion.div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-sm text-[#5a5a5a] hover:text-[#2d2d2d] transition-colors" data-testid="link-about">
              About
            </a>
            <a href="#how-it-works" className="text-sm text-[#5a5a5a] hover:text-[#2d2d2d] transition-colors" data-testid="link-how-it-works">
              How It Works
            </a>
            <a href="#faqs" className="text-sm text-[#5a5a5a] hover:text-[#2d2d2d] transition-colors" data-testid="link-faqs">
              FAQs
            </a>
            <a href="#contact" className="text-sm text-[#5a5a5a] hover:text-[#2d2d2d] transition-colors" data-testid="link-contact">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/auth">
              <Button variant="outline" className="border-[#c45a2c] text-[#c45a2c] hover:bg-[#c45a2c] hover:text-white" data-testid="button-login">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen pt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url(${heroChildImage})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#3d3024]/90 via-[#3d3024]/70 to-transparent" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 pt-20 md:pt-32 pb-20">
          <div className="max-w-2xl">
            <AnimatedContainer delay={0.1}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Some children don't go to school.
                <br />
                <span className="text-[#e8ddd0]">They go to work.</span>
              </h1>
            </AnimatedContainer>

            <AnimatedContainer delay={0.2}>
              <p className="text-lg md:text-xl text-[#d4c9b8] max-w-xl mb-8">
                In Pakistan, many orphaned children are forced to collect garbage to survive.
                Education is their only way out.
              </p>
            </AnimatedContainer>

            <AnimatedContainer delay={0.3}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth?mode=register">
                  <Button 
                    size="lg" 
                    className="bg-[#c45a2c] hover:bg-[#a84a22] text-white text-lg px-8 border-2 border-[#c45a2c]" 
                    data-testid="button-sponsor-education"
                  >
                    Sponsor a Child's Education
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 bg-transparent" 
                    data-testid="button-learn-how"
                  >
                    Learn How It Works
                  </Button>
                </a>
              </div>
            </AnimatedContainer>
          </div>
        </div>
      </section>

      <section id="about" className="py-20 bg-[#f5f0e8]">
        <div className="container mx-auto px-4">
          <AnimatedContainer>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#2d2d2d] mb-16">
              What happens when education stops?
            </h2>
          </AnimatedContainer>

          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {educationConsequences.map((item, index) => (
              <StaggerItem key={index}>
                <motion.div 
                  className="text-center"
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="relative mb-4 rounded-lg overflow-hidden aspect-[4/3]">
                    <img 
                      src={item.image} 
                      alt={item.label}
                      className="w-full h-full object-cover sepia-[0.3]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                  <p className="text-sm md:text-base text-[#5a5a5a] font-medium">{item.label}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      <section className="py-20 bg-[#ebe4d8]">
        <div className="container mx-auto px-4 text-center">
          <AnimatedContainer>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2d2d2d] mb-6">
              Education can't wait for sponsorship.
            </h2>
            <p className="text-lg text-[#5a5a5a] max-w-2xl mx-auto mb-6">
              Kids can't pause their lives. That's why we keep them in school while
              they wait for sponsors to commit.
            </p>
            <p className="text-xl font-semibold text-[#c45a2c] italic">
              Every month of school matters.
            </p>
          </AnimatedContainer>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-[#f5f0e8]">
        <div className="container mx-auto px-4">
          <AnimatedContainer>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-[#2d2d2d] mb-4">
              How We Ensure Education Continues
            </h2>
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-16">
              {programFeatures.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center gap-2 text-[#c45a2c]"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm md:text-base font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
          </AnimatedContainer>

          {children && children.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {children.slice(0, 3).map((child) => {
                const age = Math.floor((new Date().getTime() - new Date(child.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                return (
                  <StaggerItem key={child.id}>
                    <HoverScale>
                      <Card className="overflow-hidden bg-white border-[#d4c9b8] shadow-lg">
                        <div className="relative aspect-[3/4] bg-gradient-to-br from-[#d4c9b8] to-[#c4b9a8]">
                          {child.photoUrl ? (
                            <img
                              src={child.photoUrl}
                              alt={`${child.firstName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users className="w-20 h-20 text-[#8a7d6d]" />
                            </div>
                          )}
                        </div>
                        <CardContent className="p-5 bg-white">
                          <h3 className="text-xl font-bold text-[#2d2d2d]">{child.firstName}</h3>
                          <p className="text-sm text-[#5a5a5a] mb-3">Age {age}</p>
                          <Badge 
                            className={child.isSponsored 
                              ? "bg-[#4a7c59] text-white border-none mb-3" 
                              : "bg-[#c45a2c] text-white border-none mb-3"
                            }
                          >
                            {child.isSponsored ? "Early Supported" : "Needs Sponsor"}
                          </Badge>
                          <p className="text-sm text-[#5a5a5a]">
                            Education: <span className="font-semibold text-[#2d2d2d]">${child.monthlyAmount} / month</span>
                          </p>
                        </CardContent>
                      </Card>
                    </HoverScale>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-[#8a7d6d] mx-auto mb-4" />
              <p className="text-[#5a5a5a]">Loading children...</p>
            </div>
          )}

          <AnimatedContainer delay={0.3}>
            <div className="text-center">
              <Link href="/auth?mode=register">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-[#c45a2c] text-[#c45a2c] hover:bg-[#c45a2c] hover:text-white"
                  data-testid="button-view-all-children"
                >
                  View All Children
                </Button>
              </Link>
            </div>
          </AnimatedContainer>
        </div>
      </section>

      <section className="py-24 bg-[#ebe4d8]">
        <div className="container mx-auto px-4 text-center">
          <AnimatedContainer>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#2d2d2d] mb-8">
              You can keep a child in school and out of child labor.
            </h2>
            <Link href="/auth?mode=register">
              <Button 
                size="lg" 
                className="bg-[#2d2d2d] hover:bg-[#1a1a1a] text-white text-lg px-10 py-6"
                data-testid="button-sponsor-today"
              >
                Sponsor a Child Today
              </Button>
            </Link>
            <p className="text-[#5a5a5a] mt-6 text-lg">
              Make a difference. Change a future.
            </p>
          </AnimatedContainer>
        </div>
      </section>

      <footer className="py-8 bg-[#f5f0e8] border-t border-[#d4c9b8]">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 mb-6">
            <a href="#about" className="text-sm text-[#5a5a5a] hover:text-[#2d2d2d] transition-colors">
              About
            </a>
            <a href="#how-it-works" className="text-sm text-[#5a5a5a] hover:text-[#2d2d2d] transition-colors">
              How It Works
            </a>
            <a href="#faqs" className="text-sm text-[#5a5a5a] hover:text-[#2d2d2d] transition-colors">
              FAQs
            </a>
            <a href="#contact" className="text-sm text-[#5a5a5a] hover:text-[#2d2d2d] transition-colors">
              Contact
            </a>
          </div>
          <div className="text-center text-sm text-[#8a7d6d]">
            <p>&copy; {new Date().getFullYear()} JTT Foundation. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
