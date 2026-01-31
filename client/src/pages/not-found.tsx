import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Home, Heart } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4"
      >
        <Card className="border-border/50">
          <CardContent className="pt-8 pb-6 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
            >
              <Heart className="h-10 w-10 text-primary" />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
            <p className="text-lg text-muted-foreground mb-6">
              Oops! This page doesn't exist.
            </p>

            <Link href="/">
              <Button className="gap-2" data-testid="button-go-home">
                <Home className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
