import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Send, X, User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Checkbox } from "@/components/ui/checkbox";

// Mock prayer data
const mockPrayers = [
  {
    id: "1",
    name: "Maria",
    text: "Bitte betet für meine Familie, dass wir in dieser schweren Zeit zusammenhalten und Gottes Führung spüren können.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    reactions: [
      { emoji: "🙏", count: 12, comments: [{ emoji: "🙏", text: "Wir beten mit dir", name: "Anna", color: "#10b981", creatorUsername: "anna_user" }], userReactions: ["user1", "user2", "user3", "user4", "user5", "user6", "user7", "user8", "user9", "user10", "user11", "user12"] },
      { emoji: "❤️", count: 8, comments: [], userReactions: ["user13", "user14", "user15", "user16", "user17", "user18", "user19", "user20"] },
      { emoji: "✝️", count: 3, comments: [{ emoji: "✝️", text: "Der Herr ist mit euch", name: "Peter", color: "#ef4444", creatorUsername: "peter_user" }], userReactions: ["user21", "user22", "user23"] },
    ],
    creatorUsername: "maria_user",
  },
  {
    id: "2",
    name: "Johannes",
    text: "Danke für eure Gebete! Meine Operation ist gut verlaufen. Gott ist treu!",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    reactions: [
      { emoji: "🎉", count: 24, comments: [{ emoji: "🎉", text: "Halleluja!", name: "Lisa", color: "#f59e0b", creatorUsername: "lisa_user" }], userReactions: ["user24", "user25", "user26", "user27", "user28", "user29", "user30", "user31", "user32", "user33", "user34", "user35", "user36", "user37", "user38", "user39", "user40", "user41", "user42", "user43", "user44", "user45", "user46", "user47"] },
      { emoji: "🙏", count: 15, comments: [], userReactions: ["user48", "user49", "user50", "user51", "user52", "user53", "user54", "user55", "user56", "user57", "user58", "user59", "user60", "user61", "user62"] },
      { emoji: "❤️", count: 9, comments: [{ emoji: "❤️", text: "So wunderbar", name: "Thomas", color: "#8b5cf6", creatorUsername: "thomas_user" }], userReactions: ["user63", "user64", "user65", "user66", "user67", "user68", "user69", "user70", "user71"] },
    ],
    creatorUsername: "johannes_user",
  },
  {
    id: "3",
    name: "Ruth",
    text: "Betet bitte für meinen Sohn, der seinen Glaubensweg sucht. Möge der Heilige Geist sein Herz berühren.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    reactions: [
      { emoji: "🙏", count: 18, comments: [], userReactions: ["user72", "user73", "user74", "user75", "user76", "user77", "user78", "user79", "user80", "user81", "user82", "user83", "user84", "user85", "user86", "user87", "user88", "user89"] },
      { emoji: "🕊️", count: 7, comments: [{ emoji: "🕊️", text: "Der Geist wirkt", name: "Michael", color: "#ec4899", creatorUsername: "michael_user" }], userReactions: ["user90", "user91", "user92", "user93", "user94", "user95", "user96"] },
    ],
    creatorUsername: "ruth_user",
  },
  {
    id: "4",
    name: "David",
    text: "Ich bin dankbar für diese Gemeinschaft. Betet für unsere Gemeinde, dass wir weiter wachsen und Menschen erreichen können.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    reactions: [
      { emoji: "❤️", count: 31, comments: [], userReactions: ["user97", "user98", "user99", "user100", "user101", "user102", "user103", "user104", "user105", "user106", "user107", "user108", "user109", "user110", "user111", "user112", "user113", "user114", "user115", "user116", "user117", "user118", "user119", "user120", "user121", "user122", "user123", "user124", "user125", "user126", "user127"] },
      { emoji: "🙏", count: 22, comments: [{ emoji: "🙏", text: "Amen!", name: "Sarah", color: "#06b6d4", creatorUsername: "sarah_user" }], userReactions: ["user128", "user129", "user130", "user131", "user132", "user133", "user134", "user135", "user136", "user137", "user138", "user139", "user140", "user141", "user142", "user143", "user144", "user145", "user146", "user147", "user148", "user149"] },
      { emoji: "🌟", count: 11, comments: [], userReactions: ["user150", "user151", "user152", "user153", "user154", "user155", "user156", "user157", "user158", "user159", "user160"] },
    ],
    creatorUsername: "david_user",
  },
  {
    id: "5",
    name: "Sarah",
    text: "Bitte betet für Frieden in der Welt und für alle, die unter Krieg und Verfolgung leiden.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    reactions: [
      { emoji: "🙏", count: 45, comments: [], userReactions: ["user161", "user162", "user163", "user164", "user165", "user166", "user167", "user168", "user169", "user170", "user171", "user172", "user173", "user174", "user175", "user176", "user177", "user178", "user179", "user180", "user181", "user182", "user183", "user184", "user185", "user186", "user187", "user188", "user189", "user190", "user191", "user192", "user193", "user194", "user195", "user196", "user197", "user198", "user199", "user200", "user201", "user202", "user203", "user204", "user205"] },
      { emoji: "🕊️", count: 28, comments: [{ emoji: "🕊️", text: "Friede sei mit euch", name: "Johannes", color: "#84cc16", creatorUsername: "johannes_user" }], userReactions: ["user206", "user207", "user208", "user209", "user210", "user211", "user212", "user213", "user214", "user215", "user216", "user217", "user218", "user219", "user220", "user221", "user222", "user223", "user224", "user225", "user226", "user227", "user228", "user229", "user230", "user231", "user232", "user233"] },
      { emoji: "❤️", count: 19, comments: [], userReactions: ["user234", "user235", "user236", "user237", "user238", "user239", "user240", "user241", "user242", "user243", "user244", "user245", "user246", "user247", "user248", "user249", "user250", "user251", "user252"] },
    ],
    creatorUsername: "sarah_user",
  },
];

