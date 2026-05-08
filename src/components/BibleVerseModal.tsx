import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Dices, BookOpen, RotateCcw, Hash, Copy, Check } from "lucide-react";
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
  text?: string;
  translation?: string;
}

interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
}

interface ChapterInfo {
  book: string;
  chapter: number;
  verseCount: number;
}

type ScopeMode = "whole" | "preset" | "custom";
type PresetKey = "old" | "new" | "psalms" | "proverbs";

const TRANSLATIONS = [
  "Luther",
  "Schlachter",
  "Elberfelder",
  "Neues Leben",
  "Einheitsübersetzung",
];

const STORAGE_KEY = "openai_api_key";
const PREFS_KEY = "bible_picker_prefs";

const TRANSLATION_CODES: Record<string, string> = {
  "Luther": "LUT",
  "Schlachter": "SLT",
  "Elberfelder": "ELB",
  "Neues Leben": "NLB",
  "Einheitsübersetzung": "EU",
};

function buildBibleserverUrl(reference: string, translationName: string): string {
  const code = TRANSLATION_CODES[translationName] ?? "ELB";
  // reference: "Buch Kapitel,Vers" e.g. "1. Mose 1,1" or "Jeremia 6,1"
  const commaIdx = reference.indexOf(",");
  if (commaIdx === -1) return `https://www.bibleserver.com/${code}/${encodeURIComponent(reference)}`;
  const beforeComma = reference.slice(0, commaIdx); // "1. Mose 1"
  const verse = reference.slice(commaIdx + 1).trim(); // "1"
  const lastSpace = beforeComma.lastIndexOf(" ");
  if (lastSpace === -1) return `https://www.bibleserver.com/${code}/${encodeURIComponent(reference)}`;
  const book = beforeComma.slice(0, lastSpace); // "1. Mose"
  const chapter = beforeComma.slice(lastSpace + 1); // "1"
  // bibleserver expects no space between book name and chapter, e.g. "1.Mose1,1"
  return `https://www.bibleserver.com/${code}/${encodeURIComponent(book.replace(/\s+/g, "") + chapter + "," + verse)}`;
}

const DEFAULTS = {
  scopeMode: "whole" as ScopeMode,
  presets: ["new"] as PresetKey[],
  selections: [{ id: "default", book: "", chapter: "" }] as BookSelection[],
  translation: "Elberfelder",
  count: 1,
  topic: "",
};

const PRESET_LABELS: Record<PresetKey, string> = {
  old: "Altes Testament",
  new: "Neues Testament",
  psalms: "Psalmen",
  proverbs: "Sprüche",
};

// Complete Protestant Bible — verse counts per chapter (v[i] = verses in chapter i+1)
// Source: standard Lutheran/Elberfelder/Schlachter Protestant canon
interface BibleBook {
  name: string;
  scopes: PresetKey[];
  v: number[];
}

