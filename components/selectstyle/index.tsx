"use client";

import { useState, useRef, useEffect } from "react";
import toast from 'react-hot-toast';

export interface HairStyle {
  style: string;
  description: string;
  category: "Male" | "Female";
  imageUrl: string;
  alt: string;
}

interface SelectStyleProps {
  uploadedImageUrl?: string;
  onStyleSelect: (style: string) => void;
  defaultStyle?: string;
}

export const hairColors = [
  {
    id: "random",
    color: "linear-gradient(45deg, #ff0000, #00ff00, #0000ff)",
    label: "Random",
    alt: "Multi-colored gradient representing random hair color selection option"
  },
  { id: "black", color: "#000000", label: "Black", alt: "Deep natural black hair color sample" },
  { id: "white", color: "#FFFFFF", label: "White", alt: "Pure white platinum hair color sample" },
  { id: "pink", color: "#FFC0CB", label: "Pink", alt: "Pink hair color sample" },
  { id: "purple", color: "#800080", label: "Purple", alt: "Purple hair color sample" },
  { id: "lightPurple", color: "#E6E6FA", label: "Light Purple", alt: "Light purple hair color sample" },
  { id: "burgundy", color: "#800020", label: "Burgundy", alt: "Burgundy hair color sample" },
  { id: "red", color: "#FF0000", label: "Red", alt: "Red hair color sample" },
  { id: "brown", color: "#964B00", label: "Brown", alt: "Brown hair color sample" },
  { id: "lightBrown", color: "#C4A484", label: "Light Brown", alt: "Light brown hair color sample" },
  { id: "blonde", color: "#FFD700", label: "Blonde", alt: "Blonde hair color sample" },
  { id: "platinumBlonde", color: "#E5E4E2", label: "Platinum Blonde", alt: "Platinum blonde hair color sample" },
  { id: "orange", color: "#FFA500", label: "Orange", alt: "Orange hair color sample" },
  { id: "green", color: "#008000", label: "Green", alt: "Green hair color sample" },
  { id: "darkGreen", color: "#006400", label: "Dark Green", alt: "Dark green hair color sample" },
  { id: "blue", color: "#0000FF", label: "Blue", alt: "Blue hair color sample" },
  { id: "lightBlue", color: "#ADD8E6", label: "Light Blue", alt: "Light blue hair color sample" },
  { id: "darkBlue", color: "#00008B", label: "Dark Blue", alt: "Dark blue hair color sample" },
  { id: "grey", color: "#808080", label: "Grey", alt: "Grey hair color sample" },
  { id: "silver", color: "#C0C0C0", label: "Silver", alt: "Silver hair color sample" },
];

