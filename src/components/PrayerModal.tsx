import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock prayer data
const mockPrayers = [
  {
    id: "1",
    name: "Maria",
    text: "Bitte betet für meine Familie, dass wir in dieser schweren Zeit zusammenhalten und Gottes Führung spüren können.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    reactions: [
      { emoji: "🙏", text: "Wir beten mit dir", count: 12 },
      { emoji: "❤️", text: "", count: 8 },
      { emoji: "✝️", text: "Der Herr ist mit euch", count: 3 },
    ],
  },
  {
    id: "2",
    name: "Johannes",
    text: "Danke für eure Gebete! Meine Operation ist gut verlaufen. Gott ist treu!",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    reactions: [
      { emoji: "🎉", text: "Halleluja!", count: 24 },
      { emoji: "🙏", text: "", count: 15 },
      { emoji: "❤️", text: "So wunderbar", count: 9 },
    ],
  },
  {
    id: "3",
    name: "Ruth",
    text: "Betet bitte für meinen Sohn, der seinen Glaubensweg sucht. Möge der Heilige Geist sein Herz berühren.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    reactions: [
      { emoji: "🙏", text: "", count: 18 },
      { emoji: "🕊️", text: "Der Geist wirkt", count: 7 },
    ],
  },
  {
    id: "4",
    name: "David",
    text: "Ich bin dankbar für diese Gemeinschaft. Betet für unsere Gemeinde, dass wir weiter wachsen und Menschen erreichen können.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    reactions: [
      { emoji: "❤️", text: "", count: 31 },
      { emoji: "🙏", text: "Amen!", count: 22 },
      { emoji: "🌟", text: "", count: 11 },
    ],
  },
  {
    id: "5",
    name: "Sarah",
    text: "Bitte betet für Frieden in der Welt und für alle, die unter Krieg und Verfolgung leiden.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    reactions: [
      { emoji: "🙏", text: "", count: 45 },
      { emoji: "🕊️", text: "Friede sei mit euch", count: 28 },
      { emoji: "❤️", text: "", count: 19 },
    ],
  },
];

const availableEmojis = ["🙏", "❤️", "🕊️", "✝️", "🎉", "🌟", "💪", "🤗"];

interface Reaction {
  emoji: string;
  text: string;
  count: number;
}

interface Prayer {
  id: string;
  name: string;
  text: string;
  createdAt: Date;
  reactions: Reaction[];
}

interface PrayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `vor ${diffMins} Minuten`;
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours > 1 ? "n" : ""}`;
  return `vor ${diffDays} Tag${diffDays > 1 ? "en" : ""}`;
};

const PrayerModal = ({ open, onOpenChange }: PrayerModalProps) => {
  const [prayers, setPrayers] = useState<Prayer[]>(mockPrayers);
  const [newPrayerText, setNewPrayerText] = useState("");
  const [newPrayerName, setNewPrayerName] = useState("");
  const [activeReactionPrayerId, setActiveReactionPrayerId] = useState<string | null>(null);
  const [reactionText, setReactionText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmitPrayer = () => {
    if (!newPrayerText.trim() || !newPrayerName.trim()) {
      toast({
        title: "Bitte fülle alle Felder aus",
        description: "Name und Gebetsanliegen sind erforderlich.",
        variant: "destructive",
      });
      return;
    }

    const newPrayer: Prayer = {
      id: Date.now().toString(),
      name: newPrayerName.trim(),
      text: newPrayerText.trim(),
      createdAt: new Date(),
      reactions: [],
    };

    setPrayers([newPrayer, ...prayers]);
    setNewPrayerText("");
    setNewPrayerName("");
    toast({
      title: "Gebet geteilt",
      description: "Dein Gebetsanliegen wurde mit der Gemeinschaft geteilt.",
    });
  };

  const handleReaction = (prayerId: string, emoji: string, text: string) => {
    setPrayers((prev) =>
      prev.map((prayer) => {
        if (prayer.id !== prayerId) return prayer;

        const existingReactionIdx = prayer.reactions.findIndex((r) => r.emoji === emoji);
        if (existingReactionIdx >= 0) {
          const updatedReactions = [...prayer.reactions];
          updatedReactions[existingReactionIdx] = {
            ...updatedReactions[existingReactionIdx],
            count: updatedReactions[existingReactionIdx].count + 1,
            text: text || updatedReactions[existingReactionIdx].text,
          };
          return { ...prayer, reactions: updatedReactions };
        } else {
          return {
            ...prayer,
            reactions: [...prayer.reactions, { emoji, text, count: 1 }],
          };
        }
      })
    );

    setActiveReactionPrayerId(null);
    setSelectedEmoji(null);
    setReactionText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary/20" />
            Gebetsfluss
          </DialogTitle>
          <p className="text-muted-foreground text-sm">
            Teile dein Gebetsanliegen oder bete für andere Geschwister.
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4 h-[50vh]">
          <div className="space-y-4 py-4">
            <AnimatePresence mode="popLayout">
              {prayers.map((prayer, index) => (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-card border border-border/50 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-foreground">{prayer.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {formatTimeAgo(prayer.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-foreground/90 leading-relaxed">{prayer.text}</p>

                  {/* Reactions */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {prayer.reactions.map((reaction, idx) => (
                      <motion.button
                        key={`${reaction.emoji}-${idx}`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleReaction(prayer.id, reaction.emoji, "")}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm"
                        title={reaction.text || undefined}
                      >
                        <span>{reaction.emoji}</span>
                        <span className="text-muted-foreground">{reaction.count}</span>
                      </motion.button>
                    ))}

                    {/* Add reaction button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setActiveReactionPrayerId(
                          activeReactionPrayerId === prayer.id ? null : prayer.id
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-border hover:border-primary/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      <span>+</span>
                      <span>🙏</span>
                    </motion.button>
                  </div>

                  {/* Reaction picker */}
                  <AnimatePresence>
                    {activeReactionPrayerId === prayer.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 border-t border-border/50 space-y-3">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Kurze Nachricht (optional)..."
                              value={reactionText}
                              onChange={(e) => setReactionText(e.target.value)}
                              maxLength={50}
                              className="flex-1 text-sm"
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {availableEmojis.map((emoji) => (
                              <motion.button
                                key={emoji}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleReaction(prayer.id, emoji, reactionText)}
                                className="text-2xl p-1 rounded-lg transition-colors hover:bg-muted"
                              >
                                {emoji}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Submit prayer form */}
        <div className="border-t border-border pt-4 space-y-3">
          <h4 className="font-semibold text-foreground">Gebetsanliegen teilen</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Dein Name"
              value={newPrayerName}
              onChange={(e) => setNewPrayerName(e.target.value)}
              maxLength={50}
              className="w-1/3"
            />
            <div className="flex-1 relative">
              <Textarea
                placeholder="Teile dein Gebetsanliegen mit der Gemeinschaft..."
                value={newPrayerText}
                onChange={(e) => setNewPrayerText(e.target.value)}
                maxLength={1000}
                className="min-h-[80px] resize-none pr-16"
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {newPrayerText.length}/1000
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitPrayer}
              disabled={!newPrayerText.trim() || !newPrayerName.trim()}
              className="bg-gradient-warm text-white hover:shadow-hover transition-all duration-300"
            >
              <Send className="w-4 h-4 mr-2" />
              Gebet teilen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrayerModal;