const BIBLE_BOOKS: BibleBook[] = [
  // ── Old Testament ────────────────────────────────────────────────────────
  { name: "1. Mose",        scopes: ["old"], v: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26] },
  { name: "2. Mose",        scopes: ["old"], v: [22,25,22,31,23,30,25,28,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38] },
  { name: "3. Mose",        scopes: ["old"], v: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34] },
  { name: "4. Mose",        scopes: ["old"], v: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13] },
  { name: "5. Mose",        scopes: ["old"], v: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12] },
  { name: "Josua",          scopes: ["old"], v: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33] },
  { name: "Richter",        scopes: ["old"], v: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25] },
  { name: "Rut",            scopes: ["old"], v: [22,23,18,22] },
  { name: "1. Samuel",      scopes: ["old"], v: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13] },
  { name: "2. Samuel",      scopes: ["old"], v: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25] },
  { name: "1. Könige",      scopes: ["old"], v: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53] },
  { name: "2. Könige",      scopes: ["old"], v: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30] },
  { name: "1. Chronik",     scopes: ["old"], v: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30] },
  { name: "2. Chronik",     scopes: ["old"], v: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23] },
  { name: "Esra",           scopes: ["old"], v: [11,70,13,24,17,22,28,36,15,44] },
  { name: "Nehemia",        scopes: ["old"], v: [11,20,32,23,19,19,73,18,38,39,36,47,31] },
  { name: "Ester",          scopes: ["old"], v: [22,23,15,17,14,14,10,17,32,3] },
  { name: "Hiob",           scopes: ["old"], v: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17] },
  { name: "Psalmen",        scopes: ["old","psalms"], v: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,8,12,15,21,10,20,14,9,6] },
  { name: "Sprüche",        scopes: ["old","proverbs"], v: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31] },
  { name: "Prediger",       scopes: ["old"], v: [18,26,22,16,20,12,29,17,18,20,10,14] },
  { name: "Hohelied",       scopes: ["old"], v: [17,17,11,16,16,13,13,14] },
  { name: "Jesaja",         scopes: ["old"], v: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24] },
  { name: "Jeremia",        scopes: ["old"], v: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34] },
  { name: "Klagelieder",    scopes: ["old"], v: [22,22,66,22,22] },
  { name: "Hesekiel",       scopes: ["old"], v: [28,10,27,21,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23] },
  { name: "Daniel",         scopes: ["old"], v: [21,49,30,37,31,28,28,27,27,21,45,13] },
  { name: "Hosea",          scopes: ["old"], v: [11,23,5,19,15,11,16,14,17,15,12,14,16,9] },
  { name: "Joel",           scopes: ["old"], v: [20,32,21] },
  { name: "Amos",           scopes: ["old"], v: [15,16,15,13,27,14,17,14,15] },
  { name: "Obadja",         scopes: ["old"], v: [21] },
  { name: "Jona",           scopes: ["old"], v: [17,10,10,11] },
  { name: "Micha",          scopes: ["old"], v: [16,13,12,13,15,16,20] },
  { name: "Nahum",          scopes: ["old"], v: [15,13,19] },
  { name: "Habakuk",        scopes: ["old"], v: [17,20,19] },
  { name: "Zefanja",        scopes: ["old"], v: [18,15,20] },
  { name: "Haggai",         scopes: ["old"], v: [15,23] },
  { name: "Sacharja",       scopes: ["old"], v: [21,13,10,14,11,15,14,23,17,12,17,14,9,21] },
  { name: "Maleachi",       scopes: ["old"], v: [14,17,18,6] },
  // ── New Testament ────────────────────────────────────────────────────────
  { name: "Matthäus",             scopes: ["new"], v: [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20] },
  { name: "Markus",               scopes: ["new"], v: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20] },
  { name: "Lukas",                scopes: ["new"], v: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53] },
  { name: "Johannes",             scopes: ["new"], v: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25] },
  { name: "Apostelgeschichte",    scopes: ["new"], v: [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,51,25,33,48,24,21,13,24,52] },
  { name: "Römer",                scopes: ["new"], v: [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27] },
  { name: "1. Korinther",         scopes: ["new"], v: [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24] },
  { name: "2. Korinther",         scopes: ["new"], v: [24,17,18,18,21,18,16,24,15,18,33,21,14] },
  { name: "Galater",              scopes: ["new"], v: [24,21,29,31,26,18] },
  { name: "Epheser",              scopes: ["new"], v: [23,22,21,32,33,24] },
  { name: "Philipper",            scopes: ["new"], v: [30,30,21,23] },
  { name: "Kolosser",             scopes: ["new"], v: [29,23,25,18] },
  { name: "1. Thessalonicher",    scopes: ["new"], v: [10,20,13,18,28] },
  { name: "2. Thessalonicher",    scopes: ["new"], v: [12,17,18] },
  { name: "1. Timotheus",         scopes: ["new"], v: [20,15,16,16,25,21] },
  { name: "2. Timotheus",         scopes: ["new"], v: [18,26,17,22] },
  { name: "Titus",                scopes: ["new"], v: [16,15,15] },
  { name: "Philemon",             scopes: ["new"], v: [25] },
  { name: "Hebräer",              scopes: ["new"], v: [14,18,19,16,14,20,28,13,28,39,40,29,25] },
  { name: "Jakobus",              scopes: ["new"], v: [27,26,18,17,20] },
  { name: "1. Petrus",            scopes: ["new"], v: [25,25,22,19,14] },
  { name: "2. Petrus",            scopes: ["new"], v: [21,22,18] },
  { name: "1. Johannes",          scopes: ["new"], v: [10,29,24,21,21] },
  { name: "2. Johannes",          scopes: ["new"], v: [13] },
  { name: "3. Johannes",          scopes: ["new"], v: [14] },
  { name: "Judas",                scopes: ["new"], v: [25] },
  { name: "Offenbarung",          scopes: ["new"], v: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21] },
];

