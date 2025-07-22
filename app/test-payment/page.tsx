"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const testCheckoutSession = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      // 1. 创建checkout session
      console.log("Creating checkout session...");
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: "prod_SikhNUm5QhhQ7x", // 50 Credits
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      console.log("Checkout session created:", data);
      setResult(data);

      // 2. 检查是否有session ID
      if (data.sessionId) {
        // 可选：自动跳转到Stripe Checkout
        const confirmRedirect = window.confirm("Checkout session created! Redirect to Stripe?");
        if (confirmRedirect) {
          const stripe = await loadStripe(data.publishableKey);
          if (stripe) {
            const { error } = await stripe.redirectToCheckout({
              sessionId: data.sessionId,
            });
            if (error) {
              throw error;
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Test failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkOrders = async () => {
    try {
      const response = await fetch("/api/test-db");
      const data = await response.json();
      console.log("Database status:", data);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Payment System Test</h1>

      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Test Steps</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click "Test Create Checkout Session" to create a Stripe session</li>
            <li>Check console for any errors</li>
            <li>If successful, you'll see the session ID</li>
            <li>Optionally redirect to Stripe Checkout</li>
            <li>After payment, check "Test Database" to see if order was created</li>
          </ol>
        </div>

        <div className="flex gap-4">
          <button
            onClick={testCheckoutSession}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test Create Checkout Session"}
          </button>

          <button
            onClick={checkOrders}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Database
          </button>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-red-700 font-semibold">Error:</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="bg-white p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Important:</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Make sure you're logged in first</li>
            <li>Check browser console for detailed logs</li>
            <li>Check server console for backend errors</li>
            <li>Stripe webhook must be running: stripe listen --forward-to localhost:3000/api/stripe/webhook</li>
          </ul>
        </div>
      </div>
    </div>
  );
}