const availableEmojis = ["🙏", "❤️", "🕊️", "✝️", "🎉", "🌟", "💪", "🤗", "❓", "💬"];

interface IndividualReaction {
  emoji: string;
  text: string;
  name: string;
  color?: string;
  creatorUsername: string;
}

interface Reaction {
  emoji: string;
  count: number;
  comments: IndividualReaction[];
  userReactions: string[]; // Array of usernames who reacted with this emoji
}

interface Prayer {
  id: string;
  name: string;
  text: string;
  createdAt: Date;
  reactions: Reaction[];
  userColor?: string;
  userAvatar?: string;
  verified?: boolean;
  creatorUsername?: string;
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
  const [activeReactionPrayerId, setActiveReactionPrayerId] = useState<string | null>(null);
  const [reactionText, setReactionText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    name: string;
    email?: string;
    phone?: string;
    color: string;
    avatar: string;
    password?: string;
    notifications?: boolean;
    verified?: boolean;
  } | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [signupData, setSignupData] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    color: "#3b82f6",
    avatar: "🙏",
    notifications: false,
  });
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [showVerification, setShowVerification] = useState(false);
  const [prayerFilter, setPrayerFilter] = useState<'all' | 'own' | 'unanswered' | 'unseen' | 'seen'>('all');
  const [hashtagSearch, setHashtagSearch] = useState('');
  const { toast } = useToast();

  // Extract hashtags from text
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? [...new Set(matches)] : []; // Remove duplicates
  };

  const handleSubmitPrayer = () => {
    if (!currentUser) {
      setShowSignup(true);
      return;
    }

    if (!newPrayerText.trim()) {
      toast({
        title: "Bitte fülle alle Felder aus",
        description: "Gebetsanliegen ist erforderlich.",
        variant: "destructive",
      });
      return;
    }

    const newPrayer: Prayer = {
      id: Date.now().toString(),
      name: currentUser.name,
      text: newPrayerText.trim(),
      createdAt: new Date(),
      reactions: [],
      userColor: currentUser.color,
      userAvatar: currentUser.avatar,
      verified: currentUser.verified || false,
      creatorUsername: currentUser.username,
    };

    setPrayers([newPrayer, ...prayers]);
    setNewPrayerText("");
    toast({
      title: "Gebet geteilt",
      description: "Dein Gebetsanliegen wurde mit der Gemeinschaft geteilt.",
    });
  };

  const handleReaction = (prayerId: string, emoji: string, text: string) => {
    if (!currentUser) {
      toast({
        title: "Anmeldung erforderlich",
        description: text.trim() ? "Bitte melde dich an, um Kommentare hinzuzufügen." : "Bitte melde dich an, um zu reagieren.",
        variant: "destructive",
      });
      return;
    }

    setPrayers((prev) =>
      prev.map((prayer) => {
        if (prayer.id !== prayerId) return prayer;

        const existingReactionIdx = prayer.reactions.findIndex((r) => r.emoji === emoji);
        if (existingReactionIdx >= 0) {
          const updatedReactions = [...prayer.reactions];
          const existingReaction = updatedReactions[existingReactionIdx];

          // Check if current user already reacted with this emoji
          const userAlreadyReacted = existingReaction.userReactions.includes(currentUser!.username);

          if (text.trim()) {
            // Add to comments array (comments don't count as regular reactions)
            updatedReactions[existingReactionIdx] = {
              ...existingReaction,
              count: existingReaction.count + 1,
              comments: [...existingReaction.comments, {
                emoji,
                text: text.trim(),
                name: currentUser!.name,
                color: currentUser!.color,
                creatorUsername: currentUser!.username
              }],
            };
          } else if (userAlreadyReacted) {
            // User is removing their reaction - remove from userReactions and decrement count
            const newUserReactions = existingReaction.userReactions.filter(username => username !== currentUser!.username);
            const newCount = existingReaction.count - 1;

            if (newCount <= 0) {
              // Remove the entire reaction if no reactions left
              updatedReactions.splice(existingReactionIdx, 1);
            } else {
              updatedReactions[existingReactionIdx] = {
                ...existingReaction,
                count: newCount,
                userReactions: newUserReactions,
              };
            }
          } else {
            // User is adding a new reaction
            updatedReactions[existingReactionIdx] = {
              ...existingReaction,
              count: existingReaction.count + 1,
              userReactions: [...existingReaction.userReactions, currentUser!.username],
            };
          }

          return { ...prayer, reactions: updatedReactions };
        } else {
          // New reaction
          if (text.trim()) {
            return {
              ...prayer,
              reactions: [...prayer.reactions, {
                emoji,
                count: 1,
                comments: [{
                  emoji,
                  text: text.trim(),
                  name: currentUser!.name,
                  color: currentUser!.color,
                  creatorUsername: currentUser!.username
                }],
                userReactions: [],
              }],
            };
          } else {
            return {
              ...prayer,
              reactions: [...prayer.reactions, {
                emoji,
                count: 1,
                comments: [],
                userReactions: [currentUser!.username]
              }],
            };
          }
        }
      })
    );

    setActiveReactionPrayerId(null);
    setSelectedEmoji(null);
    setReactionText("");
  };

  const handleRemoveComment = (prayerId: string, emoji: string, commentIndex: number) => {
    setPrayers((prev) =>
      prev.map((prayer) => {
        if (prayer.id !== prayerId) return prayer;

        const reactionIdx = prayer.reactions.findIndex((r) => r.emoji === emoji);
        if (reactionIdx >= 0) {
          const updatedReactions = [...prayer.reactions];
          const reaction = updatedReactions[reactionIdx];
          const updatedComments = [...reaction.comments];
          updatedComments.splice(commentIndex, 1);

          // Update count: count = comments.length + (count - old comments.length)
          const oldCommentCount = reaction.comments.length;
          const newCount = updatedComments.length + (reaction.count - oldCommentCount);

          if (newCount <= 0) {
            // Remove the entire reaction if no reactions left
            updatedReactions.splice(reactionIdx, 1);
          } else {
            updatedReactions[reactionIdx] = {
              ...reaction,
              count: newCount,
              comments: updatedComments,
            };
          }

          return { ...prayer, reactions: updatedReactions };
        }
        return prayer;
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary fill-primary/20" />
            Gebetsfluss
          </DialogTitle>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Teile dein Gebetsanliegen oder bete für andere Geschwister.
            </p>
            <div className="flex items-center gap-2">
              {currentUser ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: currentUser.color + '20', color: currentUser.color }}
                  >
                    {currentUser.avatar}
                  </div>
                  <span className="text-sm font-medium">{currentUser.name}</span>
                  {currentUser.verified && (
                    <span className="ml-1 text-green-500" title="Verifiziert">
                      ✓
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentUser(null)}
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoginMode(false);
                    setShowSignup(true);
                  }}
                  className="bg-gradient-warm text-white hover:shadow-hover transition-all duration-300"
                >
                  <User className="w-4 h-4 mr-2" />
                  Anmelden
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Prayer Filter */}
        {currentUser && (
          <div className="border-b border-border pb-3">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-nowrap px-1">
              {[
                { key: 'all', label: 'Alle', count: prayers.length },
                { key: 'unanswered', label: 'Unbeantwortete', count: prayers.filter(p => p.reactions.length === 0).length },
                { key: 'unseen', label: 'Ungesehene', count: prayers.filter(p => !p.reactions.some(r => r.userReactions.includes(currentUser.username))).length },
                { key: 'seen', label: 'Gesehene', count: prayers.filter(p => p.reactions.some(r => r.userReactions.includes(currentUser.username))).length },
                { key: 'own', label: 'Eigene', count: prayers.filter(p => p.creatorUsername === currentUser.username).length }
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setPrayerFilter(key as any)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    prayerFilter === key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hashtag Search */}
        {currentUser && (
          <div className="border-b border-border pb-3">
            <Input
              placeholder="Suche nach Hashtags (z.B. #familie #gesundheit) - UND-Verknüpfung"
              value={hashtagSearch}
              onChange={(e) => setHashtagSearch(e.target.value)}
              className="text-sm"
            />
          </div>
        )}

        <ScrollArea className="flex-1 pr-4 -mr-4 min-h-0">
          <div className="space-y-4 py-4">
            <AnimatePresence mode="popLayout">
              {prayers
                .filter(prayer => {
                  if (!currentUser) return true; // Show all if not logged in

                  // Apply prayer filter
                  let passesFilter = true;
                  switch (prayerFilter) {
                    case 'own':
                      passesFilter = prayer.creatorUsername === currentUser.username;
                      break;
                    case 'unanswered':
                      passesFilter = prayer.reactions.length === 0;
                      break;
                    case 'unseen':
                      passesFilter = !prayer.reactions.some(r => r.userReactions.includes(currentUser.username));
                      break;
                    case 'seen':
                      passesFilter = prayer.reactions.some(r => r.userReactions.includes(currentUser.username));
                      break;
                    default:
                      passesFilter = true;
                  }

                  if (!passesFilter) return false;

                  // Apply hashtag filter (AND logic)
                  if (hashtagSearch.trim()) {
                    const searchHashtags = hashtagSearch.trim().split(/\s+/).filter(tag => tag.startsWith('#'));
                    const prayerHashtags = extractHashtags(prayer.text);

                    // All search hashtags must be present in prayer hashtags (AND logic)
                    const hasAllHashtags = searchHashtags.every(searchTag =>
                      prayerHashtags.some(prayerTag => prayerTag.toLowerCase() === searchTag.toLowerCase())
                    );

                    return hasAllHashtags;
                  }

                  return true;
                })
                .map((prayer, index) => (
                <motion.div
                  key={prayer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-card border border-border/50 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {prayer.userAvatar && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                          style={{
                            backgroundColor: (prayer.userColor || '#3b82f6') + '20',
                            color: prayer.userColor || '#3b82f6'
                          }}
                        >
                          {prayer.userAvatar}
                        </div>
                      )}
                      <span
                        className="font-semibold flex items-center gap-1"
                        style={{ color: prayer.userColor || 'inherit' }}
                      >
                        {prayer.name}
                        {prayer.verified && (
                          <span className="text-green-500 text-xs" title="Verifiziert">
                            ✓
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {formatTimeAgo(prayer.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-foreground/90 leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-code:text-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground/90 prose-li:marker:text-muted-foreground">
                    <ReactMarkdown
                      components={{
                        ul: ({children, ...props}) => (
                          <ul className="list-disc list-inside space-y-1 my-2" {...props}>
                            {children}
                          </ul>
                        ),
                        ol: ({children, ...props}) => (
                          <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
                            {children}
                          </ol>
                        ),
                        li: ({children, ...props}) => (
                          <li className="leading-relaxed" {...props}>
                            {children}
                          </li>
                        ),
                      }}
                    >
                      {prayer.text}
                    </ReactMarkdown>
                  </div>

                  {/* Hashtags */}
                  {(() => {
                    const hashtags = extractHashtags(prayer.text);
                    return hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {hashtags.map((hashtag, idx) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded-md cursor-pointer hover:bg-primary/20 transition-colors"
                            onClick={() => setHashtagSearch(prev => prev ? `${prev} ${hashtag}` : hashtag)}
                          >
                            {hashtag}
                          </span>
                        ))}
                      </div>
                    );
                  })()}

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

                  {/* Comments with emojis */}
                  {prayer.reactions.some(reaction => reaction.comments.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <div className="space-y-2">
                        {prayer.reactions
                          .flatMap((reaction, reactionIdx) =>
                            reaction.comments.map((comment, commentIdx) => ({
                              comment,
                              reactionIdx,
                              commentIdx,
                              reactionEmoji: reaction.emoji
                            }))
                          )
                          .map(({ comment, reactionIdx, commentIdx, reactionEmoji }, idx) => {
                            const canRemove = currentUser && (
                              currentUser.username === comment.creatorUsername ||
                              currentUser.username === prayer.creatorUsername
                            );

                            return (
                              <div key={`${comment.emoji}-comment-${idx}`} className="flex items-start gap-2 text-sm group">
                                <span className="text-lg">{comment.emoji}</span>
                                <div className="flex-1">
                                  <span className="text-muted-foreground italic">"{comment.text}"</span>
                                  <span
                                    className="text-muted-foreground/70 text-xs ml-1"
                                    style={{ color: comment.color || undefined }}
                                  >
                                    - {comment.name}
                                  </span>
                                </div>
                                {canRemove && (
                                  <button
                                    onClick={() => handleRemoveComment(prayer.id, reactionEmoji, commentIdx)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded"
                                    title="Kommentar entfernen"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

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
                              maxLength={100}
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

        {/* Submit prayer form - Chat-like design */}
        <div className="border-t border-border pt-3">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                placeholder="Teile dein Gebetsanliegen..."
                value={newPrayerText}
                onChange={(e) => setNewPrayerText(e.target.value)}
                maxLength={500}
                className="min-h-[40px] max-h-[120px] resize-none pr-12 text-sm leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault();
                    if (newPrayerText.trim()) {
                      handleSubmitPrayer();
                    }
                  }
                }}
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {newPrayerText.length}/500
              </span>
            </div>
            <Button
              onClick={handleSubmitPrayer}
              disabled={!newPrayerText.trim()}
              size="sm"
              className="bg-gradient-warm text-white hover:shadow-hover transition-all duration-300 h-10 w-10 p-0 shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Signup Modal */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {isLoginMode ? "Einloggen" : "Anmeldung für Gebetsfluss"}
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              {isLoginMode
                ? "Melde dich an, um am Gebetsfluss teilzunehmen."
                : "Erstelle dein Profil, um am Gebetsfluss teilzunehmen."
              }
            </p>
          </DialogHeader>

          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => {
                setIsLoginMode(false);
                setLoginData({ email: "", phone: "", password: "" });
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                !isLoginMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrieren
            </button>
            <button
              onClick={() => {
                setIsLoginMode(true);
                setSignupData({ username: "", name: "", email: "", phone: "", password: "", color: "#3b82f6", avatar: "🙏", notifications: false });
              }}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isLoginMode ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Einloggen
            </button>
          </div>

          <div className="space-y-4">
            {isLoginMode ? (
              // Login Form
              <>
                <div>
                  <label className="text-sm font-medium">Benutzername</label>
                  <Input
                    placeholder="Dein Benutzername"
                    value={loginData.username}
                    onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Passwort</label>
                  <Input
                    type="password"
                    placeholder="Passwort eingeben"
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowSignup(false)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={() => {
                      if (!loginData.username.trim() || !loginData.password.trim()) {
                        toast({
                          title: "Bitte fülle alle Felder aus",
                          description: "Benutzername und Passwort sind erforderlich.",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Mock login - in real app this would verify credentials
                      // For now, just create a user with default settings
                      setCurrentUser({
                        username: loginData.username.trim(),
                        name: loginData.username.trim(), // Use username as display name for now
                        email: undefined, // In real app, this would come from DB
                        phone: undefined,
                        color: "#3b82f6",
                        avatar: "🙏",
                        password: loginData.password,
                        notifications: true,
                      });

                      setLoginData({ username: "", password: "" });

                      toast({
                        title: "Willkommen zurück!",
                        description: "Du bist wieder im Gebetsfluss angemeldet.",
                      });

                      setShowSignup(false);

                      // Now submit the prayer that triggered login
                      if (newPrayerText.trim()) {
                        handleSubmitPrayer();
                      }
                    }}
                    className="flex-1 bg-gradient-warm text-white"
                  >
                    Einloggen
                  </Button>
                </div>
              </>
            ) : (
              // Signup Form
              <>
                <div>
                  <label className="text-sm font-medium">Benutzername</label>
                  <Input
                    placeholder="Wähle einen Benutzernamen"
                    value={signupData.username}
                    onChange={(e) => setSignupData(prev => ({ ...prev, username: e.target.value }))}
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Anzeigename (optional)</label>
                  <Input
                    placeholder="Dein Anzeigename"
                    value={signupData.name}
                    onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                    maxLength={30}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">E-Mail (optional)</label>
                    <Input
                      placeholder="email@beispiel.de"
                      type="email"
                      value={signupData.email}
                      onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefon (optional)</label>
                    <Input
                      placeholder="+49..."
                      type="tel"
                      value={signupData.phone}
                      onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Passwort</label>
                  <Input
                    type="password"
                    placeholder="Passwort eingeben"
                    value={signupData.password}
                    onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                    minLength={6}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={signupData.notifications}
                    onCheckedChange={(checked) => setSignupData(prev => ({ ...prev, notifications: checked as boolean }))}
                  />
                  <label htmlFor="notifications" className="text-sm text-muted-foreground cursor-pointer">
                    Benachrichtigungen erhalten (z.B. Antworten auf Gebete)
                  </label>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Deine Farbe</label>
                  <div className="flex gap-2 flex-wrap">
                    {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"].map((color) => (
                      <button
                        key={color}
                        onClick={() => setSignupData(prev => ({ ...prev, color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          signupData.color === color ? "border-foreground scale-110" : "border-border"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Avatar</label>
                  <div className="flex gap-2 flex-wrap">
                    {["🙏", "❤️", "🕊️", "✝️", "🌟", "💪", "🤗", "🙌", "🙋‍♀️", "🙋‍♂️"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setSignupData(prev => ({ ...prev, avatar: emoji }))}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${
                          signupData.avatar === emoji ? "border-primary scale-110 bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowSignup(false)}
                    className="flex-1"
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={() => {
                      if (!signupData.username.trim() || !signupData.password.trim()) {
                        toast({
                          title: "Bitte fülle alle erforderlichen Felder aus",
                          description: "Benutzername und Passwort sind erforderlich.",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Check if user provided phone number for verification
                      const hasPhoneNumber = signupData.phone.trim();

                      // Mock signup - in real app this would send activation link
                      setCurrentUser({
                        username: signupData.username.trim(),
                        name: signupData.name.trim() || signupData.username.trim(), // Use username as fallback for display name
                        email: signupData.email.trim() || undefined,
                        phone: signupData.phone.trim() || undefined,
                        color: signupData.color,
                        avatar: signupData.avatar,
                        password: signupData.password, // In real app, this would be hashed
                        notifications: signupData.notifications,
                        verified: false, // Will be set to true after verification
                      });

                      setSignupData({ username: "", name: "", email: "", phone: "", password: "", color: "#3b82f6", avatar: "🙏", notifications: false });

                      if (hasPhoneNumber) {
                        // Show verification modal for users who provided phone
                        setShowSignup(false);
                        setShowVerification(true);
                      } else {
                        // Skip verification for users without phone
                        toast({
                          title: "Willkommen!",
                          description: "Du bist jetzt im Gebetsfluss angemeldet.",
                        });
                        setShowSignup(false);

                        // Now submit the prayer that triggered signup
                        if (newPrayerText.trim()) {
                          handleSubmitPrayer();
                        }
                      }
                    }}
                    className="flex-1 bg-gradient-warm text-white"
                  >
                    Anmelden
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Modal */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-green-500" />
              Verifizierung
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Wir haben dir eine SMS mit einem Verifizierungslink an deine Telefonnummer gesendet.
            </p>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Empfänger:</strong> {currentUser?.phone}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Klicke auf den Link in der SMS, um dein Konto zu verifizieren und ein Verifizierungszeichen zu erhalten.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerification(false);
                  toast({
                    title: "Willkommen!",
                    description: "Du bist jetzt im Gebetsfluss angemeldet.",
                  });
                  // Now submit the prayer that triggered signup
                  if (newPrayerText.trim()) {
                    handleSubmitPrayer();
                  }
                }}
                className="flex-1"
              >
                Überspringen
              </Button>
              <Button
                onClick={() => {
                  // Mock verification - in real app this would verify the user
                  if (currentUser) {
                    setCurrentUser(prev => prev ? { ...prev, verified: true } : null);
                  }
                  setShowVerification(false);
                  toast({
                    title: "Verifiziert! ✅",
                    description: "Dein Konto wurde erfolgreich verifiziert.",
                  });
                  // Now submit the prayer that triggered signup
                  if (newPrayerText.trim()) {
                    handleSubmitPrayer();
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Link geklickt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default PrayerModal;
