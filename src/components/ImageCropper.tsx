'use client';

import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  Crop,
  PixelCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { toast } from 'react-hot-toast';

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onSkipCrop: (originalImageBlob: Blob) => void; // 新增：不裁剪直接使用原图
  onCancel: () => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

const ImageCropper: React.FC<ImageCropperProps> = ({ src, onCropComplete, onSkipCrop, onCancel }) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rotation, setRotation] = useState(0); // 旋转角度状态

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerAspectCrop(width, height, 16 / 9);
    setCrop(crop);
  }, []);

  // 旋转图片函数
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
    // 旋转后重新设置裁剪区域
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      const crop = centerAspectCrop(width, height, 16 / 9);
      setCrop(crop);
    }
  }, []);

  // 不裁剪，直接使用原图
  const handleSkipCrop = useCallback(async () => {
    setIsProcessing(true);
    try {
      // 将原图转换为高质量的Blob
      const response = await fetch(src);
      const originalBlob = await response.blob();
      
      // 如果有旋转，需要应用旋转后再输出
      if (rotation !== 0) {
        const canvas = canvasRef.current;
        const image = imgRef.current;
        
        if (canvas && image) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // 设置canvas尺寸为原图尺寸
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            
            // 应用旋转
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            ctx.translate(centerX, centerY);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
            
            // 绘制旋转后的图片
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            
            // 转换为高质量Blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  onSkipCrop(blob);
                } else {
                  toast.error('处理图片失败，请重试');
                }
              },
              'image/jpeg',
              0.95 // 高质量设置
            );
            return;
          }
        }
      }
      
      // 没有旋转，直接使用原图
      onSkipCrop(originalBlob);
    } catch (error) {
      console.error('处理原图时出错:', error);
      toast.error('处理图片失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [src, rotation, onSkipCrop]);

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    const canvas = canvasRef.current;
    const crop = completedCrop;

    if (!image || !canvas || !crop) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return null;
    }

    const pixelRatio = window.devicePixelRatio;
    canvas.width = crop.width * pixelRatio * scaleX;
    canvas.height = crop.height * pixelRatio * scaleY;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    // 如果有旋转，需要在canvas中心应用旋转
    if (rotation !== 0) {
      const centerX = (crop.width * scaleX) / 2;
      const centerY = (crop.height * scaleY) / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.95, // 提高质量设置，确保高清
      );
    });
  }, [completedCrop, rotation]);

  const handleCropComplete = async () => {
    if (!completedCrop) {
      toast.error('请先选择裁剪区域');
      return;
    }

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg();
      if (croppedImageBlob) {
        onCropComplete(croppedImageBlob);
      } else {
        toast.error('裁剪失败，请重试');
      }
    } catch (error) {
      console.error('裁剪图片时出错:', error);
      toast.error('裁剪失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl max-h-[95vh] w-full flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            裁剪图片为 16:9 比例
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            拖拽调整裁剪区域，确保图片符合展示要求
          </p>
        </div>

        {/* 裁剪区域 */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex justify-center items-center h-full">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(convertToPixelCrop(c, imgRef.current!.width, imgRef.current!.height))}
              aspect={16 / 9}
              minWidth={100}
              minHeight={56}
              className="max-w-full max-h-full"
            >
              <img
                ref={imgRef}
                alt="裁剪预览"
                src={src}
                onLoad={onImageLoad}
                className="max-w-full max-h-full object-contain transition-transform duration-300"
                style={{ 
                  maxHeight: 'calc(95vh - 200px)',
                  transform: `rotate(${rotation}deg)`
                }}
              />
            </ReactCrop>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
          <button
            type="button"
            onClick={handleRotate}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            旋转 90°
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSkipCrop}
              disabled={isProcessing}
              className="px-4 py-2 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  处理中...
                </>
              ) : (
                '不裁剪'
              )}
            </button>
            <button
              type="button"
              onClick={handleCropComplete}
              disabled={isProcessing || !completedCrop}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  处理中...
                </>
              ) : (
                '确认裁剪'
              )}
            </button>
          </div>
        </div>

        {/* 隐藏的canvas用于生成裁剪后的图片 */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageCropper;