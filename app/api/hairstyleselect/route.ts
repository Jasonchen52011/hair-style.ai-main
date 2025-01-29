import { NextRequest, NextResponse } from 'next/server';

// 定义发型数据类型
interface HairStyle {
  style: string;
  description: string;
  category: 'Male' | 'Female';
}

// 所有可用发型数据
const hairStyles: HairStyle[] = [
  // 男士发型
  { style: 'BuzzCut', description: 'Buzz Cut hair', category: 'Male' },
  { style: 'UnderCut', description: 'UnderCut hair', category: 'Male' },
  { style: 'Pompadour', description: 'Pompadour hair', category: 'Male' },
  { style: 'SlickBack', description: 'Slick Back hair', category: 'Male' },
  { style: 'CurlyShag', description: 'Curly Shag hair', category: 'Male' },
  { style: 'WavyShag', description: 'Wavy Shag hair', category: 'Male' },
  { style: 'FauxHawk', description: 'Faux Hawk hair', category: 'Male' },
  { style: 'Spiky', description: 'Spiky hair', category: 'Male' },
  { style: 'CombOver', description: 'Comb-over hair', category: 'Male' },
  { style: 'HighTightFade', description: 'High and Tight Fade hair', category: 'Male' },
  { style: 'ManBun', description: 'Man Bun hair', category: 'Male' },
  { style: 'Afro', description: 'Afro hair', category: 'Male' },
  { style: 'LowFade', description: 'Low Fade hair', category: 'Male' },
  { style: 'UndercutLongHair', description: 'Undercut With Long Hair', category: 'Male' },
  { style: 'TwoBlockHaircut', description: 'Two Block Haircut', category: 'Male' },
  { style: 'TexturedFringe', description: 'Textured Fringe Hair', category: 'Male' },
  { style: 'BluntBowlCut', description: 'Blunt Bowl Cut', category: 'Male' },
  { style: 'LongWavyCurtainBangs', description: 'Long Wavy Curtain Bangs Hair', category: 'Male' },
  { style: 'MessyTousled', description: 'Messy Tousled hair', category: 'Male' },
  { style: 'CornrowBraids', description: 'Cornrow Braids hair', category: 'Male' },
  { style: 'LongHairTiedUp', description: 'Long Hair Tied Up', category: 'Male' },
  { style: 'MiddleParted', description: 'Middle Parted hair', category: 'Male' },
  { style: 'TinfoilPerm', description: 'Tinfoil Perm hair', category: 'Male' },
  { style: 'Chestnut', description: 'Chestnut hair', category: 'Male' },
  { style: 'ChoppyBangs', description: 'Choppy Bangs hair', category: 'Male' },
  
  // 女士发型
  { style: 'ShortPixieWithShavedSides', description: 'Short Pixie With Shaved Sides', category: 'Female' },
  { style: 'ShortNeatBob', description: 'Short neat bob hair', category: 'Female' },
  { style: 'DoubleBun', description: 'Double bun hair', category: 'Female' },
  { style: 'Updo', description: 'Updo hair', category: 'Female' },
  { style: 'PixieCut', description: 'Pixie Cut hair', category: 'Female' },
  { style: 'LongCurly', description: 'Long curly hair', category: 'Female' },
  { style: 'CurlyBob', description: 'Curly bob hair', category: 'Female' },
  { style: 'JapaneseShort', description: 'Japanese Short hair', category: 'Female' },
  { style: 'Spiked', description: 'Spiked hair', category: 'Female' },
  { style: 'bowlCut', description: 'Bowl Cut hair', category: 'Female' },
  { style: 'Chignon', description: 'Chignon hair', category: 'Female' },
  { style: 'SlickedBack', description: 'Slicked Back hair', category: 'Female' },
  { style: 'StackedCurlsInShortBob', description: 'Stacked Curls In Short Bob hair', category: 'Female' },
  { style: 'SidePartCombOverHairstyleWithHighFade', description: 'Side Part Comb Over Hairstyle With High Fade hair', category: 'Female' },
  { style: 'WavyFrenchBobVibesfrom1920', description: 'Wavy French Bob Vibes from 1920 hair', category: 'Female' },
  { style: 'BobCut', description: 'Bob Cut hair', category: 'Female' },
  { style: 'ShortTwintails', description: 'Short Twintails hair', category: 'Female' },
  { style: 'ShortCurlyPixie', description: 'Short Curly Pixie hair', category: 'Female' },
  { style: 'LongStraight', description: 'Long Straight hair', category: 'Female' },
  { style: 'LongWavy', description: 'Long Wavy hair', category: 'Female' },
  { style: 'FishtailBraid', description: 'Fishtail Braid hair', category: 'Female' },
  { style: 'TwinBraids', description: 'Twin Braids hair', category: 'Female' },
  { style: 'Ponytail', description: 'Ponytail hair', category: 'Female' },
  { style: 'Dreadlocks', description: 'Dreadlocks hair', category: 'Female' },
  { style: 'Cornrows', description: 'Cornrows hair', category: 'Female' },
  { style: 'ShoulderLengthHair', description: 'Shoulder Length hair', category: 'Female' },
  { style: 'LooseCurlyAfro', description: 'Loose Curly Afro hair', category: 'Female' },
  { style: 'LongTwintails', description: 'Long Twintails hair', category: 'Female' },
  { style: 'LongHimeCut', description: 'Long Hime Cut hair', category: 'Female' },
  { style: 'BoxBraids', description: 'Box Braids hair', category: 'Female' },
  { style: 'FrenchBangs', description: 'French Bangs hair', category: 'Female' },
  { style: 'MediumLongLayered', description: 'Medium Long Layered hair', category: 'Female' }
];

export async function GET(req: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    // 根据类别筛选发型
    let filteredStyles = hairStyles;
    if (category === 'Male' || category === 'Female') {
      filteredStyles = hairStyles.filter(style => style.category === category);
    }

    return NextResponse.json({ 
      success: true,
      styles: filteredStyles
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}
