// Credits utility functions for managing credit updates across the application

// 创建自定义事件来通知积分变化
export const CREDITS_UPDATED_EVENT = 'creditsUpdated';

// 触发积分更新事件
export const triggerCreditsUpdate = (newCredits?: number) => {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(CREDITS_UPDATED_EVENT, {
      detail: { newCredits }
    });
    window.dispatchEvent(event);
  }
};

// 监听积分更新事件的hook
export const useCreditsUpdateListener = (callback: (newCredits?: number) => void) => {
  if (typeof window === 'undefined') {
    // 服务端渲染时返回空的清理函数
    return () => {};
  }

  const handleCreditsUpdate = (event: CustomEvent) => {
    callback(event.detail?.newCredits);
  };

  window.addEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdate as EventListener);
  
  return () => {
    window.removeEventListener(CREDITS_UPDATED_EVENT, handleCreditsUpdate as EventListener);
  };
}; 