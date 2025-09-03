"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

interface Hairstyle {
  id: string;
  style: string;
  name: string;
  gender: "Male" | "Female";
  image: string;
  vibe: string;
  suitableFaceShapes: string[];
  maintenanceTips: string;
}

type GenderFilter = "Male" | "Female";

export default function RandomHairstyleGenerator() {
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [randomHairstyles, setRandomHairstyles] = useState<Hairstyle[]>([]);
  const [count, setCount] = useState(3);
  
  // Set initial count to 1 on mobile
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setCount(1);
    }
  }, []);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("Female");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hairstyles")
      .then((res) => res.json())
      .then((data) => {
        setHairstyles(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err.message);
        setIsLoading(false);
      });
  }, []);

  const getRandomHairstyles = (num: number) => {
    if (hairstyles.length === 0) return;
    
    // Filter hairstyles by gender
    const filteredHairstyles = hairstyles.filter(h => h.gender === genderFilter);
    
    if (filteredHairstyles.length === 0) return;
    
    const shuffled = [...filteredHairstyles].sort(() => 0.5 - Math.random());
    setRandomHairstyles(shuffled.slice(0, Math.min(num, filteredHairstyles.length)));
  };

  useEffect(() => {
    if (hairstyles.length > 0) getRandomHairstyles(count);
    // eslint-disable-next-line
  }, [hairstyles, count, genderFilter]);

  const handleCountChange = (delta: number) => {
    setCount((prev) => {
      let next = prev + delta;
      if (next < 1) next = 1;
      if (next > 6) next = 6;
      getRandomHairstyles(next);
      return next;
    });
  };


  const handleGenderChange = (gender: GenderFilter) => {
    setGenderFilter(gender);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hairstyles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col mt-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="mt-2 text-3xl md:text-5xl font-bold text-center mb-4 text-gray-800">
                Random Hairstyle Generator
              </h1>
              <p className="text-gray-600 text-lg text-center mb-4">
                Searching for a new look? Our random hairstyle generator offers personalized results based on your style preferences. With over 60+ styles for both men and women, get real-time suggestions and care tips. Free and easy to use anytime!
              </p>
            </div>
            
            {/* Controls and Gender Filter */}
            <div className="hidden md:flex justify-center items-center gap-4 mb-3">
              {/* Number Controls First */}
              <div className="flex items-center gap-3 bg-white px-4 py-1 rounded-lg shadow-sm border border-gray-200">
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
                  onClick={() => handleCountChange(-1)}
                  aria-label="Decrease"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                <span className="text-2xl font-bold w-8 text-center select-none text-purple-700">{count}</span>
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
                  onClick={() => handleCountChange(1)}
                  aria-label="Increase"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
              
              {/* Gender Filter Second */}
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                <button
                  className={`px-6 py-2 rounded-md font-medium transition-all ${
                    genderFilter === "Male"
                      ? "bg-purple-700 text-white"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={() => handleGenderChange("Male")}
                >
                  Male
                </button>
                <button
                  className={`px-6 py-2 rounded-md font-medium transition-all ${
                    genderFilter === "Female"
                      ? "bg-purple-700 text-white"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  onClick={() => handleGenderChange("Female")}
                >
                  Female
                </button>
              </div>
              
              <button
                className="bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors shadow-md"
                onClick={() => getRandomHairstyles(count)}
              >
                Generate New Styles
              </button>
            </div>
            
            {/* Hairstyle Cards */}
            <div className={`${
              randomHairstyles.length === 1 
                ? 'flex justify-center' 
                : randomHairstyles.length === 2 
                ? 'grid grid-cols-1 md:grid-cols-2 justify-items-center max-w-4xl mx-auto'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center'
            } gap-6 mb-8`}>
              {randomHairstyles.map((hairstyle) => (
                <div
                  key={hairstyle.id}
                  className="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col w-full max-w-[360px] hover:transform hover:scale-105"
                >
                  <div
                    className="block flex-grow"
                  >
                    <div className="relative">
                      <Image
                        src={hairstyle.image}
                        alt={hairstyle.name}
                        width={360}
                        height={440}
                        className="w-full h-[21rem] object-cover"
                        priority={false}
                      />
                      {/* 暂时隐藏详情按钮
                      <button
                        className="absolute top-3 right-3 z-10 rounded-xl bg-black/60 hover:bg-black/80 p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
                        onClick={e => { e.stopPropagation(); handleShowInfo(hairstyle); }}
                        aria-label="Show Details"
                      >
                        <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
                          <line x1="12" y1="8" x2="12" y2="12" stroke="white" strokeWidth="2" />
                          <circle cx="12" cy="16" r="1" fill="white" />
                        </svg>
                      </button>
                      */}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-gray-800">{hairstyle.name}</h2>
                        <a
                          href={`/ai-hairstyle?style=${hairstyle.style}&gender=${hairstyle.gender.toLowerCase()}`}
                          className="px-3 py-1.5 bg-white text-purple-700 border border-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
                        >
                          Try this hairstyle
                        </a>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600">
                          <span className="font-medium">Vibe:</span> {hairstyle.vibe}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Best for:</span> {hairstyle.suitableFaceShapes.join(", ")}
                        </p>
                        <p className="text-gray-600 line-clamp-2">
                          <span className="font-medium">Maintenance:</span> {hairstyle.maintenanceTips}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Controls */}
            <div className="md:hidden flex flex-col items-center gap-4 mt-6 mb-8">
              {/* Mobile Controls Row - All in one line */}
              <div className="flex items-center gap-3">
                {/* Number Controls */}
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
                    onClick={() => handleCountChange(-1)}
                    aria-label="Decrease"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  <span className="text-xl font-bold w-6 text-center select-none text-purple-700">{count}</span>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 hover:bg-purple-200 transition-colors"
                    onClick={() => handleCountChange(1)}
                    aria-label="Increase"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
                
                {/* Gender Filter */}
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                  <button
                    className={`px-4 py-1.5 rounded-md font-medium text-sm transition-all ${
                      genderFilter === "Male"
                        ? "bg-purple-700 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    onClick={() => handleGenderChange("Male")}
                  >
                    Male
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded-md font-medium text-sm transition-all ${
                      genderFilter === "Female"
                        ? "bg-purple-700 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    onClick={() => handleGenderChange("Female")}
                  >
                    Female
                  </button>
                </div>
              </div>
              <button
                className="bg-purple-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors shadow-md w-full max-w-xs"
                onClick={() => getRandomHairstyles(count)}
              >
                Generate New Styles
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}