import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageTransition, AnimatedContainer } from "@/components/animated-container";
import { Heart, ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
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

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <AnimatedContainer>
            <div className="text-center mb-12">
              <FileText className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </AnimatedContainer>

          <AnimatedContainer delay={0.1}>
            <Card>
              <CardContent className="p-8 prose prose-gray dark:prose-invert max-w-none">
                <h2>1. Acceptance of Terms</h2>
                <p>
                  By accessing and using HopeConnect ("the Platform"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use this Platform.
                </p>

                <h2>2. Description of Service</h2>
                <p>
                  HopeConnect is a child sponsorship platform that connects sponsors with children in need of educational support. Our services include:
                </p>
                <ul>
                  <li>Facilitating connections between sponsors and children</li>
                  <li>Processing secure payments for sponsorships</li>
                  <li>Providing progress reports and updates on sponsored children</li>
                  <li>Managing sponsor accounts and sponsorship history</li>
                </ul>

                <h2>3. User Accounts</h2>
                <p>
                  To use certain features of the Platform, you must register for an account. You agree to:
                </p>
                <ul>
                  <li>Provide accurate, current, and complete information during registration</li>
                  <li>Maintain and promptly update your account information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>

                <h2>4. Sponsorship Payments</h2>
                <p>
                  By initiating a sponsorship, you agree to:
                </p>
                <ul>
                  <li>Pay the specified monthly or one-time amount</li>
                  <li>Provide accurate payment information</li>
                  <li>Authorize recurring charges for monthly sponsorships until cancelled</li>
                </ul>
                <p>
                  Sponsorships can be cancelled at any time through your dashboard. Refunds are handled on a case-by-case basis.
                </p>

                <h2>5. Fund Allocation</h2>
                <p>
                  We commit to using sponsorship funds for the benefit of children, including:
                </p>
                <ul>
                  <li>Educational expenses (tuition, supplies, uniforms)</li>
                  <li>Healthcare and nutritional support</li>
                  <li>Community development programs</li>
                  <li>Administrative costs necessary to operate the program</li>
                </ul>

                <h2>6. Privacy and Data Protection</h2>
                <p>
                  Your privacy is important to us. Please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to understand how we collect, use, and protect your personal information.
                </p>

                <h2>7. Prohibited Conduct</h2>
                <p>
                  You agree not to:
                </p>
                <ul>
                  <li>Use the Platform for any unlawful purpose</li>
                  <li>Attempt to gain unauthorized access to any part of the Platform</li>
                  <li>Interfere with the proper functioning of the Platform</li>
                  <li>Upload or transmit viruses or malicious code</li>
                  <li>Impersonate another person or entity</li>
                  <li>Harvest or collect user information without consent</li>
                </ul>

                <h2>8. Intellectual Property</h2>
                <p>
                  All content on the Platform, including text, graphics, logos, and software, is the property of HopeConnect or its licensors and is protected by intellectual property laws.
                </p>

                <h2>9. Limitation of Liability</h2>
                <p>
                  HopeConnect shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Platform. Our total liability shall not exceed the amount you have paid to us in the twelve months preceding the claim.
                </p>

                <h2>10. Modifications to Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Platform. Continued use after changes constitutes acceptance of the modified terms.
                </p>

                <h2>11. Termination</h2>
                <p>
                  We may terminate or suspend your account at any time for violations of these terms. You may also delete your account at any time through your profile settings, subject to any active sponsorship obligations.
                </p>

                <h2>12. Governing Law</h2>
                <p>
                  These terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
                </p>

                <h2>13. Contact Information</h2>
                <p>
                  For questions about these Terms of Service, please contact us at:
                </p>
                <ul>
                  <li>Email: legal@hopeconnect.org</li>
                  <li>Address: 123 Hope Street, New York, NY 10001</li>
                </ul>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    By using HopeConnect, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                  </p>
                </div>
              </CardContent>
            </Card>
          </AnimatedContainer>
        </main>

        <footer className="py-8 border-t mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <div className="flex justify-center gap-6 mb-4">
              <Link href="/terms" className="hover:text-primary">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
              <Link href="/contact" className="hover:text-primary">Contact Us</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} HopeConnect. All rights reserved. A JTT Initiative.</p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
