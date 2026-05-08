import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Loader2, Dices, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BibleVerseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BookSelection {
  id: string;
  book: string;
  chapter: string;
}

interface Verse {
  reference: string;
  text: string;
  translation: string;
}

const TRANSLATIONS = [
  "Luther",
  "Schlachter",
  "Elberfelder",
  "Neues Leben",
  "Einheitsübersetzung",
];

const STORAGE_KEY = "openai_api_key";

type ScopeMode = "whole" | "preset" | "custom";
type PresetKey = "old" | "new" | "psalms" | "proverbs";

const PRESET_LABELS: Record<PresetKey, string> = {
  old: "Altes Testament",
  new: "Neues Testament",
  psalms: "Psalmen",
  proverbs: "Sprüche",
};

const PRESET_DESCRIPTION: Record<PresetKey, string> = {
  old: "dem Alten Testament",
  new: "dem Neuen Testament",
  psalms: "dem Buch der Psalmen",
  proverbs: "dem Buch der Sprüche",
};

const BibleVerseModal = ({ open, onOpenChange }: BibleVerseModalProps) => {
  const { toast } = useToast();
  const [selections, setSelections] = useState<BookSelection[]>([
    { id: crypto.randomUUID(), book: "", chapter: "" },
  ]);
  const [translation, setTranslation] = useState<string>("Luther");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("whole");
  const [preset, setPreset] = useState<PresetKey>("new");
  const [count, setCount] = useState(5);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || "");
  const [loading, setLoading] = useState(false);
  const [verses, setVerses] = useState<Verse[] | null>(null);

  const addSelection = () =>
    setSelections((s) => [...s, { id: crypto.randomUUID(), book: "", chapter: "" }]);

  const updateSelection = (id: string, field: "book" | "chapter", value: string) =>
    setSelections((s) => s.map((sel) => (sel.id === id ? { ...sel, [field]: value } : sel)));

  const removeSelection = (id: string) =>
    setSelections((s) => (s.length > 1 ? s.filter((sel) => sel.id !== id) : s));

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      toast({ title: "API Key fehlt", description: "Bitte gib deinen OpenAI API Key ein.", variant: "destructive" });
      return;
    }

    let selectionDescription = "";
    if (scopeMode === "whole") {
      selectionDescription = "der ganzen Bibel";
    } else if (scopeMode === "preset") {
      selectionDescription = PRESET_DESCRIPTION[preset];
    } else {
      const validSelections = selections.filter((s) => s.book.trim());
      if (validSelections.length === 0) {
        toast({ title: "Auswahl fehlt", description: "Bitte gib mindestens ein Buch an.", variant: "destructive" });
        return;
      }
      selectionDescription = validSelections
        .map((s) => (s.chapter.trim() ? `${s.book} Kapitel ${s.chapter}` : `${s.book} (alle Kapitel)`))
        .join(", ");
    }

    localStorage.setItem(STORAGE_KEY, apiKey);
    setLoading(true);
    setVerses(null);

    const prompt = `Wähle ${count} zufällige Bibelverse aus ${selectionDescription}. Verwende die Übersetzung: ${translation}. Antworte ausschließlich mit JSON im folgenden Format ohne weiteren Text: {"verses": [{"reference": "Buch Kapitel,Vers", "text": "Verstext", "translation": "Übersetzungsname"}]}`;

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Du bist ein Bibel-Experte. Antworte immer mit gültigem JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.9,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI Fehler: ${res.status} ${err}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      const result: Verse[] = parsed.verses || [];
      setVerses(result);
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message || "Anfrage fehlgeschlagen", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="w-5 h-5" />
            Bibelverse Picker
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 py-2">
            {!verses && (
              <>
                <div className="space-y-3">
                  <Label>Auswahl</Label>
                  <RadioGroup
                    value={scopeMode}
                    onValueChange={(v) => setScopeMode(v as ScopeMode)}
                    className="gap-2"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="whole" id="scope-whole" />
                      <span className="text-sm">Ganze Bibel</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="preset" id="scope-preset" />
                      <span className="text-sm">Bereich</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="custom" id="scope-custom" />
                      <span className="text-sm">Eigene Auswahl</span>
                    </label>
                  </RadioGroup>
                </div>

                {scopeMode === "preset" && (
                  <div className="space-y-2">
                    <Label>Bereich wählen</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(PRESET_LABELS) as PresetKey[]).map((k) => (
                        <label key={k} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="preset"
                            checked={preset === k}
                            onChange={() => setPreset(k)}
                          />
                          <span className="text-sm">{PRESET_LABELS[k]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {scopeMode === "custom" && (
                <div className="space-y-3">
                  <Label>Bücher & Kapitel</Label>
                  {selections.map((sel) => (
                    <div key={sel.id} className="flex gap-2 items-center">
                      <Input
                        placeholder="Buch (z.B. Johannes)"
                        value={sel.book}
                        onChange={(e) => updateSelection(sel.id, "book", e.target.value)}
                        className="flex-1"
                      />
                      <Input
                        placeholder="Kapitel (optional)"
                        value={sel.chapter}
                        onChange={(e) => updateSelection(sel.id, "chapter", e.target.value)}
                        className="w-40"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSelection(sel.id)}
                        disabled={selections.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addSelection}>
                    <Plus className="w-4 h-4 mr-1" /> Buch hinzufügen
                  </Button>
                </div>
                )}

                <div className="space-y-3">
                  <Label>Übersetzung</Label>
                  <RadioGroup
                    value={translation}
                    onValueChange={setTranslation}
                    className="grid grid-cols-2 gap-2"
                  >
                    {TRANSLATIONS.map((t) => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value={t} id={`tr-${t}`} />
                        <span className="text-sm">{t}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="count">Anzahl Verse</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={20}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apikey">OpenAI API Key</Label>
                  <Input
                    id="apikey"
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Wird nur lokal in deinem Browser gespeichert.
                  </p>
                </div>
              </>
            )}

            {verses && (
              <div className="space-y-4">
                {verses.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Keine Verse gefunden.</p>
                )}
                {verses.map((v, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border bg-card shadow-sm"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <BookOpen className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{v.reference}</p>
                        <p className="text-xs text-muted-foreground">{v.translation}</p>
                      </div>
                    </div>
                    <p className="text-foreground leading-relaxed pl-6">„{v.text}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          {verses ? (
            <>
              <Button variant="outline" onClick={() => setVerses(null)} className="flex-1">
                Zurück
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Neu würfeln"}
              </Button>
            </>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Würfle Verse...
                </>
              ) : (
                <>
                  <Dices className="w-4 h-4 mr-2" /> Verse würfeln
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BibleVerseModal;