import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getVocab, removeWord, VocabWord } from '../vocab';
import { colors, radius, spacing } from '../theme';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function VocabScreen({ navigation }: any) {
  const [words, setWords] = useState<VocabWord[]>(getVocab());
  const [mode, setMode] = useState<'list' | 'practice'>('list');

  function refresh() {
    setWords(getVocab());
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
      </View>

      {mode === 'list' ? (
        <ListView words={words} onRemove={(w) => { removeWord(w); refresh(); }} onPractice={() => setMode('practice')} />
      ) : (
        <Practice words={words} onExit={() => setMode('list')} />
      )}
    </SafeAreaView>
  );
}

function ListView({
  words,
  onRemove,
  onPractice,
}: {
  words: VocabWord[];
  onRemove: (w: string) => void;
  onPractice: () => void;
}) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>📚 אוצר המילים שלי</Text>
        <Text style={styles.subtitle}>{words.length} מילים שמורות</Text>
      </View>

      {words.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>עוד לא שמרת מילים.</Text>
          <Text style={styles.emptyHint}>בתוך שיר, לחץ על מילה ואז על הכוכב ★ כדי לשמור אותה כאן.</Text>
        </View>
      ) : (
        <FlatList
          data={words}
          keyExtractor={(w) => w.word}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowWord}>{item.word}</Text>
                <Text style={styles.rowTr}>{item.translation}</Text>
              </View>
              <TouchableOpacity onPress={() => onRemove(item.word)} hitSlop={10}>
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {words.length > 0 && (
        <TouchableOpacity style={styles.practiceBtn} onPress={onPractice} activeOpacity={0.85}>
          <Text style={styles.practiceBtnText}>🎯  תרגול מילים</Text>
        </TouchableOpacity>
      )}
    </>
  );
}

// Flashcards: show the English word, reveal Hebrew, mark known / not yet.
// Words you don't know come back later, so you practice until you know them all.
function Practice({ words, onExit }: { words: VocabWord[]; onExit: () => void }) {
  const [queue, setQueue] = useState<VocabWord[]>(() => shuffle(words));
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [knownCount, setKnownCount] = useState(0);

  const done = pos >= queue.length;
  const card = queue[pos];

  function known() {
    setKnownCount((c) => c + 1);
    setRevealed(false);
    setPos((p) => p + 1);
  }
  function notYet() {
    setQueue((q) => [...q, q[pos]]); // see it again later
    setRevealed(false);
    setPos((p) => p + 1);
  }
  function restart() {
    setQueue(shuffle(words));
    setPos(0);
    setRevealed(false);
    setKnownCount(0);
  }

  if (done) {
    return (
      <View style={styles.center}>
        <Text style={styles.bigEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>כל הכבוד!</Text>
        <Text style={styles.doneText}>ידעת {knownCount} כרטיסיות בסבב הזה.</Text>
        <TouchableOpacity style={styles.practiceBtn} onPress={restart} activeOpacity={0.85}>
          <Text style={styles.practiceBtnText}>🔁  עוד פעם</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exitBtn} onPress={onExit} hitSlop={10}>
          <Text style={styles.exitText}>חזרה לרשימה</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.progress}>
        {pos + 1} / {queue.length}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardWord}>{card.word}</Text>
        {revealed && <Text style={styles.cardTr}>{card.translation}</Text>}
      </View>

      {!revealed ? (
        <TouchableOpacity style={styles.revealBtn} onPress={() => setRevealed(true)} activeOpacity={0.85}>
          <Text style={styles.revealText}>הצג תרגום</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.judgeRow}>
          <TouchableOpacity style={[styles.judgeBtn, styles.notYet]} onPress={notYet} activeOpacity={0.85}>
            <Text style={styles.judgeText}>עוד לא ✗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.judgeBtn, styles.knew]} onPress={known} activeOpacity={0.85}>
            <Text style={styles.judgeText}>ידעתי ✓</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.exitBtn} onPress={onExit} hitSlop={10}>
        <Text style={styles.exitText}>סיום</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  back: { color: colors.primarySoft, fontSize: 17, fontWeight: '600' },

  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyHint: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: spacing.sm },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowWord: { color: colors.text, fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  rowTr: { color: colors.primarySoft, fontSize: 15, marginTop: 2 },
  remove: { color: colors.textFaint, fontSize: 18, paddingHorizontal: spacing.sm },

  practiceBtn: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  practiceBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Practice
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  progress: { color: colors.textMuted, fontSize: 15, marginBottom: spacing.lg },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: 48,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cardWord: { color: colors.text, fontSize: 34, fontWeight: '800', textTransform: 'capitalize' },
  cardTr: { color: colors.primarySoft, fontSize: 26, fontWeight: '700', marginTop: spacing.md },

  revealBtn: {
    backgroundColor: colors.surfaceLight,
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  revealText: { color: colors.text, fontSize: 16, fontWeight: '700' },

  judgeRow: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  judgeBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 15, alignItems: 'center' },
  notYet: { backgroundColor: colors.danger },
  knew: { backgroundColor: colors.success },
  judgeText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  exitBtn: { marginTop: spacing.xl },
  exitText: { color: colors.textMuted, fontSize: 15 },

  bigEmoji: { fontSize: 64, marginBottom: spacing.md },
  doneTitle: { color: colors.text, fontSize: 26, fontWeight: '800' },
  doneText: { color: colors.textMuted, fontSize: 16, marginTop: spacing.sm, marginBottom: spacing.xl },
});
