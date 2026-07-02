import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { savePhoto, photoUriToBase64 } from '../services/storage';
import { convertImageToNote } from '../services/ai';
import { BorderRadius, Colors, Spacing } from '../constants/colors';

export default function CameraScreen() {
  const router = useRouter();
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="photo-camera" size={64} color={Colors.textTertiary} />
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionSubtitle}>
          Allow DigitalNotes to use your camera so you can digitize notes.
        </Text>
        <Pressable onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not capture photo. Please try again.');
    }
  };

  const retake = () => {
    setCapturedUri(null);
  };

  const confirm = async () => {
    if (!capturedUri) return;

    setIsProcessing(true);
    try {
      const savedUri = await savePhoto(capturedUri);
      const base64 = await photoUriToBase64(savedUri);
      const result = await convertImageToNote(base64);

      router.replace({
        pathname: '/note/edit',
        params: {
          imageUri: savedUri,
          folderId: folderId || '',
          title: result.title,
          body: result.body,
          extractedText: result.extractedText,
        },
      });
    } catch (error) {
      setIsProcessing(false);
      const message = error instanceof Error ? error.message : 'Could not process the photo.';
      Alert.alert('AI Conversion Failed', message, [
        { text: 'Try Again', onPress: retake },
        { text: 'Cancel', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {capturedUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedUri }} style={styles.preview} contentFit="cover" />
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color={Colors.surface} />
              <Text style={styles.processingText}>Reading your note...</Text>
            </View>
          )}
          <View style={styles.previewControls}>
            <Pressable onPress={retake} style={[styles.controlButton, styles.retakeButton]}>
              <Text style={styles.retakeText}>Retake</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={isProcessing}
              style={[styles.controlButton, styles.confirmButton]}
            >
              <Text style={styles.confirmText}>Use Photo</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.cameraOverlay}>
              <Pressable
                onPress={() => router.back()}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={28} color={Colors.surface} />
              </Pressable>
              <Pressable
                onPress={() => setFacing((current) => (current === 'back' ? 'front' : 'back'))}
                style={styles.flipButton}
              >
                <MaterialIcons name="flip-camera-ios" size={24} color={Colors.surface} />
              </Pressable>
            </View>
          </CameraView>

          <View style={styles.captureContainer}>
            <Pressable onPress={takePicture} style={styles.captureButton}>
              <View style={styles.captureInner} />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  permissionButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: Spacing.md,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.lg,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 4,
    borderColor: Colors.text,
  },
  previewContainer: {
    flex: 1,
  },
  preview: {
    flex: 1,
  },
  processingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: Colors.surface,
    fontSize: 16,
    marginTop: Spacing.md,
  },
  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
    backgroundColor: Colors.overlay,
  },
  controlButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: Colors.surface,
  },
  retakeText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});
