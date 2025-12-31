import { useState, useRef } from 'react';
import { Image, Video, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MediaUploadProps {
  onUpload: (url: string, type: 'image' | 'video') => void;
  disabled?: boolean;
}

const MediaUpload = ({ onUpload, disabled }: MediaUploadProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast({ title: "Error", description: "Please select an image or video", variant: "destructive" });
      return;
    }

    // Size limits
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
    if (file.size > maxSize) {
      toast({ 
        title: "File too large", 
        description: `Maximum size is ${isVideo ? '50MB' : '10MB'}`, 
        variant: "destructive" 
      });
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview({ url: previewUrl, type: isImage ? 'image' : 'video' });
    setShowMenu(false);

    // Upload to storage
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      onUpload(publicUrl, isImage ? 'image' : 'video');
      setPreview(null);
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const cancelPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
      setPreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative inline-block">
          {preview.type === 'image' ? (
            <img 
              src={preview.url} 
              alt="Preview" 
              className="w-12 h-12 object-cover rounded-lg border border-border"
            />
          ) : (
            <video 
              src={preview.url} 
              className="w-12 h-12 object-cover rounded-lg border border-border"
            />
          )}
          {uploading ? (
            <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          ) : (
            <button
              onClick={cancelPreview}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMenu(!showMenu)}
            disabled={disabled || uploading}
            className="text-muted-foreground hover:text-foreground"
          >
            <Upload className="w-5 h-5" />
          </Button>

          {showMenu && (
            <div className="absolute bottom-12 left-0 bg-card border border-border rounded-xl p-2 shadow-lg z-50 min-w-36">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 text-foreground text-sm transition-colors"
              >
                <Image className="w-4 h-4" />
                <span>Photo</span>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-primary/10 text-foreground text-sm transition-colors"
              >
                <Video className="w-4 h-4" />
                <span>Video</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MediaUpload;