export const femaleStyles: HairStyle[] = [
  { style: "ShortPixieWithShavedSides", description: "Short Pixie", category: "Female", imageUrl: "/images/hairstyles/female/short-pixie.jpg", alt: "Modern short pixie cut with shaved sides, perfect for a bold and contemporary look" },
  { style: "ShortNeatBob", description: "Neat Bob", category: "Female", imageUrl: "/images/hairstyles/female/neat-bob.jpg", alt: "Classic neat bob hairstyle with clean lines and professional finish" },
  { style: "DoubleBun", description: "Double Bun", category: "Female", imageUrl: "/images/hairstyles/female/double-bun.jpg", alt: "Trendy double bun hairstyle popular among young fashion enthusiasts" },
  { style: "Updo", description: "Updo", category: "Female", imageUrl: "/images/hairstyles/female/updo.jpg", alt: "Updo hairstyle" },
  { style: "PixieCut", description: "Pixie Cut", category: "Female", imageUrl: "/images/hairstyles/female/pixie-cut.jpg", alt: "Pixie cut hairstyle" },
  { style: "LongCurly", description: "Long Curly", category: "Female", imageUrl: "/images/hairstyles/female/long-curly.jpg", alt: "Long curly hairstyle" },
  { style: "CurlyBob", description: "Curly Bob", category: "Female", imageUrl: "/images/hairstyles/female/curly-bob.jpg", alt: "Curly bob hairstyle" },
  { style: "JapaneseShort", description: "Japanese Short", category: "Female", imageUrl: "/images/hairstyles/female/japanese-short.jpg", alt: "Japanese short hairstyle" },
  { style: "Spiked", description: "Spiked", category: "Female", imageUrl: "/images/hairstyles/female/spiked.jpg", alt: "Spiked hairstyle" },
  { style: "bowlCut", description: "Bowl Cut", category: "Female", imageUrl: "/images/hairstyles/female/bowl-cut.jpg", alt: "Bowl cut hairstyle" },
  { style: "Chignon", description: "Chignon", category: "Female", imageUrl: "/images/hairstyles/female/chignon.jpg", alt: "Chignon hairstyle" },
  { style: "SlickedBack", description: "Slicked Back", category: "Female", imageUrl: "/images/hairstyles/female/slicked-back.jpg", alt: "Slicked back hairstyle" },
  { style: "StackedCurlsInShortBob", description: "Stacked Curls Bob", category: "Female", imageUrl: "/images/hairstyles/female/stacked-curls-bob.jpg", alt: "Stacked curls bob hairstyle" },
  { style: "SidePartCombOverHairstyleWithHighFade", description: "Side Part High Fade", category: "Female", imageUrl: "/images/hairstyles/female/side-part-fade.jpg", alt: "Side part high fade hairstyle" },
  { style: "WavyFrenchBobVibesfrom1920", description: "Wavy French Bob", category: "Female", imageUrl: "/images/hairstyles/female/wavy-french-bob.jpg", alt: "Wavy french bob hairstyle" },
  { style: "BobCut", description: "Bob Cut", category: "Female", imageUrl: "/images/hairstyles/female/bob-cut.jpg", alt: "Bob cut hairstyle" },
  { style: "ShortTwintails", description: "Short Twintails", category: "Female", imageUrl: "/images/hairstyles/female/short-twintails.jpg", alt: "Short twintails hairstyle" },
  { style: "ShortCurlyPixie", description: "Short Curly Pixie", category: "Female", imageUrl: "/images/hairstyles/female/short-curly-pixie.jpg", alt: "Short curly pixie hairstyle" },
  { style: "LongStraight", description: "Long Straight", category: "Female", imageUrl: "/images/hairstyles/female/long-straight.jpg", alt: "Long straight hairstyle" },
  { style: "LongWavy", description: "Long Wavy", category: "Female", imageUrl: "/images/hairstyles/female/long-wavy.jpg", alt: "Long wavy hairstyle" },
  { style: "FishtailBraid", description: "Fishtail Braid", category: "Female", imageUrl: "/images/hairstyles/female/fishtail-braid.jpg", alt: "Fishtail braid hairstyle" },
  { style: "TwinBraids", description: "Twin Braids", category: "Female", imageUrl: "/images/hairstyles/female/twin-braids.jpg", alt: "Twin braids hairstyle" },
  { style: "Ponytail", description: "Ponytail", category: "Female", imageUrl: "/images/hairstyles/female/ponytail.jpg", alt: "Ponytail hairstyle" },
  { style: "Dreadlocks", description: "Dreadlocks", category: "Female", imageUrl: "/images/hairstyles/female/dreadlocks.jpg", alt: "Dreadlocks hairstyle" },
  { style: "Cornrows", description: "Cornrows", category: "Female", imageUrl: "/images/hairstyles/female/cornrows.jpg", alt: "Cornrows hairstyle" },
  { style: "ShoulderLengthHair", description: "Shoulder Length", category: "Female", imageUrl: "/images/hairstyles/female/shoulder-length.jpg", alt: "Shoulder length hairstyle" },
  { style: "LooseCurlyAfro", description: "Loose Curly Afro", category: "Female", imageUrl: "/images/hairstyles/female/loose-curly-afro.jpg", alt: "Loose curly afro hairstyle" },
  { style: "LongTwintails", description: "Long Twintails", category: "Female", imageUrl: "/images/hairstyles/female/long-twintails.jpg", alt: "Long twintails hairstyle" },
  { style: "LongHimeCut", description: "Long Hime Cut", category: "Female", imageUrl: "/images/hairstyles/female/long-hime-cut.jpg", alt: "Long hime cut hairstyle" },
  { style: "BoxBraids", description: "Box Braids", category: "Female", imageUrl: "/images/hairstyles/female/box-braids.jpg", alt: "Box braids hairstyle" },
  { style: "FrenchBangs", description: "French Bangs", category: "Female", imageUrl: "/images/hairstyles/female/french-bangs.jpg", alt: "French bangs hairstyle" },
  { style: "MediumLongLayered", description: "Medium Long Layered", category: "Female", imageUrl: "/images/hairstyles/female/medium-long-layered.jpg", alt: "Medium long layered hairstyle" }
];

