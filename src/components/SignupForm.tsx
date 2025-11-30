import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ArrowRight } from "lucide-react";
import { MessageCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Questionnaire from "@/components/Questionnaire";
const SignupForm = () => {
  const [contact, setContact] = useState("");
  const [service, setService] = useState<"sms" | "whatsapp">("sms");
  const [message, setMessage] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [acceptedIntent, setAcceptedIntent] = useState(false);
  const {
    toast
  } = useToast();
  const contactInputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setShowQuestionnaire(true);
  };
  const handleQuestionnaireComplete = async (answers: Record<string, string | null>) => {
    setShowQuestionnaire(false);
    setIsSubmitting(true);
    try {
      // Build query parameters
      let url = `https://komm-folge-mir-nach.de/join.php?to=${service}&mobile=${encodeURIComponent(contact)}`;
      if (message.trim()) {
        url += `&message=${encodeURIComponent(message)}`;
      }
      if (inviteCode.trim()) {
        url += `&code=${encodeURIComponent(inviteCode)}`;
      }
      const response = await fetch(url, {
        method: "GET"
      });
      const data = await response.json();
      const serviceName = service === "sms" ? "SMS" : "WhatsApp";
      if (data.success) {
        toast({
          title: "Erfolg!",
          description: data.message || `Wir haben dir eine ${serviceName}-Nachricht an ${contact} gesendet mit einem Link zur Community.`
        });
        setContact("");
        setMessage("");
        setInviteCode("");
      } else {
        toast({
          title: "Fehler",
          description: data.message || `Es gab ein Problem beim Versenden der ${serviceName}-Nachricht.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: `Es gab ein Problem beim Versenden der ${service === "sms" ? "SMS" : "WhatsApp-Nachricht"}.`,
        variant: "destructive"
      });
    }
    setIsSubmitting(false);
  };
  return <section id="signup" className="py-24 md:py-40 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-soft" />
      <div className="absolute top-0 left-0 right-0 h-[40vh] bg-gradient-glow opacity-50" />
      
      <div className="container px-6 md:px-12 relative z-10">
        <motion.div initial={{
        opacity: 0,
        y: 30
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} transition={{
        duration: 0.8
      }} className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{
            width: 0
          }} whileInView={{
            width: "80px"
          }} viewport={{
            once: true
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }} className="h-1 bg-gradient-warm mx-auto mb-8 rounded-full" />
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground tracking-tight">
              Werde Teil der Gemeinschaft
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-2xl mx-auto">Erhalte Zugang zu unserer Gemeinschaft und folge dem Weg des Herrn Jesus gemeinsam mit Brüdern und Schwestern.</p>
          </div>

          <AnimatePresence mode="wait">
            {!showForm ? <motion.div key="checkbox" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} exit={{
            opacity: 0,
            y: -20,
            scale: 0.95
          }} transition={{
            duration: 0.5
          }} className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-warm opacity-10 blur-2xl rounded-3xl group-hover:opacity-20 transition-opacity duration-500" />
              
              {/* Intent Card */}
              <div className="relative bg-card rounded-3xl p-12 md:p-16 shadow-elegant border border-border/50">
                <div className="flex flex-col items-center text-center space-y-8">
                  <motion.div initial={{
                  scale: 0.9,
                  opacity: 0
                }} animate={{
                  scale: 1,
                  opacity: 1
                }} transition={{
                  duration: 0.5,
                  delay: 0.5
                }} className="w-20 h-20 rounded-full bg-gradient-warm flex items-center justify-center shadow-elegant">
                    <MessageSquare className="w-10 h-10 text-white" strokeWidth={2} />
                  </motion.div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-foreground max-w-xl leading-tight">Ich möchte Jesus in Gemeinschaft nachfolgen und erkläre:</h3>
                  
                  <motion.p initial={{
                  opacity: 0
                }} animate={{
                  opacity: 1
                }} transition={{
                  delay: 0.7,
                  duration: 0.6
                }} className="text-sm md:text-base text-muted-foreground text-center leading-relaxed max-w-2xl px-4">Ich glaube an Jesus Christus den fleischgewordenen Sohn Gottes, der zur Vergebung meiner Sünden am Kreuz gestorben und am dritten Tag von den Toten auferstanden ist. Ich möchte Sein Geschenk annehmen und von meinen alten sündigen Wegen umkehren und Ihm mit ganzem Herzen und ganzer Seele nachfolgen.</motion.p>
                  
                  <motion.div whileHover={{
                  scale: 1.02
                }} whileTap={{
                  scale: 0.98
                }} className="flex items-center space-x-4 cursor-pointer p-6 rounded-2xl bg-muted/30 border-2 border-border hover:border-primary transition-all" onClick={() => {
                  setAcceptedIntent(!acceptedIntent);
                  if (!acceptedIntent) {
                    setTimeout(() => setShowForm(true), 300);
                  }
                }}>
                    <Checkbox id="intent" checked={acceptedIntent} onCheckedChange={checked => {
                    setAcceptedIntent(checked as boolean);
                    if (checked) {
                      setTimeout(() => setShowForm(true), 300);
                    }
                  }} className="h-8 w-8 border-2" />
                    <Label htmlFor="intent" className="text-xl md:text-2xl font-semibold cursor-pointer">
                      Ja, ich möchte dabei sein
                    </Label>
                  </motion.div>
                </div>
              </div>
            </motion.div> : <motion.div key="form" initial={{
            opacity: 0,
            y: 30,
            scale: 0.95
          }} animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }} exit={{
            opacity: 0,
            y: 20
          }} transition={{
            duration: 0.5,
            ease: "easeOut"
          }} onAnimationComplete={() => {
            contactInputRef.current?.focus();
          }} className="relative group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-warm opacity-10 blur-2xl rounded-3xl group-hover:opacity-20 transition-opacity duration-500" />
              
              {/* Card */}
              <div className="relative bg-card rounded-3xl p-8 md:p-12 shadow-elegant border border-border/50">
                <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-5">
                  <Label className="text-lg md:text-xl font-semibold text-foreground">
                    Wie möchtest du kontaktiert werden?
                  </Label>
                  <RadioGroup value={service} onValueChange={value => setService(value as "sms" | "whatsapp")} className="grid grid-cols-2 gap-4">
                    <Label htmlFor="sms" className="cursor-pointer">
                      <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 transition-all p-8 ${service === "sms" ? "border-primary bg-primary/5" : "border-border bg-background/50 hover:border-primary/50"}`}>
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-soft transition-all ${service === "sms" ? "bg-gradient-warm" : "bg-muted"}`}>
                          <MessageSquare className={`w-7 h-7 ${service === "sms" ? "text-white" : "text-muted-foreground"}`} strokeWidth={2} />
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="sms" id="sms" />
                          <span className="font-semibold text-lg">SMS</span>
                        </div>
                      </div>
                    </Label>
                    <Label htmlFor="whatsapp" className="cursor-pointer">
                      <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 transition-all p-8 ${service === "whatsapp" ? "border-primary bg-primary/5" : "border-border bg-background/50 hover:border-primary/50"}`}>
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-soft transition-all ${service === "whatsapp" ? "bg-gradient-warm" : "bg-muted"}`}>
                          <MessageCircle className={`w-7 h-7 ${service === "whatsapp" ? "text-white" : "text-muted-foreground"}`} strokeWidth={2} />
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="whatsapp" id="whatsapp" />
                          <span className="font-semibold text-lg">WhatsApp</span>
                        </div>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="contact" className="text-lg md:text-xl font-semibold text-foreground">
                    Deine Handynummer
                  </Label>
                  <Input ref={contactInputRef} id="contact" type="tel" placeholder="+49 123 456789" value={contact} onChange={e => setContact(e.target.value)} required className="h-16 text-lg rounded-2xl border-2 focus:border-primary transition-colors bg-background/50" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="inviteCode" className="text-base md:text-lg font-semibold text-foreground">
                    Einladecode <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input id="inviteCode" type="text" placeholder="ABC123" value={inviteCode} onChange={e => setInviteCode(e.target.value.slice(0, 8))} maxLength={8} className="h-14 text-lg rounded-2xl border-2 focus:border-primary transition-colors bg-background/50" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-base md:text-lg font-semibold text-foreground">
                    Deine Nachricht <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Textarea id="message" placeholder="Teile uns etwas über dich mit oder stelle eine Frage..." value={message} onChange={e => setMessage(e.target.value)} rows={4} className="text-base rounded-2xl border-2 focus:border-primary transition-colors bg-background/50 resize-none" />
                </div>

                <motion.div whileHover={{
                  scale: 1.02
                }} whileTap={{
                  scale: 0.98
                }}>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-16 text-lg bg-gradient-warm hover:shadow-hover transition-all duration-300 rounded-2xl font-semibold shadow-elegant text-white border-0 relative overflow-hidden group">
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {isSubmitting ? "Wird gesendet..." : <>
                          Community-Link erhalten
                          <motion.span animate={{
                          x: [0, 5, 0]
                        }} transition={{
                          duration: 1.5,
                          repeat: Infinity
                        }}>
                            <ArrowRight className="w-6 h-6" strokeWidth={2.5} />
                          </motion.span>
                        </>}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </motion.div>
              </form>

              <motion.div initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} transition={{
                delay: 0.5
              }} className="mt-8 space-y-4">
                <p className="text-sm md:text-base text-muted-foreground text-center leading-relaxed">
                  Du erhältst eine Nachricht mit einem persönlichen Link zu unserer Community-Webseite
                </p>
                <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                  <p className="text-xs md:text-sm text-muted-foreground text-center leading-relaxed">
                    🔒 <strong>Datenschutz:</strong> Deine Nummer wird nicht gespeichert und es wird keinerlei Werbung verschickt. 
                    Du erhältst ausschließlich den Link zur Community zum Schutz der Gemeinschaft.
                    Zum Verarbeiten und Versand der Nachricht werden Twilio und WhatsApp Cloud API verwendet. 
                    Deine Nummer wird an diese Dienste übermittelt.
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>}
          </AnimatePresence>
        </motion.div>
      </div>

      <Questionnaire open={showQuestionnaire} onComplete={handleQuestionnaireComplete} onOpenChange={setShowQuestionnaire} />
    </section>;
};
export default SignupForm;