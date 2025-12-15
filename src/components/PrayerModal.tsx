import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, Send, X, User, LogOut, Search, Video, Music2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Checkbox } from "@/components/ui/checkbox";
import { apiClient, Prayer, ScheduledCall } from "@/lib/api";

interface User {
  id: string;
  username: string;
  display_name: string;
  color: string;
  avatar: string;
  verified: boolean;
  notifications?: boolean;
  phone?: string;
  email?: string;
}

const availableEmojis = ["🙏", "❤️", "🕊️", "✝️", "🎉", "🌟", "💪", "🤗", "❓", "💬"];

interface PrayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatTimeAgo = (dateInput: Date | string): string => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
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
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPrayerText, setNewPrayerText] = useState("");
  const [activeReactionPrayerId, setActiveReactionPrayerId] = useState<string | null>(null);
  const [reactionText, setReactionText] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [scheduledCall, setScheduledCall] = useState<ScheduledCall | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [hideScheduledCall, setHideScheduledCall] = useState(false);
  const [showPlayer, setShowPlayer] = useState(true);
  const { toast } = useToast();

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const existingToken = apiClient.getSessionToken();
      if (!existingToken) return;
      try {
        const response = await apiClient.currentUser();
        setCurrentUser({
          id: response.user.id,
          username: response.user.username,
          display_name: response.user.display_name,
          color: response.user.color,
          avatar: response.user.avatar,
          verified: response.user.verified,
          notifications: response.user.notifications,
          phone: response.user.phone,
          email: response.user.email,
        });
      } catch (err) {
        console.warn('Session restore failed, clearing token', err);
        apiClient.setSessionToken(null);
        setCurrentUser(null);
      }
    };
    restoreSession();
  }, []);

  const handleAuthError = (error: any) => {
    const message = error instanceof Error ? error.message : '';
    const isAuthError = message.includes('Authentication required') || message.includes('Invalid or expired session');
    if (isAuthError) {
      apiClient.setSessionToken(null);
      setCurrentUser(null);
      setShowSignup(true);
      toast({
        title: "Anmeldung erforderlich",
        description: "Bitte melde dich erneut an.",
        variant: "destructive",
      });
    }
  };

  // Load prayers and scheduled call when modal opens
  useEffect(() => {
    if (open) {
      loadPrayers();
      loadScheduledCall();
    }
  }, [open, prayerFilter, hashtagSearch]);

  // Check if scheduled call should be clickable (within 15 minutes or started)
  const isScheduledCallClickable = () => {
    return scheduledCall?.is_clickable ?? false;
  };

  const handleJoinScheduledCall = () => {
    if (!isScheduledCallClickable()) return;
    if (scheduledCall?.url) {
      window.open(scheduledCall.url, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Kein Link verfügbar",
        description: "Der Link zum Gebetsraum wurde noch nicht hinterlegt.",
      });
    }
  };

  // Update countdown every second
  useEffect(() => {
    if (!scheduledCall) return;

    const updateCountdown = () => {
      setCountdown(scheduledCall.countdown);
    };

    updateCountdown();
    const interval = setInterval(() => {
      loadScheduledCall(); // Reload to get updated countdown
    }, 10000); // Update every 10 seconds instead of every second

    return () => clearInterval(interval);
  }, [scheduledCall]);

  const loadPrayers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPrayers({
        filter: prayerFilter,
        hashtag: hashtagSearch,
        limit: 50
      });

      // Convert date strings to Date objects and ensure arrays are properly initialized
      const prayersWithDates = response.prayers.map(prayer => ({
        ...prayer,
        createdAt: new Date(prayer.createdAt),
        reactions: Array.isArray(prayer.reactions) ? prayer.reactions.map(reaction => ({
          ...reaction,
          comments: Array.isArray(reaction.comments) ? reaction.comments : [],
          userReactions: Array.isArray(reaction.userReactions) ? reaction.userReactions : []
        })) : []
      }));

      setPrayers(prayersWithDates);
    } catch (error) {
      console.error('Failed to load prayers:', error);
      handleAuthError(error);
      toast({
        title: "Fehler beim Laden",
        description: "Gebete konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledCall = async () => {
    try {
      const response = await apiClient.getScheduledCall();
      setScheduledCall(response.scheduled_call);
    } catch (error) {
      console.error('Failed to load scheduled call:', error);
    }
  };

  // Extract hashtags from text
  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[\w]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? [...new Set(matches)] : []; // Remove duplicates
  };

  const handleSubmitPrayer = async () => {
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

    try {
      const response = await apiClient.createPrayer(newPrayerText.trim());

      // Convert date string to Date object
      const prayerWithDate = {
        ...response.prayer,
        createdAt: new Date(response.prayer.createdAt)
      };

      setPrayers([prayerWithDate, ...prayers]);
      setNewPrayerText("");
      toast({
        title: "Gebet geteilt",
        description: "Dein Gebetsanliegen wurde mit der Gemeinschaft geteilt.",
      });
    } catch (error) {
      console.error('Failed to submit prayer:', error);
      handleAuthError(error);
      toast({
        title: "Fehler beim Teilen",
        description: "Dein Gebetsanliegen konnte nicht geteilt werden.",
        variant: "destructive",
      });
    }
  };

  const handleReaction = async (prayerId: string, emoji: string, text: string) => {
    if (!currentUser) {
      toast({
        title: "Anmeldung erforderlich",
        description: text.trim() ? "Bitte melde dich an, um Kommentare hinzuzufügen." : "Bitte melde dich an, um zu reagieren.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiClient.addReaction(prayerId, emoji, text.trim());
      // Update the prayer's reactions in state
      setPrayers(prev => prev.map(prayer =>
        prayer.id === prayerId
          ? { ...prayer, reactions: response.reactions }
          : prayer
      ));

      toast({
        title: text.trim() ? "Kommentar hinzugefügt" : "Reaktion hinzugefügt",
        description: text.trim() ? "Dein Kommentar wurde hinzugefügt." : "Deine Reaktion wurde hinzugefügt.",
      });
    } catch (error) {
      console.error('Failed to add reaction:', error);
      handleAuthError(error);
      toast({
        title: "Fehler",
        description: "Reaktion konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    }

    setActiveReactionPrayerId(null);
    setSelectedEmoji(null);
    setReactionText("");
  };

  const handleRemoveComment = async (prayerId: string, emoji: string, commentIndex: number) => {
    try {
      const response = await apiClient.removeComment(prayerId, emoji, commentIndex);
      // Update the prayer's reactions in state
      setPrayers(prev => prev.map(prayer =>
        prayer.id === prayerId
          ? { ...prayer, reactions: response.reactions }
          : prayer
      ));

      toast({
        title: "Kommentar entfernt",
        description: "Der Kommentar wurde erfolgreich entfernt.",
      });
    } catch (error) {
      console.error('Failed to remove comment:', error);
      handleAuthError(error);
      toast({
        title: "Fehler",
        description: "Kommentar konnte nicht entfernt werden.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[100vh] md:h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary fill-primary/20" />
              Gebetsfluss
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPlayer((prev) => !prev)}
                className="h-8 w-8 p-0"
                title={showPlayer ? "Player ausblenden" : "Player anzeigen"}
              >
                <Music2 className="w-4 h-4" />
              </Button>
              {currentUser ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: currentUser.color + '20', color: currentUser.color }}
                  >
                    {currentUser.avatar}
                  </div>
                  <span className="text-sm font-medium">{currentUser.display_name || currentUser.username}</span>
                  {currentUser.verified && (
                    <span className="ml-1 text-green-500" title="Verifiziert">
                      ✓
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      try {
                        await apiClient.logout();
                        setCurrentUser(null);
                        toast({
                          title: "Abgemeldet",
                          description: "Du wurdest erfolgreich abgemeldet.",
                        });
                      } catch (error) {
                        console.error('Logout failed:', error);
                        // Still clear local state even if API call fails
                        setCurrentUser(null);
                      }
                    }}
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
          {!currentUser && (
            <p className="text-muted-foreground text-sm">
              Teile dein Gebetsanliegen oder bete für andere Geschwister.
            </p>
          )}
        </DialogHeader>

        {/* Scheduled Prayer Call */}
        {!hideScheduledCall && (
          <div className="px-6 -mx-6">
            {scheduledCall ? (
              <div className="relative">
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-300 ${
                    isScheduledCallClickable()
                      ? 'cursor-pointer text-white bg-gradient-to-r from-red-500 via-orange-500 to-red-600 dark:from-red-600 dark:via-orange-600 dark:to-red-700 border-red-400 dark:border-red-500 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 font-semibold text-base'
                      : 'text-sm text-muted-foreground bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200/50 dark:border-blue-800/50 hover:bg-blue-100/50 dark:hover:bg-blue-950/30'
                  }`}
                  onClick={isScheduledCallClickable() ? handleJoinScheduledCall : undefined}
                >
                  <Video className={`${
                    isScheduledCallClickable() ? 'w-5 h-5 text-white' : 'w-4 h-4 text-blue-600'
                  }`} />
                  <span>
                    Gemeinsames Gebet: {new Date(scheduledCall.scheduled_at).toLocaleDateString('de-DE', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} - {countdown}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHideScheduledCall(true);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Nachricht ausblenden"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 px-4 py-2 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                  <Heart className="w-4 h-4 text-amber-600" />
                  <span>
                    Kein gemeinsames Gebet geplant. Schau bald wieder vorbei!
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHideScheduledCall(true);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Nachricht ausblenden"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Background music (YouTube) */}
        {showPlayer && (
          <div className="px-1 pb-2">
            <div className="relative overflow-hidden rounded-lg border border-border bg-muted/40">
              <iframe
                className="w-full"
                style={{ height: 80 }}
                src="https://www.youtube.com/embed/Vi_u7mg7dyo?si=cJcaIPVsbBJzLtMX"
                title="YouTube music player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        )}

        {/* Prayer Filter */}
        {currentUser && (
          <div className="border-b border-border pb-3">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-nowrap px-1 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSearchBar(!showSearchBar)}
                className="h-8 w-8 p-0 mr-2 flex-shrink-0"
              >
                <Search className="w-4 h-4" />
              </Button>
              {[
                { key: 'all', label: 'Alle', count: prayers.length },
                { key: 'unanswered', label: 'Unbeantwortete', count: prayers.filter(p => p.reactions.length === 0).length },
                { key: 'unseen', label: 'Ungesehene', count: prayers.filter(p => !p.reactions.some(r => r.userReactions && r.userReactions.includes(currentUser.username))).length },
                { key: 'seen', label: 'Gesehene', count: prayers.filter(p => p.reactions.some(r => r.userReactions && r.userReactions.includes(currentUser.username))).length },
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
        <AnimatePresence>
          {currentUser && showSearchBar && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: "12px" }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="border-b border-border pb-3">
                <div className="relative">
                  <Input
                    placeholder="Suche nach Hashtags (z.B. #familie #gesundheit) - UND-Verknüpfung"
                    value={hashtagSearch}
                    onChange={(e) => setHashtagSearch(e.target.value)}
                    className="text-sm pr-8"
                  />
                  {hashtagSearch && (
                    <button
                      onClick={() => setHashtagSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title="Suche löschen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                      passesFilter = !prayer.reactions.some(r => r.userReactions && r.userReactions.includes(currentUser.username));
                      break;
                    case 'seen':
                      passesFilter = prayer.reactions.some(r => r.userReactions && r.userReactions.includes(currentUser.username));
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
                            onClick={() => {
                              setHashtagSearch(prev => {
                                const currentHashtags = prev.trim().split(/\s+/).filter(tag => tag.startsWith('#'));
                                const hashtagLower = hashtag.toLowerCase();
                                const isAlreadyPresent = currentHashtags.some(tag => tag.toLowerCase() === hashtagLower);
                                if (isAlreadyPresent) return prev;
                                return prev ? `${prev} ${hashtag}` : hashtag;
                              });
                              setShowSearchBar(true);
                            }}
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
                        title={`${reaction.count} Reaktionen`}
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
                  {prayer.reactions.some(reaction => reaction.comments && reaction.comments.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <div className="space-y-2">
                        {prayer.reactions
                          .flatMap((reaction, reactionIdx) =>
                            (reaction.comments || []).map((comment, commentIdx) => ({
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
                                <span className="text-lg">{comment.emoji || reactionEmoji}</span>
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
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
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
          <div className="flex-shrink-0 flex rounded-lg bg-muted p-1">
            <button
              onClick={() => {
                setIsLoginMode(false);
                setLoginData({ username: "", password: "" });
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

          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4 pb-4">
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
              </>
            )}
            </div>
          </div>

          {/* Action Buttons - Always visible */}
          <div className="flex-shrink-0 flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSignup(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={async () => {
                if (isLoginMode) {
                  if (!loginData.username.trim() || !loginData.password.trim()) {
                    toast({
                      title: "Bitte fülle alle Felder aus",
                      description: "Benutzername und Passwort sind erforderlich.",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Real login via API
                  try {
                    const response = await apiClient.login({
                      username: loginData.username.trim(),
                      password: loginData.password,
                    });

                    apiClient.setSessionToken(response.session_token);

                    setCurrentUser({
                      id: response.user.id,
                      username: response.user.username,
                      display_name: response.user.display_name,
                      color: response.user.color,
                      avatar: response.user.avatar,
                      verified: response.user.verified,
                      notifications: response.user.notifications,
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
                  } catch (error) {
                    console.error('Login failed:', error);
                    toast({
                      title: "Anmeldung fehlgeschlagen",
                      description: "Bitte überprüfe deine Daten und versuche es erneut.",
                      variant: "destructive",
                    });
                  }
                } else {
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

                  // Real signup via API
                  try {
                    const response = await apiClient.register({
                      username: signupData.username.trim(),
                      name: signupData.name.trim(),
                      email: signupData.email.trim(),
                      phone: signupData.phone.trim(),
                      password: signupData.password,
                      color: signupData.color,
                      avatar: signupData.avatar,
                      notifications: signupData.notifications,
                    });

                    apiClient.setSessionToken(response.session_token);

                    setCurrentUser({
                      id: response.user.id,
                      username: response.user.username,
                      display_name: response.user.display_name,
                      color: response.user.color,
                      avatar: response.user.avatar,
                      verified: response.user.verified,
                      notifications: response.user.notifications,
                    });

                    setSignupData({ username: "", name: "", email: "", phone: "", password: "", color: "#3b82f6", avatar: "🙏", notifications: false });

                    if (response.requires_verification) {
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
                  } catch (error) {
                    console.error('Signup failed:', error);
                    toast({
                      title: "Registrierung fehlgeschlagen",
                      description: "Bitte versuche es erneut.",
                      variant: "destructive",
                    });
                  }
                }
              }}
              className="flex-1 bg-gradient-warm text-white"
            >
              {isLoginMode ? "Einloggen" : "Anmelden"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Modal */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-green-500" />
              Verifizierung
            </DialogTitle>
            <p className="text-muted-foreground text-sm">
              Wir haben dir eine SMS mit einem Verifizierungslink an deine Telefonnummer gesendet.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4 pb-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <strong>Empfänger:</strong> {currentUser?.phone}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Klicke auf den Link in der SMS, um dein Konto zu verifizieren und ein Verifizierungszeichen zu erhalten.
              </p>
            </div>

            </div>
          </div>

          {/* Verification Action Buttons - Always visible */}
          <div className="flex-shrink-0 flex gap-2 pt-4">
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
              onClick={async () => {
                try {
                  await apiClient.verifyCode('mock-token'); // In real implementation, get token from SMS
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
                } catch (error) {
                  console.error('Verification failed:', error);
                  toast({
                    title: "Verifizierung fehlgeschlagen",
                    description: "Bitte versuche es erneut.",
                    variant: "destructive",
                  });
                }
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Link geklickt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default PrayerModal;