function normalizeBookName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function findBook(name: string): BibleBook | undefined {
  const n = normalizeBookName(name);
  return BIBLE_BOOKS.find(b => normalizeBookName(b.name) === n);
}

function buildChapterList(
  scopeMode: ScopeMode,
  presets: PresetKey[],
  selections: BookSelection[],
): ChapterInfo[] {
  const add = (b: BibleBook, fromChapter = 1, toChapter = b.v.length): ChapterInfo[] =>
    Array.from({ length: toChapter - fromChapter + 1 }, (_, i) => ({
      book: b.name,
      chapter: fromChapter + i,
      verseCount: b.v[fromChapter - 1 + i],
    }));

  if (scopeMode === "whole") return BIBLE_BOOKS.flatMap(b => add(b));
  if (scopeMode === "preset") {
    return BIBLE_BOOKS
      .filter(b => presets.some(p => b.scopes.includes(p)))
      .flatMap(b => add(b));
  }
  // custom
  return selections
    .filter(s => s.book.trim())
    .flatMap(s => {
      const match = findBook(s.book);
      if (!match) return [];
      if (s.chapter.trim()) {
        const ch = parseInt(s.chapter);
        if (ch >= 1 && ch <= match.v.length) return add(match, ch, ch);
        return [];
      }
      return add(match);
    });
}

