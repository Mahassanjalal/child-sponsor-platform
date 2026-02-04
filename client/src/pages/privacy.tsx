import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageTransition, AnimatedContainer } from "@/components/animated-container";
import { Heart, ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
              <Shield className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </AnimatedContainer>

          <AnimatedContainer delay={0.1}>
            <Card>
              <CardContent className="p-8 prose prose-gray dark:prose-invert max-w-none">
                <h2>1. Introduction</h2>
                <p>
                  HopeConnect ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our child sponsorship platform.
                </p>

                <h2>2. Information We Collect</h2>
                
                <h3>2.1 Personal Information You Provide</h3>
                <p>We collect information you voluntarily provide, including:</p>
                <ul>
                  <li><strong>Account Information:</strong> Name, email address, password, phone number, and mailing address</li>
                  <li><strong>Payment Information:</strong> Credit card details (processed securely through Stripe)</li>
                  <li><strong>Communication Data:</strong> Messages sent through our contact form</li>
                  <li><strong>Profile Information:</strong> Avatar images and profile preferences</li>
                </ul>

                <h3>2.2 Information Automatically Collected</h3>
                <p>When you use our Platform, we automatically collect:</p>
                <ul>
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent on pages</li>
                  <li>Referring website addresses</li>
                </ul>

                <h3>2.3 Cookies and Tracking Technologies</h3>
                <p>
                  We use cookies and similar technologies to maintain your session, remember your preferences, and improve your experience. You can control cookies through your browser settings.
                </p>

                <h2>3. How We Use Your Information</h2>
                <p>We use collected information to:</p>
                <ul>
                  <li>Create and manage your account</li>
                  <li>Process sponsorship payments</li>
                  <li>Send you updates about your sponsored children</li>
                  <li>Respond to your inquiries and support requests</li>
                  <li>Send administrative communications (receipts, policy updates)</li>
                  <li>Improve our Platform and services</li>
                  <li>Prevent fraud and ensure security</li>
                  <li>Comply with legal obligations</li>
                </ul>

                <h2>4. Information Sharing</h2>
                <p>We may share your information with:</p>
                <ul>
                  <li><strong>Payment Processors:</strong> Stripe processes payments securely; we don't store full credit card numbers</li>
                  <li><strong>Email Service Providers:</strong> To send transactional and notification emails</li>
                  <li><strong>Field Partners:</strong> Limited information needed to coordinate sponsorship programs</li>
                  <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                </ul>
                <p>We never sell your personal information to third parties.</p>

                <h2>5. Data Security</h2>
                <p>We implement appropriate security measures including:</p>
                <ul>
                  <li>Encryption of data in transit (HTTPS/TLS)</li>
                  <li>Secure password hashing</li>
                  <li>Regular security assessments</li>
                  <li>Access controls and authentication</li>
                  <li>PCI-compliant payment processing through Stripe</li>
                </ul>
                <p>
                  While we strive to protect your data, no method of transmission over the Internet is 100% secure.
                </p>

                <h2>6. Your Rights and Choices</h2>
                <p>You have the right to:</p>
                <ul>
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correct:</strong> Update inaccurate information through your profile</li>
                  <li><strong>Delete:</strong> Request deletion of your account (subject to legal retention requirements)</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Export:</strong> Receive your data in a portable format</li>
                </ul>
                <p>
                  To exercise these rights, contact us at privacy@hopeconnect.org.
                </p>

                <h2>7. Data Retention</h2>
                <p>
                  We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. Specifically:
                </p>
                <ul>
                  <li>Account data: Until you delete your account</li>
                  <li>Payment records: 7 years for tax and legal compliance</li>
                  <li>Communication records: 3 years</li>
                  <li>Sponsorship history: Indefinitely (for program continuity)</li>
                </ul>

                <h2>8. Children's Privacy</h2>
                <p>
                  Our Platform is not intended for children under 18. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately.
                </p>

                <h2>9. International Data Transfers</h2>
                <p>
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.
                </p>

                <h2>10. Third-Party Links</h2>
                <p>
                  Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of these sites. Please review their privacy policies separately.
                </p>

                <h2>11. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy periodically. We will notify you of significant changes via email or prominent notice on our Platform. Your continued use after changes indicates acceptance of the updated policy.
                </p>

                <h2>12. Contact Us</h2>
                <p>For privacy-related questions or concerns, contact us at:</p>
                <ul>
                  <li>Email: privacy@hopeconnect.org</li>
                  <li>Address: 123 Hope Street, New York, NY 10001</li>
                </ul>

                <h2>13. GDPR Rights (EU Residents)</h2>
                <p>If you are a resident of the European Union, you have additional rights under GDPR:</p>
                <ul>
                  <li>Right to be informed about data processing</li>
                  <li>Right to restrict processing</li>
                  <li>Right to object to processing</li>
                  <li>Right to lodge a complaint with a supervisory authority</li>
                </ul>

                <h2>14. CCPA Rights (California Residents)</h2>
                <p>California residents have the right to:</p>
                <ul>
                  <li>Know what personal information is collected</li>
                  <li>Know if personal information is sold or disclosed</li>
                  <li>Say no to the sale of personal information</li>
                  <li>Access their personal information</li>
                  <li>Equal service and price, even after exercising privacy rights</li>
                </ul>

                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    By using HopeConnect, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of your information as described herein.
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
