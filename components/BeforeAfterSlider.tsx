'use client'

import dynamic from 'next/dynamic';

const ReactBeforeSliderComponent = dynamic(() => import('react-before-after-slider-component'), { ssr: false });

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  height?: number;
}

export default function BeforeAfterSlider({ 
  beforeImage, 
  afterImage, 
  beforeAlt, 
  afterAlt, 
  height = 500 
}: BeforeAfterSliderProps) {
  return (
    <div className="w-full max-w-xl bg-gray-200 rounded-lg overflow-hidden shadow-lg">
      <div style={{ width: '100%', height: height, position: 'relative' }}>
        <ReactBeforeSliderComponent
          firstImage={{
            imageUrl: beforeImage,
            alt: beforeAlt
          }}
          secondImage={{
            imageUrl: afterImage,
            alt: afterAlt
          }}
          currentPercentPosition={50}
          delimiterColor="#ffffff"
          withResizeFeel={true}
          feelsOnlyTheDelimiter={false}
          className="before-after-slider"
        />
      </div>
    </div>
  );
} 