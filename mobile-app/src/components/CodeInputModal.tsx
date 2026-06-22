import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

interface CodeInputModalProps {
  visible: boolean;
  onClose: () => void;
  onValidate: (code: string) => Promise<void>;
  loading: boolean;
  errorMsg: string | null;
}

export default function CodeInputModal({
  visible,
  onClose,
  onValidate,
  loading,
  errorMsg,
}: CodeInputModalProps) {
  const [uniqueCode, setUniqueCode] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (errorMsg) {
      // Shake animation on error
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true })
      ]).start();
    }
  }, [errorMsg, shakeAnim]);

  const handleValidate = () => {
    onValidate(uniqueCode);
  };

  const handleClose = () => {
    setUniqueCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter Your Code</Text>
          <Text style={styles.modalSubtitle}>
            Please enter the 6-character code provided by your parent
          </Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%' }}>
            <TextInput
              style={[styles.codeInput, errorMsg ? styles.inputError : null]}
              placeholder="ABC123"
              value={uniqueCode}
              onChangeText={setUniqueCode}
              maxLength={6}
              autoCapitalize="characters"
              textAlign="center"
              editable={!loading}
            />
          </Animated.View>

          {errorMsg && (
            <Text style={styles.errorText}>{errorMsg}</Text>
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, loading ? styles.disabledButton : null]}
              onPress={handleValidate}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? 'Validating...' : 'Confirm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#37474F',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#546E7A',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  codeInput: {
    width: '100%',
    height: 50,
    borderWidth: 2,
    borderColor: '#00B4D8',
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 4,
    color: '#37474F',
    backgroundColor: '#F5F5F5',
  },
  inputError: {
    borderColor: '#EF5350',
  },
  errorText: {
    color: '#EF5350',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ECEFF1',
  },
  cancelButtonText: {
    color: '#546E7A',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#00B4D8',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
