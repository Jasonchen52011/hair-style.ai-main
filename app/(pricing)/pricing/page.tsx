"use client";

import { useUser } from "@clerk/nextjs";

export default function PricingPage () {

  const { user } = useUser()
  console.log("user", user)

  const byPlan = async (productId: string, userId?: string) => {
    const response = await fetch(`/api/buy-product?productId=${productId}&userId=${userId}`, {
      method: "GET"
    });
    const result = await response.json();
    console.log(result)
    if (result?.redirectData?.checkout_url) {
      window.location.href = result.redirectData.checkout_url
    }
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold">Pricing Page</h1>
      <div className="flex gap-4">
        <div>
          <button onClick={() => byPlan('prod_40EdJ5py70srRz09UxxlVB', user?.id)} className="bg-blue-500 text-white px-4 py-2 rounded">One time</button>
        </div>
        <div>
          <button onClick={() => byPlan('prod_6Afnt4rPxLsThiq03xClcP', user?.id)} className="bg-blue-500 text-white px-4 py-2 rounded">Monthly</button>
        </div>
      </div>
    </div>
  );
}