import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AnimatedContainer,
  PageTransition,
} from "@/components/animated-container";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  ArrowLeft,
  Loader2,
} from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "support@hopeconnect.org",
    description: "Send us an email anytime",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+1 (555) 123-4567",
    description: "Mon-Fri, 9am-5pm EST",
  },
  {
    icon: MapPin,
    title: "Office",
    value: "123 Hope Street",
    description: "New York, NY 10001",
  },
  {
    icon: Clock,
    title: "Response Time",
    value: "Within 24 hours",
    description: "We aim to respond quickly",
  },
];

const faqs = [
  {
    question: "How do I sponsor a child?",
    answer: "Simply create an account, browse available children, and select the one you'd like to sponsor. You can then set up monthly payments through our secure payment system.",
  },
  {
    question: "Can I cancel my sponsorship?",
    answer: "Yes, you can cancel your sponsorship at any time from your dashboard. However, we encourage sponsors to maintain their commitment as children rely on consistent support.",
  },
  {
    question: "How will I know my donation is being used properly?",
    answer: "You'll receive monthly progress reports with photos and updates about your sponsored child. Our organization is fully transparent about fund allocation.",
  },
  {
    question: "Can I contact my sponsored child?",
    answer: "Yes! Through the platform, you can send messages that will be translated and delivered to your sponsored child. They can respond through their local coordinator.",
  },
];

export default function ContactPage() {
  const { toast } = useToast();

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Message Sent",
        description: data.message || "Thank you for contacting us. We'll get back to you soon!",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

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
                <Button variant="ghost" data-testid="button-back-home">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12">
          <AnimatedContainer>
            <div className="text-center mb-12">
              <MessageSquare className="w-16 h-16 text-primary mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-4">Contact & Support</h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Have questions about sponsoring a child or need help with your account? 
                We're here to help you make a difference.
              </p>
            </div>
          </AnimatedContainer>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <AnimatedContainer delay={0.1}>
              <Card>
                <CardHeader>
                  <CardTitle>Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} data-testid="input-contact-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} data-testid="input-contact-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="How can we help?" {...field} data-testid="input-contact-subject" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us more about your question or concern..." 
                                rows={5}
                                {...field} 
                                data-testid="input-contact-message"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={contactMutation.isPending} data-testid="button-send-message">
                        {contactMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </AnimatedContainer>

            <div className="space-y-6">
              <AnimatedContainer delay={0.2}>
                <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
                <div className="grid grid-cols-2 gap-4">
                  {contactInfo.map((info, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <info.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{info.title}</p>
                          <p className="text-sm text-primary">{info.value}</p>
                          <p className="text-xs text-muted-foreground">{info.description}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </AnimatedContainer>
            </div>
          </div>

          <AnimatedContainer delay={0.3}>
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-semibold text-center mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground text-sm">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </AnimatedContainer>
        </main>

        <footer className="py-8 border-t mt-12">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} HopeConnect. All rights reserved. A JTT Initiative.</p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
