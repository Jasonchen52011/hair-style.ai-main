// WebP support detection utility
export const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true); // SSR环境下默认支持
      return;
    }

    const webP = new Image();
    webP.onload = webP.onerror = function () {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// 获取带fallback的图片路径
export const getImageWithFallback = (webpPath: string, fallbackPath?: string): string => {
  if (typeof window === 'undefined') {
    return webpPath; // SSR环境下直接返回webp
  }
  
  // 简单的浏览器WebP支持检测
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  try {
    const ctx = canvas.getContext('2d');
    if (ctx && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      return webpPath;
    }
  } catch (e) {
    // WebP not supported
  }
  
  // 如果不支持WebP，返回fallback路径（jpg/png版本）
  return fallbackPath || webpPath.replace('.webp', '.jpg');
};

// Hook for WebP support
export const useWebPSupport = () => {
  if (typeof window === 'undefined') {
    return true; // SSR环境下默认支持
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    return !!(ctx && canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0);
  } catch {
    return false;
  }
}; 