"use client"

import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation"
import { useEffect } from "react";

export default function PaymentSuccess () {
  const { user } = useUser();
  const search = useSearchParams()
  const checkout_id = search.get("checkout_id")
  const order_id = search.get("order_id")
  const customer_id = search.get("customer_id")
  const membership = user?.publicMetadata?.membership as String | undefined || ''
  const balance = user?.publicMetadata?.balance as number | undefined || 0;

  useEffect(() => {
    if (order_id && user?.id) {
      // Update user metadata with the payment details
      fetch('/api/update-user-meta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          meta: {
            membership: 'onetime',
            balance: 1000,
            lastOrder: order_id,
            updatedAt: new Date().getTime(),
          }
        }),
      })
    }
  }, [user, order_id])

  return (
    <div className="min-h-screen bg-white p-20">
      <div className="max-w-2xl mx-auto ">
        <div className="text-center mb-4 mt-16">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-10">Payment Successful!</h1>
          <p className="text-gray-600">Thank you for your purchase.</p>
        </div>

        <div className="text-center">
          <button 
            onClick={() => window.location.href = '/ai-hairstyle'}
            className="bg-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-800 mr-4"
          >
            Start Creating
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