function pickRandomVerses(chapters: ChapterInfo[], count: number): VerseRef[] {
  if (chapters.length === 0) return [];
  const totalVerses = chapters.reduce((s, c) => s + c.verseCount, 0);
  const n = Math.min(count, totalVerses);
  const seen = new Set<string>();
  const result: VerseRef[] = [];

  while (result.length < n) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    let idx = buf[0] % totalVerses;
    for (const ch of chapters) {
      if (idx < ch.verseCount) {
        const key = `${ch.book}:${ch.chapter}:${idx + 1}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push({ book: ch.book, chapter: ch.chapter, verse: idx + 1 });
        }
        break;
      }
      idx -= ch.verseCount;
    }
  }
  return result;
}

const PRESET_DESCRIPTION: Record<PresetKey, string> = {
  old: "dem Alten Testament",
  new: "dem Neuen Testament",
  psalms: "dem Buch der Psalmen",
  proverbs: "dem Buch der Sprüche",
};

function buildScopeDescription(scopeMode: ScopeMode, presets: PresetKey[], selections: BookSelection[]): string {
  if (scopeMode === "whole") return "der gesamten Bibel";
  if (scopeMode === "preset") return presets.map(p => PRESET_DESCRIPTION[p]).join(", ");
  return selections
    .filter(s => s.book.trim())
    .map(s => s.chapter.trim() ? `${s.book} Kapitel ${s.chapter}` : s.book)
    .join(", ");
}

const VerseCard = ({ verse: v, translation }: { verse: Verse; translation: string }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    const text = v.text
      ? `${v.reference}\n„${v.text}"\n(${v.translation ?? translation})`
      : v.reference;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Kopieren fehlgeschlagen", variant: "destructive" });
    }
  };

  return (
    <div className="p-4 rounded-lg border bg-card shadow-sm">
      <div className="flex items-start gap-2 mb-2">
        {v.text ? (
          <BookOpen className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
        ) : (
          <Hash className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
        )}
        <div className="flex-1">
          <a
            href={buildBibleserverUrl(v.reference, translation)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-foreground hover:text-primary hover:underline cursor-pointer"
          >
            {v.reference}
          </a>
          {v.translation && (
            <p className="text-xs text-muted-foreground">{v.translation}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={handleCopy} title="Kopieren">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
      {v.text ? (
        <p className="text-foreground leading-relaxed pl-6">„{v.text}"</p>
      ) : (
        <a
          href={buildBibleserverUrl(v.reference, translation)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground text-sm pl-6 italic hover:text-primary hover:underline block"
        >
          Bitte in deiner Bibel nachschlagen →
        </a>
      )}
    </div>
  );
};

const BibleVerseModal = ({ open, onOpenChange }: BibleVerseModalProps) => {
  const { toast } = useToast();

  const loadPrefs = () => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const initial = loadPrefs();
  const [selections, setSelections] = useState<BookSelection[]>(
    initial?.selections?.length
      ? initial.selections.map((s: BookSelection) => ({ ...s, id: crypto.randomUUID() }))
      : [{ id: crypto.randomUUID(), book: "", chapter: "" }],
  );
  const [translation, setTranslation] = useState<string>(initial?.translation ?? DEFAULTS.translation);
  const [scopeMode, setScopeMode] = useState<ScopeMode>(initial?.scopeMode ?? DEFAULTS.scopeMode);
  const [presets, setPresets] = useState<PresetKey[]>(initial?.presets ?? DEFAULTS.presets);
  const [count, setCount] = useState<number>(initial?.count ?? DEFAULTS.count);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEY) || "");
  const [topic, setTopic] = useState<string>(initial?.topic ?? DEFAULTS.topic);
  const [loading, setLoading] = useState(false);
  const [verses, setVerses] = useState<Verse[] | null>(null);

  useEffect(() => {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ scopeMode, presets, selections, translation, count, topic }),
    );
  }, [scopeMode, presets, selections, translation, count, topic]);

  const togglePreset = (k: PresetKey) =>
    setPresets(cur => cur.includes(k) ? cur.filter(x => x !== k) : [...cur, k]);

  const resetDefaults = () => {
    localStorage.removeItem(PREFS_KEY);
    setSelections([{ id: crypto.randomUUID(), book: "", chapter: "" }]);
    setTranslation(DEFAULTS.translation);
    setScopeMode(DEFAULTS.scopeMode);
    setPresets(DEFAULTS.presets);
    setCount(DEFAULTS.count);
    setTopic(DEFAULTS.topic);
    toast({ title: "Zurückgesetzt", description: "Standardwerte wiederhergestellt." });
  };

  const addSelection = () =>
    setSelections(s => [...s, { id: crypto.randomUUID(), book: "", chapter: "" }]);

  const updateSelection = (id: string, field: "book" | "chapter", value: string) =>
    setSelections(s => s.map(sel => sel.id === id ? { ...sel, [field]: value } : sel));

  const removeSelection = (id: string) =>
    setSelections(s => s.length > 1 ? s.filter(sel => sel.id !== id) : s);

  const handleSubmit = async () => {
    if (scopeMode === "preset" && presets.length === 0) {
      toast({ title: "Bereich fehlt", description: "Bitte wähle mindestens einen Bereich.", variant: "destructive" });
      return;
    }
    if (scopeMode === "custom" && !selections.some(s => s.book.trim())) {
      toast({ title: "Auswahl fehlt", description: "Bitte gib mindestens ein Buch an.", variant: "destructive" });
      return;
    }

    const chapters = buildChapterList(scopeMode, presets, selections);
    if (chapters.length === 0) {
      toast({ title: "Keine Bücher gefunden", description: "Die eingegebenen Bücher wurden nicht erkannt.", variant: "destructive" });
      return;
    }

    // No API key — show references only (topic mode requires API key, already gated in UI)
    if (!apiKey.trim()) {
      const refs = pickRandomVerses(chapters, count);
      setVerses(refs.map(r => ({ reference: `${r.book} ${r.chapter},${r.verse}` })));
      return;
    }

    localStorage.setItem(STORAGE_KEY, apiKey);
    setLoading(true);
    setVerses(null);

    let prompt: string;
    if (topic.trim()) {
      const scope = buildScopeDescription(scopeMode, presets, selections);
      prompt = `Wähle ${count} Bibelvers${count > 1 ? "e" : ""} aus ${scope}, die inhaltlich gut zum Thema „${topic.trim()}" passen. Verwende die Übersetzung "${translation}". Gib ausschließlich Verse zurück, die wirklich zum Thema passen – lieber weniger als unpassende Verse. Antworte ausschließlich mit JSON im folgenden Format ohne weiteren Text: {"verses": [{"reference": "Buch Kapitel,Vers", "text": "Verstext", "translation": "Übersetzungsname"}]}`;
    } else {
      const refs = pickRandomVerses(chapters, count);
      const refList = refs.map(r => `${r.book} ${r.chapter},${r.verse}`).join("; ");
      prompt = `Gib mir den genauen Bibeltext dieser Verse in der Übersetzung "${translation}": ${refList}. Falls eine Versangabe nicht exakt stimmt, nimm den nächstgelegenen Vers. Antworte ausschließlich mit JSON im folgenden Format ohne weiteren Text: {"verses": [{"reference": "Buch Kapitel,Vers", "text": "Verstext", "translation": "Übersetzungsname"}]}`;
    }

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
          temperature: topic.trim() ? 0.7 : 0.1,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI Fehler: ${res.status} ${err}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      setVerses((parsed.verses as Verse[]) || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Anfrage fehlgeschlagen";
      toast({ title: "Fehler", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dices className="w-5 h-5" />
            Bibelverse Picker
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2">
          <div className="space-y-6 py-2">
            {!verses && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="count">Anzahl Verse</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={20}
                    value={count}
                    onChange={e => setCount(parseInt(e.target.value) || 1)}
                    className="w-24"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Auswahl</Label>
                  <RadioGroup
                    value={scopeMode}
                    onValueChange={v => setScopeMode(v as ScopeMode)}
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
                      {(Object.keys(PRESET_LABELS) as PresetKey[]).map(k => (
                        <label key={k} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={presets.includes(k)} onCheckedChange={() => togglePreset(k)} />
                          <span className="text-sm">{PRESET_LABELS[k]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {scopeMode === "custom" && (
                  <div className="space-y-3">
                    <Label>Bücher & Kapitel</Label>
                    {selections.map(sel => {
                      const matchedBook = BIBLE_BOOKS.find(b => b.name === sel.book);
                      return (
                        <div key={sel.id} className="flex gap-2 items-center">
                          <Select
                            value={sel.book || "__none__"}
                            onValueChange={v =>
                              setSelections(s =>
                                s.map(x => x.id === sel.id ? { ...x, book: v === "__none__" ? "" : v, chapter: "" } : x)
                              )
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Buch wählen…" />
                            </SelectTrigger>
                            <SelectContent>
                              {BIBLE_BOOKS.map(b => (
                                <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={sel.chapter || "all"}
                            onValueChange={v => updateSelection(sel.id, "chapter", v === "all" ? "" : v)}
                            disabled={!sel.book}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="Kap." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Alle Kapitel</SelectItem>
                              {matchedBook && Array.from({ length: matchedBook.v.length }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>
                                  Kapitel {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSelection(sel.id)}
                            disabled={selections.length === 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
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
                    {TRANSLATIONS.map(t => (
                      <label key={t} className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value={t} id={`tr-${t}`} />
                        <span className="text-sm">{t}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                {apiKey.trim() && (
                  <div className="space-y-2">
                    <Label htmlFor="topic">
                      Thema{" "}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="topic"
                      placeholder="z.B. Taufe, Glaube, Vergebung …"
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Wenn angegeben, wählt ChatGPT nur Verse aus, die inhaltlich zum Thema passen.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="apikey">
                    OpenAI API Key{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="apikey"
                    type="password"
                    placeholder="sk-… (für Verstext)"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ohne API Key werden nur Stellenangaben angezeigt — den Text kannst du in deiner Bibel nachschlagen. Der Key wird nur lokal gespeichert.
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
                  <VerseCard key={i} verse={v} translation={translation} />
                ))}
              </div>
            )}
          </div>
        </div>

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
            <>
              <Button variant="outline" onClick={resetDefaults} disabled={loading} title="Auf Standard zurücksetzen">
                <RotateCcw className="w-4 h-4 mr-1" /> Reset
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Lade Verse...
                  </>
                ) : (
                  <>
                    <Dices className="w-4 h-4 mr-2" /> Verse würfeln
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BibleVerseModal;
