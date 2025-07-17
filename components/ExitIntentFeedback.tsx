"use client";

import { useState, useEffect } from 'react';
import FeedbackModal from './FeedbackModal';

interface ExitIntentConfig {
  // 排除的按钮文本关键词
  excludeButtonTexts?: string[];
  // 排除的按钮CSS类
  excludeButtonClasses?: string[];
  // 排除的链接href
  excludeLinks?: string[];
  // 是否排除禁用按钮
  excludeDisabledButtons?: boolean;
  // 调试模式
  debug?: boolean;
}

interface ExitIntentFeedbackProps {
  config: ExitIntentConfig;
  children: React.ReactNode;
}

export default function ExitIntentFeedback({ config, children }: ExitIntentFeedbackProps) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [hasShownFeedback, setHasShownFeedback] = useState(false);
  const [shouldShowFeedback, setShouldShowFeedback] = useState(false);
  const [feedbackCheckReason, setFeedbackCheckReason] = useState<string>('');
  const [pendingNavigation, setPendingNavigation] = useState<{
    type: 'link' | 'back' | 'forward';
    url?: string;
    event?: any;
  } | null>(null);

  // 默认配置
  const defaultConfig: ExitIntentConfig = {
    excludeButtonTexts: ['subscribe', 'get started', 'requires subscription', 'current plan'],
    excludeButtonClasses: ['bg-purple', 'bg-gradient'],
    excludeLinks: [],
    excludeDisabledButtons: true,
    debug: false
  };

  // 合并配置
  const mergedConfig = {
    ...defaultConfig,
    ...config
  };

  // 检查是否应该显示反馈弹窗
  useEffect(() => {
    const checkFeedbackEligibility = async () => {
      try {
        const response = await fetch('/api/should-show-feedback');
        const result = await response.json();
        
        setShouldShowFeedback(result.shouldShow || false);
        setFeedbackCheckReason(result.reason || '');
        
        if (mergedConfig.debug) {
          console.log('Feedback eligibility check:', result);
        }
      } catch (error) {
        console.error('Error checking feedback eligibility:', error);
        setShouldShowFeedback(false);
        setFeedbackCheckReason('Error checking eligibility');
      }
    };

    checkFeedbackEligibility();
  }, [mergedConfig.debug]);

  // 检查按钮是否应该被排除
  const shouldExcludeButton = (button: HTMLButtonElement): boolean => {
    const buttonText = button.textContent?.toLowerCase() || '';
    const buttonClasses = button.className?.toLowerCase() || '';
    
    // 检查禁用按钮
    if (mergedConfig.excludeDisabledButtons && button.disabled) {
      return true;
    }

    // 检查按钮文本
    if (mergedConfig.excludeButtonTexts) {
      for (const text of mergedConfig.excludeButtonTexts) {
        if (buttonText.includes(text.toLowerCase())) {
          return true;
        }
      }
    }

    // 检查按钮CSS类
    if (mergedConfig.excludeButtonClasses) {
      for (const className of mergedConfig.excludeButtonClasses) {
        if (buttonClasses.includes(className.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  };

  // 检查链接是否应该被排除
  const shouldExcludeLink = (link: HTMLAnchorElement): boolean => {
    const href = link.href;

    // 检查特定链接
    if (mergedConfig.excludeLinks) {
      if (mergedConfig.excludeLinks.includes(href)) {
        return true;
      }
    }

    return false;
  };

  // 页面离开检测和反馈弹窗逻辑
  useEffect(() => {
    // 检测用户交互和链接点击的组合处理
    const handleClick = (e: MouseEvent) => {
      // 首先处理用户交互检测
      if (!hasInteracted) {
        setHasInteracted(true);
        if (mergedConfig.debug) {
          console.log('User interaction detected');
        }
      }

      // 检查是否点击了应该排除的按钮
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      
      if (button && shouldExcludeButton(button)) {
        if (mergedConfig.debug) {
          console.log('Excluded button clicked, not intercepting:', button.textContent);
        }
        return;
      }

      // 处理链接点击检测 - 默认启用
      const link = target.closest('a');

      if (link && link.href) {
        if (shouldExcludeLink(link)) {
          if (mergedConfig.debug) {
            console.log('Excluded link clicked, not intercepting:', link.href);
          }
          return;
        }

        // 检查是否是外部链接或导航到其他页面
        if (
          link.href !== window.location.href &&
          (link.href.startsWith('http') || link.href.startsWith('/')) &&
          hasInteracted &&
          !hasShownFeedback &&
          shouldShowFeedback
        ) {
          if (mergedConfig.debug) {
            console.log('Navigation link detected, preventing default and showing feedback');
          }
          e.preventDefault();
          setPendingNavigation({ type: 'link', url: link.href, event: e });
          setHasShownFeedback(true);
          setShowFeedbackModal(true);
        }
      }
    };

    // 其他用户交互检测
    const handleUserInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        if (mergedConfig.debug) {
          console.log('User interaction detected');
        }
      }
    };

    // 页面可见性变化检测
    const handleVisibilityChange = () => {
      if (document.hidden && hasInteracted && !hasShownFeedback && shouldShowFeedback) {
        if (mergedConfig.debug) {
          console.log('Page hidden, showing feedback modal');
        }
        setHasShownFeedback(true);
        setShowFeedbackModal(true);
      }
    };

    // 页面隐藏事件
    const handlePageHide = () => {
      if (hasInteracted && !hasShownFeedback && shouldShowFeedback) {
        if (mergedConfig.debug) {
          console.log('Page hide event, showing feedback modal');
        }
        setHasShownFeedback(true);
        setShowFeedbackModal(true);
      }
    };

    // 监听前进后退按钮
    const handlePopState = (e: PopStateEvent) => {
      if (hasInteracted && !hasShownFeedback && shouldShowFeedback) {
        if (mergedConfig.debug) {
          console.log('Browser back/forward button clicked, preventing navigation');
        }
        // 阻止导航：推回当前页面状态
        const currentUrl = window.location.href;
        window.history.pushState(null, '', currentUrl);
        
        setPendingNavigation({ type: 'back', event: e });
        setHasShownFeedback(true);
        setShowFeedbackModal(true);
      }
    };

    // 添加事件监听器
    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('mousemove', handleUserInteraction);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('popstate', handlePopState);
    
    // 添加历史状态，用于拦截后退按钮
    window.history.pushState(null, '', window.location.href);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('mousemove', handleUserInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    hasInteracted,
    hasShownFeedback,
    shouldShowFeedback,
    mergedConfig,
    pendingNavigation,
  ]);

  // 当反馈弹窗显示时，记录显示时间戳
  useEffect(() => {
    if (showFeedbackModal && shouldShowFeedback) {
      fetch('/api/should-show-feedback', {
        method: 'POST',
      }).catch(error => {
        console.error('Failed to record feedback shown:', error);
      });
    }
  }, [showFeedbackModal, shouldShowFeedback]);

  // 处理弹窗取消后的导航继续
  const handleFeedbackCancel = () => {
    setShowFeedbackModal(false);
    
    // 取消时执行待定的导航
    if (pendingNavigation) {
      if (mergedConfig.debug) {
        console.log('Feedback cancelled, continuing navigation:', pendingNavigation);
      }

      if (pendingNavigation.type === 'link' && pendingNavigation.url) {
        window.location.href = pendingNavigation.url;
      } else if (pendingNavigation.type === 'back') {
        window.history.back();
      }

      setPendingNavigation(null);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    // 提交反馈后不执行导航，只清除待定导航
    if (mergedConfig.debug) {
      console.log('Feedback submitted, not navigating');
    }
    setPendingNavigation(null);
  };

  return (
    <>
      {children}
      
      {/* Debug Info */}
      {mergedConfig.debug && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-sm max-w-sm">
          <div><strong>Exit Intent Debug:</strong></div>
          <div>• Has interacted: {hasInteracted.toString()}</div>
          <div>• Should show feedback: {shouldShowFeedback.toString()}</div>
          <div>• Reason: {feedbackCheckReason}</div>
          <div>• Has shown: {hasShownFeedback.toString()}</div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={handleFeedbackClose}
        onCancel={handleFeedbackCancel}
      />
    </>
  );
}