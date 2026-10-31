import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Plus, UploadCloud, AlertCircle } from 'lucide-react';
import { PhotoMetadata } from '../types.ts';
import {
  fetchCouplePhotos,
  uploadCouplePhoto,
  deleteCouplePhoto,
  getPhotoBlobUrl,
  clearPhotoBlobCache,
} from '../utils/photoApi.ts';
import { useCouple } from '../context/CoupleContext.tsx';
import { triggerHaptic } from '../utils/haptics.ts';
import { PhotoCard } from './photo/PhotoCard.tsx';
import { PhotoUploadModal } from './photo/PhotoUploadModal.tsx';
import { PhotoLightboxModal } from './photo/PhotoLightboxModal.tsx';

export const PhotoArchive: React.FC = () => {
  const { currentUser, coupleProfile, currentPartnerId, addFeedItem } = useCouple();

  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Upload modal & states
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'compressing' | 'uploading' | 'done'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Lightbox view & delete dialog
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoMetadata | null>(null);
  const [lightboxBlobUrl, setLightboxBlobUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const myLogin = (currentUser?.login || '').toLowerCase().trim().replace(/^@/, '');
  const partnerLogin = (currentUser?.partnerLogin || '').toLowerCase().trim().replace(/^@/, '');
  const coupleId = partnerLogin ? [myLogin, partnerLogin].sort().join('_') : myLogin;

  const otherPartnerName = coupleProfile.partner1.login.toLowerCase() === myLogin
    ? coupleProfile.partner2.name
    : coupleProfile.partner1.name;

  const partnerNameMap: Record<string, string> = {
    [myLogin]: currentUser?.name || myLogin,
    ...(partnerLogin ? { [partnerLogin]: otherPartnerName || partnerLogin } : {}),
  };

  const loadPhotos = useCallback(async () => {
    if (!coupleId) return;
    setLoadingList(true);
    setErrorMessage(null);
    const res = await fetchCouplePhotos(coupleId);
    if (res.success) {
      setPhotos(res.photos);
    } else {
      setErrorMessage(res.error || 'Не удалось загрузить архив фото');
    }
    setLoadingList(false);
  }, [coupleId]);

  useEffect(() => {
    loadPhotos();
    return () => {
      clearPhotoBlobCache();
    };
  }, [loadPhotos]);

  useEffect(() => {
    if (selectedPhoto) {
      getPhotoBlobUrl(selectedPhoto.id).then((url) => {
        setLightboxBlobUrl(url);
      });
    } else {
      setLightboxBlobUrl(null);
      setShowDeleteConfirm(false);
    }
  }, [selectedPhoto]);

  const handleFilePicked = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Пожалуйста, выберите файл изображения (JPEG, PNG или WebP)');
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    setIsUploadOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFilePicked(file);
    }
    e.target.value = '';
  };

  const closeUploadModal = () => {
    if (uploadStatus === 'compressing' || uploadStatus === 'uploading') return;
    setIsUploadOpen(false);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    setCaption('');
    setUploadStatus('idle');
    setUploadError(null);
  };

  const handleStartUpload = async () => {
    if (!selectedFile || !coupleId) return;

    setUploadError(null);
    const res = await uploadCouplePhoto(selectedFile, coupleId, caption, (status) => {
      setUploadStatus(status);
    });

    if (res.success && res.photo) {
      triggerHaptic('success');
      setPhotos((prev) => [res.photo!, ...prev]);

      addFeedItem({
        author: currentPartnerId,
        type: 'photo',
        title: 'Новое фото в архиве пары',
        subtitle: caption.trim() ? caption.trim() : 'Добавлен памятный момент',
      });

      closeUploadModal();
    } else {
      triggerHaptic('error');
      setUploadStatus('idle');
      setUploadError(res.error || 'Ошибка при загрузке фото');
    }
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;
    setIsDeleting(true);
    const res = await deleteCouplePhoto(selectedPhoto.id);
    setIsDeleting(false);

    if (res.success) {
      triggerHaptic('success');
      setPhotos((prev) => prev.filter((p) => p.id !== selectedPhoto.id));
      setSelectedPhoto(null);
      setShowDeleteConfirm(false);
    } else {
      triggerHaptic('error');
      alert(res.error || 'Не удалось удалить фото');
    }
  };

  const handleDownload = () => {
    if (!lightboxBlobUrl || !selectedPhoto) return;
    const a = document.createElement('a');
    a.href = lightboxBlobUrl;
    a.download = `loop-memory-${selectedPhoto.id.slice(0, 8)}.jpg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Top Header Card */}
      <div className="p-5 sm:p-6 rounded-[32px] bg-gradient-to-br from-[var(--surface-solid)] via-[var(--surface-blush)]/30 to-amber-500/8 border border-[var(--card-border)] shadow-[var(--card-shadow)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-linear-to-r from-amber-500/15 to-orange-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-500/20 shadow-2xs">
            <Camera className="w-3.5 h-3.5 text-amber-500" />
            <span>Фотоархив пары</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-[var(--text)] tracking-tight">
            Альбом ваших совместных моментов
          </h2>
          <p className="text-xs text-[var(--text-2)] font-medium max-w-md">
            Защищённое хранилище памятных снимков. Доступно только вам и вашему партнёру.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-pink-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs hover:opacity-95 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить фото</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFilePicked(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex items-center justify-center gap-3 ${
          isDragging
            ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-[0.99]'
            : 'border-[var(--divider)] bg-[var(--surface-2)]/50 hover:bg-[var(--surface-2)]'
        }`}
      >
        <UploadCloud className="w-5 h-5 text-[var(--text-2)]" />
        <span className="text-xs text-[var(--text-2)] font-medium">
          Перетащите фото сюда или нажмите для выбора из галереи
        </span>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={loadPhotos} className="text-[11px] underline font-bold cursor-pointer">
            Повторить
          </button>
        </div>
      )}

      {/* Photos Grid or Loading or Empty State */}
      {loadingList ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="aspect-square rounded-2xl bg-[var(--surface-2)] animate-pulse border border-[var(--divider)]"
            />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center rounded-3xl bg-[var(--surface)] border border-[var(--divider)] border-dashed">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3 shadow-inner">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[var(--text)] mb-1">Здесь будут ваши воспоминания</h3>
          <p className="text-xs text-[var(--text-2)] max-w-sm mb-5 leading-relaxed">
            Снимки со свиданий, романтических поездок и тёплых моментов. Фотографии надёжно шифруются и хранятся в вашей паре.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-[var(--accent)] text-white text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-2 cursor-pointer hover:opacity-95 active:scale-95 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Загрузить первое фото</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onClick={() => setSelectedPhoto(photo)}
              partnerNameMap={partnerNameMap}
            />
          ))}
        </div>
      )}

      {/* MODAL: Upload Photo & Preview */}
      <PhotoUploadModal
        isOpen={isUploadOpen}
        onClose={closeUploadModal}
        filePreview={filePreview}
        caption={caption}
        setCaption={setCaption}
        uploadStatus={uploadStatus}
        uploadError={uploadError}
        onUpload={handleStartUpload}
      />

      {/* MODAL: Fullscreen Lightbox & Delete confirmation */}
      <PhotoLightboxModal
        photo={selectedPhoto}
        lightboxBlobUrl={lightboxBlobUrl}
        onClose={() => setSelectedPhoto(null)}
        onDownload={handleDownload}
        onDelete={handleDeletePhoto}
        partnerNameMap={partnerNameMap}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};