export const maleStyles: HairStyle[] = [
  { style: "BuzzCut", description: "Buzz Cut", category: "Male", imageUrl: "/images/hairstyles/male/buzz-cut.jpg", alt: "Classic military-inspired buzz cut with uniform short length" },
  { style: "UnderCut", description: "Undercut", category: "Male", imageUrl: "/images/hairstyles/male/undercut.jpg", alt: "Modern undercut with contrasting lengths between top and sides" },
  { style: "Pompadour", description: "Pompadour", category: "Male", imageUrl: "/images/hairstyles/male/pompadour.jpg", alt: "Classic pompadour style with volume on top and shorter sides" },
  { style: "SlickBack", description: "Slick Back", category: "Male", imageUrl: "/images/hairstyles/male/slick-back.jpg", alt: "Slick back hairstyle" },
  { style: "CurlyShag", description: "Curly Shag", category: "Male", imageUrl: "/images/hairstyles/male/curly-shag.jpg", alt: "Curly shag hairstyle" },
  { style: "WavyShag", description: "Wavy Shag", category: "Male", imageUrl: "/images/hairstyles/male/wavy-shag.jpg", alt: "Wavy shag hairstyle" },
  { style: "FauxHawk", description: "Faux Hawk", category: "Male", imageUrl: "/images/hairstyles/male/faux-hawk.jpg", alt: "Faux hawk hairstyle" },
  { style: "Spiky", description: "Spiky", category: "Male", imageUrl: "/images/hairstyles/male/spiky.jpg", alt: "Spiky hairstyle" },
  { style: "CombOver", description: "Comb Over", category: "Male", imageUrl: "/images/hairstyles/male/comb-over.jpg", alt: "Comb over hairstyle" },
  { style: "HighTightFade", description: "High Tight Fade", category: "Male", imageUrl: "/images/hairstyles/male/high-tight-fade.jpg", alt: "High tight fade hairstyle" },
  { style: "ManBun", description: "Man Bun", category: "Male", imageUrl: "/images/hairstyles/male/man-bun.jpg", alt: "Man bun hairstyle" },
  { style: "Afro", description: "Afro", category: "Male", imageUrl: "/images/hairstyles/male/afro.jpg", alt: "Afro hairstyle" },
  { style: "LowFade", description: "Low Fade", category: "Male", imageUrl: "/images/hairstyles/male/low-fade.jpg", alt: "Low fade hairstyle" },
  { style: "UndercutLongHair", description: "Undercut Long Hair", category: "Male", imageUrl: "/images/hairstyles/male/undercut-long-hair.jpg", alt: "Undercut long hair hairstyle" },
  { style: "TwoBlockHaircut", description: "Two Block", category: "Male", imageUrl: "/images/hairstyles/male/two-block.jpg", alt: "Two block hairstyle" },
  { style: "TexturedFringe", description: "Textured Fringe", category: "Male", imageUrl: "/images/hairstyles/male/textured-fringe.jpg", alt: "Textured fringe hairstyle" },
  { style: "BluntBowlCut", description: "Blunt Bowl Cut", category: "Male", imageUrl: "/images/hairstyles/male/blunt-bowl-cut.jpg", alt: "Blunt bowl cut hairstyle" },
  { style: "LongWavyCurtainBangs", description: "Long Wavy Curtain", category: "Male", imageUrl: "/images/hairstyles/male/long-wavy-curtain.jpg", alt: "Long wavy curtain hairstyle" },
  { style: "MessyTousled", description: "Messy Tousled", category: "Male", imageUrl: "/images/hairstyles/male/messy-tousled.jpg", alt: "Messy tousled hairstyle" },
  { style: "CornrowBraids", description: "Cornrow Braids", category: "Male", imageUrl: "/images/hairstyles/male/cornrow-braids.jpg", alt: "Cornrow braids hairstyle" },
  { style: "LongHairTiedUp", description: "Long Hair Tied Up", category: "Male", imageUrl: "/images/hairstyles/male/long-hair-tied-up.jpg", alt: "Long hair tied up hairstyle" },
  { style: "TinfoilPerm", description: "Tinfoil Perm", category: "Male", imageUrl: "/images/hairstyles/male/tinfoil-perm.jpg", alt: "Tinfoil perm hairstyle" },
  { style: "Chestnut", description: "Chestnut", category: "Male", imageUrl: "/images/hairstyles/male/chestnut.jpg", alt: "Chestnut hairstyle" },
  { style: "ChoppyBangs", description: "Choppy Bangs", category: "Male", imageUrl: "/images/hairstyles/male/choppy-bangs.jpg", alt: "Choppy bangs hairstyle" }
];

