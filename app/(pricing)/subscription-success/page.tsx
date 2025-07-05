"use client"

import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react";

export default function SubscriptionSuccess () {
  const { user } = useUser();
  const search = useSearchParams()
  const checkout_id = search.get("checkout_id")
  const order_id = search.get("order_id")
  const customer_id = search.get("customer_id")
  const membership = user?.publicMetadata?.membership as String | undefined || ''
  const balance = user?.publicMetadata?.balance as number | undefined || 0;
  const [loading, setLoading] = useState(false);

  const updateMeta = async (order_id: string, user: any) => {
    await fetch('/api/update-user-meta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user?.id,
        paymentParams: Object.fromEntries(search.entries().filter(([key]) => key !== 'signature')),
        meta: {
          membership: 'monthly',
          balance: 100,
          lastOrder: order_id,
          updatedAt: new Date().getTime(),
        }
      }),
    })
    setLoading(false)
  }

  useEffect(() => {
    if (order_id && user?.id && user?.publicMetadata.lastOrder !== order_id) {
      // Update user metadata with the payment details
      updateMeta(order_id, user);
    }
  }, [user, order_id])

  return (
    <div>
      <h2>Your payment success</h2>
      <div>checkout id: {checkout_id}</div>
      <div>order id: {order_id}</div>
      <div>customer id: {customer_id}</div>
      {loading ? <p>Updating your membership...</p> : <p>Membership updated successfully!</p>}
      {membership && !loading && <h3>Your membership: {membership}, balance: {balance}</h3>}
    </div>
  )
}