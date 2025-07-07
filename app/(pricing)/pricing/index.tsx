
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

  const plans = [
    {
      name: "One Time Purchase",
      price: 9.9,
      creemProductId: 'prod_7kbzeBzBsEnWbRA0iTh7wf',
      description: "Perfect for trying out our AI tools",
      features: [
        { name: "1000 Credits" },
        { name: "All Hair Style Tools" },
        { name: "High Quality Results" },
        { name: "Download All Results" },
        { name: "No Monthly Fees" }
      ],
      isFeatured: true
    }
  ];

  return (
    <section className="bg-gray-50 overflow-hidden min-h-screen" id="pricing">
      <div className="py-24 px-8 max-w-5xl mx-auto">
        <div className="flex flex-col text-center w-full mb-20">
        
          <h2 className="font-bold text-3xl lg:text-5xl tracking-tight text-gray-900">
          Pricing
          </h2>
          <p className="font-medium text-xl text-gray-500 mb-4 mt-6">Discover your hair inspiration with Hairstyle AI Pro.</p>
        </div>

        <div className="relative flex justify-center flex-col lg:flex-row items-center lg:items-stretch gap-8">
          {plans.map((plan) => (
            <div key={plan.creemProductId} className="relative w-full max-w-lg">
              {plan.isFeatured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                </div>
              )}


              <div className="relative flex flex-col h-full gap-5 lg:gap-8 z-10 bg-white p-8 rounded-lg shadow-lg">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-lg lg:text-xl font-bold text-gray-900">{plan.name}</p>
                    {plan.description && (
                      <p className="text-gray-600 mt-2">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <p className="text-5xl tracking-tight font-extrabold text-gray-900">
                    ${plan.price}
                  </p>
                  <div className="flex flex-col justify-end mb-[4px]">
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      USD
                    </p>
                  </div>
                </div>
                {plan.features && (
                  <ul className="space-y-2.5 leading-relaxed text-base flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-[18px] h-[18px] text-purple-700 shrink-0"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-700">{feature.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <button 
                    onClick={() => byPlan(plan.creemProductId, user?.id)} 
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    Get Started
                  </button>
                  <p className="flex items-center justify-center gap-2 text-sm text-center text-gray-600 font-medium relative">
                    Pay once. Access forever.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
