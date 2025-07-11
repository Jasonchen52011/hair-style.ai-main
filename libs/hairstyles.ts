// Hair styles and colors data
export interface HairStyle {
  style: string;
  description: string;
  category: "Male" | "Female";
  imageUrl: string;
  alt: string;
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
  { style: "BobCut", description: "Bob Cut", category: "Female", imageUrl: "/images/hairstyles/female/bob-cut.webp", alt: "Bob cut hairstyle" },
  { style: "ShortPixieWithShavedSides", description: "Short Pixie", category: "Female", imageUrl: "/images/hairstyles/female/short-pixie.webp", alt: "Modern short pixie cut with shaved sides, perfect for a bold and contemporary look" },
  { style: "DoubleBun", description: "Double Bun", category: "Female", imageUrl: "/images/hairstyles/female/double-bun.webp", alt: "Trendy double bun hairstyle popular among young fashion enthusiasts" },
  { style: "Updo", description: "Updo", category: "Female", imageUrl: "/images/hairstyles/female/updo.webp", alt: "Updo hairstyle" },
  { style: "PixieCut", description: "Pixie Cut", category: "Female", imageUrl: "/images/hairstyles/female/pixie-cut.webp", alt: "Pixie cut hairstyle" },
  { style: "LongCurly", description: "Long Curly", category: "Female", imageUrl: "/images/hairstyles/female/long-curly.webp", alt: "Long curly hairstyle" },
  { style: "CurlyBob", description: "Curly Bob", category: "Female", imageUrl: "/images/hairstyles/female/curly-bob.webp", alt: "Curly bob hairstyle" },
  { style: "JapaneseShort", description: "Japanese Short", category: "Female", imageUrl: "/images/hairstyles/female/japanese-short.webp", alt: "Japanese short hairstyle" },
  { style: "Spiked", description: "Spiked", category: "Female", imageUrl: "/images/hairstyles/female/spiked.webp", alt: "Spiked hairstyle" },
  { style: "bowlCut", description: "Bowl Cut", category: "Female", imageUrl: "/images/hairstyles/female/bowl-cut.webp", alt: "Bowl cut hairstyle" },
  { style: "Chignon", description: "Chignon", category: "Female", imageUrl: "/images/hairstyles/female/chignon.webp", alt: "Chignon hairstyle" },
  { style: "SlickedBack", description: "Slicked Back", category: "Female", imageUrl: "/images/hairstyles/female/slicked-back.webp", alt: "Slicked back hairstyle" },
  { style: "StackedCurlsInShortBob", description: "Stacked Curls Bob", category: "Female", imageUrl: "/images/hairstyles/female/stacked-curls-bob.webp", alt: "Stacked curls bob hairstyle" },
  { style: "SidePartCombOverHairstyleWithHighFade", description: "Side Part High Fade", category: "Female", imageUrl: "/images/hairstyles/female/side-part-fade.webp", alt: "Side part high fade hairstyle" },
  { style: "WavyFrenchBobVibesfrom1920", description: "Wavy French Bob", category: "Female", imageUrl: "/images/hairstyles/female/wavy-french-bob.webp", alt: "Wavy french bob hairstyle" },
  { style: "ShortTwintails", description: "Short Twintails", category: "Female", imageUrl: "/images/hairstyles/female/short-twintails.webp", alt: "Short twintails hairstyle" },
  { style: "ShortCurlyPixie", description: "Short Curly Pixie", category: "Female", imageUrl: "/images/hairstyles/female/short-curly-pixie.webp", alt: "Short curly pixie hairstyle" },
  { style: "LongStraight", description: "Long Straight", category: "Female", imageUrl: "/images/hairstyles/female/long-straight.webp", alt: "Long straight hairstyle" },
  { style: "LongWavy", description: "Long Wavy", category: "Female", imageUrl: "/images/hairstyles/female/long-wavy.webp", alt: "Long wavy hairstyle" },
  { style: "FishtailBraid", description: "Fishtail Braid", category: "Female", imageUrl: "/images/hairstyles/female/fishtail-braid.webp", alt: "Fishtail braid hairstyle" },
  { style: "TwinBraids", description: "Twin Braids", category: "Female", imageUrl: "/images/hairstyles/female/twin-braids.webp", alt: "Twin braids hairstyle" },
  { style: "Ponytail", description: "Ponytail", category: "Female", imageUrl: "/images/hairstyles/female/ponytail.webp", alt: "Ponytail hairstyle" },
  { style: "Dreadlocks", description: "Dreadlocks", category: "Female", imageUrl: "/images/hairstyles/female/dreadlocks.webp", alt: "Dreadlocks hairstyle" },
  { style: "Cornrows", description: "Cornrows", category: "Female", imageUrl: "/images/hairstyles/female/cornrows.webp", alt: "Cornrows hairstyle" },
  { style: "ShoulderLengthHair", description: "Shoulder Length", category: "Female", imageUrl: "/images/hairstyles/female/shoulder-length.webp", alt: "Shoulder length hairstyle" },
  { style: "LooseCurlyAfro", description: "Loose Curly Afro", category: "Female", imageUrl: "/images/hairstyles/female/loose-curly-afro.webp", alt: "Loose curly afro hairstyle" },
  { style: "LongTwintails", description: "Long Twintails", category: "Female", imageUrl: "/images/hairstyles/female/long-twintails.webp", alt: "Long twintails hairstyle" },
  { style: "LongHimeCut", description: "Long Hime Cut", category: "Female", imageUrl: "/images/hairstyles/female/long-hime-cut.webp", alt: "Long hime cut hairstyle" },
  { style: "BoxBraids", description: "Box Braids", category: "Female", imageUrl: "/images/hairstyles/female/box-braids.webp", alt: "Box braids hairstyle" },
  { style: "FrenchBangs", description: "French Bangs", category: "Female", imageUrl: "/images/hairstyles/female/french-bangs.webp", alt: "French bangs hairstyle" },
  { style: "MediumLongLayered", description: "Medium Long Layered", category: "Female", imageUrl: "/images/hairstyles/female/medium-long-layered.webp", alt: "Medium long layered hairstyle" },
  { style: "BuzzCut", description: "Buzz Cut", category: "Female", imageUrl: "/images/hairstyles/female/buzzcutfemale.webp", alt: "Bold and edgy buzz cut hairstyle for women, perfect for a minimalist and confident look" }
];

