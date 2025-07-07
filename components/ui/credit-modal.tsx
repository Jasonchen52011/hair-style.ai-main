"use client"

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCredits: number;
  requiredCredits: number;
}

export default function CreditModal({ isOpen, onClose, currentCredits, requiredCredits }: CreditModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoToPricing = () => {
    setIsLoading(true);
    router.push('/pricing');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Not Enough Credits</h3>
          <p className="text-gray-600 mb-4">
            You need {requiredCredits} credits to generate a hairstyle, but you only have {currentCredits} credits remaining.
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGoToPricing}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Redirecting...' : 'Go to Pricing'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 