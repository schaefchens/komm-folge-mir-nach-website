import Hero from "@/components/Hero";
import CommunityInfo from "@/components/CommunityInfo";
import SignupForm from "@/components/SignupForm";
import { motion } from "framer-motion";
const Index = () => {
  return <main className="min-h-screen">
      <Hero />
      <CommunityInfo />
      <SignupForm />
      
      <footer className="relative bg-card py-12 border-t border-border/50 overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-soft opacity-50" />
        
        <div className="container px-6 relative z-10">
          <div className="text-center space-y-4">
            <motion.div initial={{
            width: 0
          }} whileInView={{
            width: "60px"
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.8
          }} className="h-0.5 bg-gradient-warm mx-auto mb-6 rounded-full opacity-60" />
            
            <p className="text-muted-foreground text-sm md:text-base font-light">
              © 2024 komm-folge-mir-nach.de
            </p>
            <p className="text-muted-foreground/70 text-xs md:text-sm font-light">Eine Gemeinschaft von Brüdern in der Nachfolge Jesu</p>
          </div>
        </div>
      </footer>
    </main>;
};
export default Index;