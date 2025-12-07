import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, ArrowRight, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Questionnaire from "@/components/Questionnaire";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SignupForm = () => {
  const [contact, setContact] = useState("");
  const [service, setService] = useState<"sms" | "email">("sms");
  const [message, setMessage] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [acceptedIntent, setAcceptedIntent] = useState(false);
  const [showEmailOption, setShowEmailOption] = useState(false);
  const [showEmailWarningModal, setShowEmailWarningModal] = useState(false);
  const [showFullPrivacy, setShowFullPrivacy] = useState(false);
  const [questionnaireResults, setQuestionnaireResults] = useState<any[] | null>(null);
  const [questionnaireScore, setQuestionnaireScore] = useState<number | null>(null);
  const [questionnaireAssessment, setQuestionnaireAssessment] = useState<string | null>(null);
  const {
    toast
  } = useToast();
  const contactInputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) return;
    setShowQuestionnaire(true);
  };
  const handleQuestionnaireComplete = async (
    answers: Record<string, string | null>,
    score?: number,
    assessment?: string,
    results?: any[]
  ) => {
    // Store questionnaire results for later use
    setQuestionnaireResults(results);
    setQuestionnaireScore(score);
    setQuestionnaireAssessment(assessment);
  };

  const handleProceedToSignup = async (resultsSummary: string) => {
    setShowQuestionnaire(false);
    setIsSubmitting(true);
    try {
      // Build query parameters
      const contactParam = service === "sms" ? "mobile" : "email";
      let url = `https://komm-folge-mir-nach.de/join.php?to=${service}&${contactParam}=${encodeURIComponent(contact)}`;
      if (message.trim()) {
        url += `&message=${encodeURIComponent(message)}`;
      }
      if (inviteCode.trim()) {
        url += `&code=${encodeURIComponent(inviteCode)}`;
      }
      // Add questionnaire results
      url += `&questionnaire_results=${resultsSummary}`;

      const response = await fetch(url, {
        method: "GET"
      });
      const data = await response.json();
      const serviceName = service === "sms" ? "SMS" : "E-Mail";
      if (data.success) {
        toast({
          title: "Erfolg!",
          description: data.message || `Wir haben dir eine ${serviceName}-Nachricht an ${contact} gesendet mit einem Link zur Community.`
        });
        setContact("");
        setMessage("");
        setInviteCode("");
        // Reset questionnaire state
        setQuestionnaireResults(null);
        setQuestionnaireScore(null);
        setQuestionnaireAssessment(null);
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
        description: `Es gab ein Problem beim Versenden der ${service === "sms" ? "SMS" : "E-Mail"}.`,
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
                }} className="text-sm md:text-base text-muted-foreground text-center leading-relaxed max-w-2xl px-4">"Ich glaube an Jesus Christus den fleischgewordenen Sohn Gottes, der zur Vergebung meiner Sünden am Kreuz gestorben und am dritten Tag von den Toten auferstanden ist. Ich möchte Sein Geschenk annehmen und von meinen alten sündigen Wegen umkehren und Ihm mit ganzem Herzen und ganzer Seele nachfolgen."</motion.p>
                  
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
                      Ja, ich will
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
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">Du erhältst eine persönliche Nachricht mit einem Link zu unserer Webseite und Community. Dies dient dem Schutz der Gemeinschaft.</p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <Label htmlFor="sms" className="cursor-pointer block">
                      <input type="radio" id="sms" name="service" value="sms" checked={service === "sms"} onChange={() => { setService("sms"); setContact(""); }} className="sr-only" />
                      <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 transition-all p-8 ${service === "sms" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-soft transition-all ${service === "sms" ? "bg-gradient-warm" : "bg-muted"}`}>
                          <MessageSquare className={`w-7 h-7 ${service === "sms" ? "text-white" : "text-muted-foreground"}`} strokeWidth={2} />
                        </div>
                        <span className="font-semibold text-lg">SMS</span>
                      </div>
                    </Label>
                    
                    <AnimatePresence>
                      {showEmailOption && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Label htmlFor="email" className="cursor-pointer block">
                            <input type="radio" id="email" name="service" value="email" checked={service === "email"} onChange={() => { setService("email"); setContact(""); }} className="sr-only" />
                            <div className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 transition-all p-8 ${service === "email" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-soft transition-all ${service === "email" ? "bg-gradient-warm" : "bg-muted"}`}>
                                <Mail className={`w-7 h-7 ${service === "email" ? "text-white" : "text-muted-foreground"}`} strokeWidth={2} />
                              </div>
                              <span className="font-semibold text-lg">E-Mail</span>
                            </div>
                          </Label>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {!showEmailOption && (
                    <button
                      type="button"
                      onClick={() => setShowEmailWarningModal(true)}
                      className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    >
                      Ich kann SMS nicht empfangen
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="contact" className="text-lg md:text-xl font-semibold text-foreground">
                    {service === "sms" ? "Deine Handynummer" : "Deine E-Mail-Adresse"}
                  </Label>
                  <Input 
                    ref={contactInputRef} 
                    id="contact" 
                    type={service === "sms" ? "tel" : "email"} 
                    placeholder={service === "sms" ? "+49 123 456789" : "deine@email.de"} 
                    value={contact} 
                    onChange={e => setContact(e.target.value)} 
                    required 
                    className="h-16 text-lg rounded-2xl border-2 focus:border-primary transition-colors bg-background/50" 
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-base md:text-lg font-semibold text-foreground">
                    Deine Nachricht {service === "email" ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal">(optional)</span>}
                  </Label>
                  <Textarea 
                    id="message" 
                    placeholder={service === "email" ? "Bitte erzähle uns etwas über dich und deinen Glaubensweg..." : "Teile uns etwas über dich mit oder stelle eine Frage..."} 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    required={service === "email"}
                    rows={4} 
                    className="text-base rounded-2xl border-2 focus:border-primary transition-colors bg-background/50 resize-none" 
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="inviteCode" className="text-base md:text-lg font-semibold text-foreground">
                    Einladecode <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input id="inviteCode" type="text" placeholder="ABC123" value={inviteCode} onChange={e => setInviteCode(e.target.value.slice(0, 8))} maxLength={8} className="h-14 text-lg rounded-2xl border-2 focus:border-primary transition-colors bg-background/50" />
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
              }} className="mt-8">
                <div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
                  <p className="text-xs md:text-sm text-muted-foreground text-center leading-relaxed">
                    🔒 <strong>Datenschutz:</strong> Deine Kontaktdaten werden nicht gespeichert und es wird keinerlei Werbung verschickt.
                    {showFullPrivacy ? (
                      <>
                        {" "}Du erhältst ausschließlich den Link zur Community zum Schutz der Gemeinschaft.
                        Zum Verarbeiten und Versand der Nachricht wird die Hetzner Infrastruktur verwendet. 
                        Deine Daten werden einmalig zur Verarbeitung übermittelt.
                      </>
                    ) : (
                      <>
                        {" "}
                        <button
                          type="button"
                          onClick={() => setShowFullPrivacy(true)}
                          className="text-primary hover:text-primary/80 transition-colors"
                        >
                          Mehr anzeigen...
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>}
          </AnimatePresence>
        </motion.div>
      </div>

      <Questionnaire
        open={showQuestionnaire}
        onComplete={handleQuestionnaireComplete}
        onOpenChange={setShowQuestionnaire}
        onProceedToSignup={handleProceedToSignup}
      />
      
      {/* Email Warning Modal */}
      <Dialog open={showEmailWarningModal} onOpenChange={setShowEmailWarningModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Hinweis zur E-Mail-Option</DialogTitle>
            <DialogDescription className="text-base leading-relaxed pt-4 space-y-4">
              <p>
                <strong>SMS dient dem Schutz der Gemeinschaft:</strong> Da eine Handynummer schwerer zu fälschen ist, können wir schneller verifizieren, dass du eine echte Person bist.
              </p>
              <p>
                <strong>Bei E-Mail-Anmeldung:</strong> Es findet eine ausgiebigere Prüfung statt, bevor der Link zur Gemeinschaft verschickt wird. Dies kann einige Zeit in Anspruch nehmen.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEmailWarningModal(false)}
              className="w-full sm:w-auto"
            >
              Zurück
            </Button>
            <Button
              onClick={() => {
                setShowEmailWarningModal(false);
                setShowEmailOption(true);
              }}
              className="w-full sm:w-auto bg-gradient-warm text-white border-0"
            >
              Verstanden, E-Mail nutzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>;
};
export default SignupForm;