export default function SelectStyle({
  uploadedImageUrl,
  onStyleSelect,
  defaultStyle,
}: SelectStyleProps) {
  const [selectedGender, setSelectedGender] = useState<"Female" | "Male">("Female");
  const [selectedStyle, setSelectedStyle] = useState<string>(defaultStyle || "");
  const [selectedColor, setSelectedColor] = useState<string>("brown");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (defaultStyle) {
      const femaleStyle = femaleStyles.find(style => style.style === defaultStyle);
      if (femaleStyle) {
        setSelectedGender("Female");
      } else {
        const maleStyle = maleStyles.find(style => style.style === defaultStyle);
        if (maleStyle) {
          setSelectedGender("Male");
        }
      }
      setSelectedStyle(defaultStyle);
    }
  }, [defaultStyle]);

  const currentStyles = selectedGender === "Female" ? femaleStyles : maleStyles;

  const handleStyleClick = (style: string) => {
    setSelectedStyle(style);
  };

  const pollTaskStatus = async (taskId: string, maxAttempts = 12) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`/api/submit?taskId=${taskId}`);
        if (!response.ok) continue;
        
        const data = await response.json();
        if (data.task_status === 2 && data.data?.images) {
          return data;
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Poll error:', error);
      }
    }
    throw new Error('Processing timeout');
  };

  const handleGenerate = async () => {
    if (!uploadedImageUrl || !selectedStyle) {
      toast.error('Please select a hairstyle first');
      return;
    }

    try {
      setIsLoading(true);

      const finalColor = selectedColor === 'random' 
        ? hairColors.filter(c => c.id !== 'random')[Math.floor(Math.random() * (hairColors.length - 1))].id
        : selectedColor;

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: uploadedImageUrl,
          hairStyle: selectedStyle,
          hairColor: finalColor,
        }),
      });

      if (response.status === 429) {
        toast.error('You have reached your daily limit of 5 free generations. Please try again tomorrow.', {
          duration: 5000,
          style: {
            background: '#1F2937',
            color: '#fff',
          },
        });
        return;
      }

      const data = await response.json();
      
      if (data.status === 'processing' && data.taskId) {
        const result = await pollTaskStatus(data.taskId);
        if (result.data.images) {
          const firstStyle = Object.keys(result.data.images)[0];
          const imageUrl = result.data.images[firstStyle][0];
          
          const currentStyle = currentStyles.find(style => style.style === selectedStyle);
          const imageUrlWithStyle = `${imageUrl}?style=${encodeURIComponent(currentStyle?.description || 'hairstyle')}`;
          
          onStyleSelect?.(imageUrlWithStyle);
          
          toast.success('Generate Success!', {
            duration: 3000,
            position: 'top-center',
            style: {
              background: '#1F2937',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              marginTop: '100px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            icon: '✨',
          });
        } else {
          throw new Error('Failed to get result image');
        }
      } else if (!data.success) {
        throw new Error(data.error || 'Failed to process image');
      }

    } catch (error) {
      console.error('Style selection error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 bg-gray-50 p-2 rounded-lg">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedGender("Female");
              setSelectedStyle("");
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm ${
              selectedGender === "Female"
                ? "bg-purple-700 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Female Hairstyle
          </button>
          <button
            onClick={() => {
              setSelectedGender("Male");
              setSelectedStyle("");
            }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm ${
              selectedGender === "Male"
                ? "bg-purple-700 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            Male Hairstyle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-4 overflow-y-auto h-[380px]">
        {currentStyles.map((style) => (
          <button
            key={style.style}
            onClick={() => handleStyleClick(style.style)}
            className={`p-1 rounded-2xl border transition-all flex flex-col ${
              selectedStyle === style.style
                ? "border-purple-700 bg-purple-700 shadow-md"
                : "border-transparent hover:border-gray-200 bg-gray-100 hover:shadow-sm"
            }`}
          >
            <div className="w-full h-[120px] mb-2 overflow-hidden rounded-xl">
            <img
              src={style.imageUrl}
              alt={`Trendy ${style.description} hairstyle - a popular modern haircut choice for fashion-forward individuals`}
              className="w-full h-full object-cover"
            />
            </div>
            <p className={`text-xs font-medium text-center min-h-[2.0em] flex items-center justify-center text-center w-full ${
              selectedStyle === style.style ? "text-white" : "text-gray-700"
            }`}>
              {style.description}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {hairColors.map((color) => (
          <button
            key={color.id}
            onClick={() => setSelectedColor(color.id)}
            className={`w-8 h-8 rounded-md transition-all ${
              selectedColor === color.id 
                ? "ring-2 ring-purple-700 ring-offset-1" 
                : "border border-gray-200 hover:border-gray-300"
            }`}
            style={{
              background: color.id === "random" 
                ? color.color 
                : `linear-gradient(45deg, 
                    ${color.color} 0%, 
                    white 1%, 
                    ${color.color} 30%, 
                    ${color.color} 90%,
                    white 99%
                )`,
              boxShadow: color.id === "white" 
                  ? "inset 0 0 0 1px rgba(0,0,0,0.1)"
                  : undefined,
            }}
            title={color.label}
          >
            {color.id === "random" && (
              <span className="text-xs font-bold">?</span>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleGenerate}
        className="w-full mt-8 py-4 bg-purple-700 text-white rounded-lg font-medium hover:bg-purple-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={!selectedStyle || !uploadedImageUrl || isLoading}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating...
          </div>
        ) : !uploadedImageUrl ? (
          "Upload Photo"
        ) : !selectedStyle ? (
          "Select a Hairstyle"
        ) : (
          "Generate"
        )}
      </button>
    </div>
  );
}