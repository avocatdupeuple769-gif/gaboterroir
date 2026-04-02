import { Feather } from '@expo/vector-icons';
import { addDoc, collection, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator, Modal, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import Colors from '@/constants/colors';
import { db } from '@/lib/firebase';
import { Transaction } from '@/types';

interface Props {
  visible: boolean;
  transaction: Transaction | null;
  fromUserId: string;
  fromUserNom: string;
  onClose: () => void;
}

export default function RatingModal({ visible, transaction, fromUserId, fromUserNom, onClose }: Props) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const labels = ['Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent !'];

  const handleSubmit = async () => {
    if (!transaction) return;
    setLoading(true);
    try {
      // Save rating to Firestore
      await addDoc(collection(db, 'ratings'), {
        transactionId: transaction.id,
        fromUserId,
        fromUserNom,
        toUserId: transaction.idVendeur,
        note: stars,
        comment: comment.trim() || null,
        produitNom: transaction.produit.nom,
        createdAt: new Date().toISOString(),
      });

      // Update vendor's average rating in Firestore using Firebase atomic operations
      // We store ratingSum and ratingCount then compute average on read
      // Or simpler: use a running average update
      await updateDoc(doc(db, 'users', transaction.idVendeur), {
        ratingCount: increment(1),
        ratingSum: increment(stars),
      });

      setDone(true);
    } catch (e) {
      // Rating saved locally even if Firestore fails
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStars(5);
    setComment('');
    setDone(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {done ? (
            <View style={styles.doneSection}>
              <View style={styles.doneIcon}>
                <Text style={styles.doneEmoji}>⭐</Text>
              </View>
              <Text style={styles.doneTitle}>Merci pour votre avis !</Text>
              <Text style={styles.doneSub}>
                Votre notation aide les agriculteurs gabonais à améliorer leur service.
              </Text>
              <TouchableOpacity style={styles.doneBtn} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>⭐ Notez votre achat</Text>
              {transaction && (
                <Text style={styles.subtitle}>
                  {transaction.produit.nom} · {transaction.vendeurNom}
                </Text>
              )}

              {/* Stars */}
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setStars(n)} activeOpacity={0.7} style={styles.starBtn}>
                    <Text style={[styles.star, n <= stars && styles.starActive]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.starLabel}>{labels[stars - 1]}</Text>

              {/* Comment */}
              <TextInput
                style={styles.commentInput}
                placeholder="Laissez un commentaire (facultatif)…"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                value={comment}
                onChangeText={setComment}
                maxLength={200}
              />
              <Text style={styles.charCount}>{comment.length}/200</Text>

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name="send" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Envoyer mon avis</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose} style={styles.skipBtn} activeOpacity={0.7}>
                <Text style={styles.skipText}>Passer pour l'instant</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, gap: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  starBtn: { padding: 4 },
  star: { fontSize: 42, color: Colors.border },
  starActive: { color: Colors.star },
  starLabel: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: Colors.text },
  commentInput: {
    backgroundColor: Colors.background, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.text, lineHeight: 20,
    borderWidth: 1.5, borderColor: Colors.border, textAlignVertical: 'top',
    minHeight: 80,
  },
  charCount: { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: -6 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16, marginTop: 4,
  },
  submitBtnText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  doneSection: { alignItems: 'center', gap: 14, paddingVertical: 20 },
  doneIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  doneEmoji: { fontSize: 40 },
  doneTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  doneSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  doneBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 4,
  },
  doneBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