export const maleStyles: HairStyle[] = [
  { style: "BuzzCut", description: "Buzz Cut", category: "Male", imageUrl: "/images/hairstyles/male/buzz-cut.webp", alt: "Classic military-inspired buzz cut with uniform short length" },
  { style: "UnderCut", description: "Undercut", category: "Male", imageUrl: "/images/hairstyles/male/undercut.webp", alt: "Modern undercut with contrasting lengths between top and sides" },
  { style: "Pompadour", description: "Pompadour", category: "Male", imageUrl: "/images/hairstyles/male/pompadour.webp", alt: "Classic pompadour style with volume on top and shorter sides" },
  { style: "SlickBack", description: "Slick Back", category: "Male", imageUrl: "/images/hairstyles/male/slick-back.webp", alt: "Slick back hairstyle" },
  { style: "CurlyShag", description: "Curly Shag", category: "Male", imageUrl: "/images/hairstyles/male/curly-shag.webp", alt: "Curly shag hairstyle" },
  { style: "WavyShag", description: "Wavy Shag", category: "Male", imageUrl: "/images/hairstyles/male/wavy-shag.webp", alt: "Wavy shag hairstyle" },
  { style: "FauxHawk", description: "Faux Hawk", category: "Male", imageUrl: "/images/hairstyles/male/faux-hawk.webp", alt: "Faux hawk hairstyle" },
  { style: "Spiky", description: "Spiky", category: "Male", imageUrl: "/images/hairstyles/male/spiky.webp", alt: "Spiky hairstyle" },
  { style: "CombOver", description: "Comb Over", category: "Male", imageUrl: "/images/hairstyles/male/comb-over.webp", alt: "Comb over hairstyle" },
  { style: "HighTightFade", description: "High Tight Fade", category: "Male", imageUrl: "/images/hairstyles/male/high-tight-fade.webp", alt: "High tight fade hairstyle" },
  { style: "ManBun", description: "Man Bun", category: "Male", imageUrl: "/images/hairstyles/male/man-bun.webp", alt: "Man bun hairstyle" },
  { style: "Afro", description: "Afro", category: "Male", imageUrl: "/images/hairstyles/male/afro.webp", alt: "Afro hairstyle" },
  { style: "LowFade", description: "Low Fade", category: "Male", imageUrl: "/images/hairstyles/male/low-fade.webp", alt: "Low fade hairstyle" },
  { style: "UndercutLongHair", description: "Undercut Long Hair", category: "Male", imageUrl: "/images/hairstyles/male/undercut-long-hair.webp", alt: "Undercut long hair hairstyle" },
  { style: "TwoBlockHaircut", description: "Two Block", category: "Male", imageUrl: "/images/hairstyles/male/two-block.webp", alt: "Two block hairstyle" },
  { style: "TexturedFringe", description: "Textured Fringe", category: "Male", imageUrl: "/images/hairstyles/male/textured-fringe.webp", alt: "Textured fringe hairstyle" },
  { style: "BluntBowlCut", description: "Blunt Bowl Cut", category: "Male", imageUrl: "/images/hairstyles/male/blunt-bowl-cut.webp", alt: "Blunt bowl cut hairstyle" },
  { style: "LongWavyCurtainBangs", description: "Long Wavy Curtain", category: "Male", imageUrl: "/images/hairstyles/male/long-wavy-curtain.webp", alt: "Long wavy curtain hairstyle" },
  { style: "MessyTousled", description: "Messy Tousled", category: "Male", imageUrl: "/images/hairstyles/male/messy-tousled.webp", alt: "Messy tousled hairstyle" },
  { style: "CornrowBraids", description: "Cornrow Braids", category: "Male", imageUrl: "/images/hairstyles/male/cornrow-braids.webp", alt: "Cornrow braids hairstyle" },
  { style: "LongHairTiedUp", description: "Long Hair Tied Up", category: "Male", imageUrl: "/images/hairstyles/male/long-hair-tied-up.webp", alt: "Long hair tied up hairstyle" },
  { style: "TinfoilPerm", description: "Tinfoil Perm", category: "Male", imageUrl: "/images/hairstyles/male/tinfoil-perm.webp", alt: "Tinfoil perm hairstyle" },
  { style: "Chestnut", description: "Chestnut", category: "Male", imageUrl: "/images/hairstyles/male/chestnut.webp", alt: "Chestnut hairstyle" },
  { style: "ChoppyBangs", description: "Choppy Bangs", category: "Male", imageUrl: "/images/hairstyles/male/choppy-bangs.webp", alt: "Choppy bangs hairstyle" }
]; 