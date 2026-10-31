import React from 'react';
import { MediaPanel } from '../panels/MediaPanel';
import {
  MediaAsset,
  MediaFolder,
  KeyframeSound,
} from '../../types/flash';

interface MediaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: MediaFolder[];
  assets: MediaAsset[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: (name: string, color?: string) => void;
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onAddAsset: (asset: MediaAsset) => void;
  onRenameAsset: (assetId: string, newName: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onMoveAsset: (assetId: string, targetFolderId: string | null) => void;
  onInsertImageToStage: (asset: MediaAsset) => void;
  onAttachSoundToKeyframe: (sound: KeyframeSound) => void;
  currentFrame?: number;
}

export const MediaManagerModal: React.FC<MediaManagerModalProps> = ({
  isOpen,
  onClose,
  folders,
  assets,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onAddAsset,
  onRenameAsset,
  onDeleteAsset,
  onMoveAsset,
  onInsertImageToStage,
  onAttachSoundToKeyframe,
  currentFrame = 1,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <MediaPanel
        folders={folders}
        assets={assets}
        selectedFolderId={selectedFolderId}
        onSelectFolder={onSelectFolder}
        onCreateFolder={onCreateFolder}
        onRenameFolder={onRenameFolder}
        onDeleteFolder={onDeleteFolder}
        onAddAsset={onAddAsset}
        onRenameAsset={onRenameAsset}
        onDeleteAsset={onDeleteAsset}
        onMoveAsset={onMoveAsset}
        onInsertImageToStage={(asset) => {
          onInsertImageToStage(asset);
          onClose();
        }}
        onAttachSoundToKeyframe={(sound) => {
          onAttachSoundToKeyframe(sound);
          onClose();
        }}
        currentFrame={currentFrame}
        isExpandedModal={true}
        onClose={onClose}
      />
    </div>
  );
};
