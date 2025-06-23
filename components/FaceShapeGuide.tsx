'use client';

import { useState } from 'react';

const FaceShapeGuide = () => {
  const [activeTab, setActiveTab] = useState<'women' | 'men'>('women');

  // 女性脸型数据
  const womenFaceShapes = [
    {
      id: 'oval-women',
      title: 'Oval Face Shape: A Versatile and Balanced Look',
      description: 'The oval face shape is considered the ideal, with a length greater than its width and a jawline that\'s just a little narrower than the hairline. This gives you the freedom to experiment with nearly every hairstyle! Personally, I love how effortless a long, sleek bob looks on an oval face—it\'s chic yet simple. Whether you\'re rocking beachy waves or a side-swept fringe, the options are endless. It\'s a face shape that truly allows for all kinds of creativity, making it easy to find a style that feels uniquely yours.',
      image: '/images/face-shape-women-Oval.webp'
    },
    {
      id: 'round-women',
      title: 'Round Face Shape: Add Angles and Elongate Your Features',
      description: 'Round faces have soft, rounded contours, and wide cheekbones that give a youthful appearance. The key is to add some angles and elongate the face to create a more structured look. I\'ve always found that a layered pixie cut or a side-parted bob really helps lengthen the face, giving it that perfect balance of softness and sharpness. For a bit of fun, I recommend trying a high, voluminous bun—it brings attention to your cheekbones while balancing out the roundness.',
      image: '/images/face-shape-women-round.webp'
    },
    {
      id: 'square-women',
      title: 'Square Face Shape: Softening Angles and Creating Balance',
      description: 'Square faces are defined by their strong, angular jawlines and wide foreheads, which give them a bold, confident look. The goal is to soften these sharp angles, and I\'ve found that a textured bob works wonders. It creates a soft, feminine outline without hiding the face\'s natural structure. I\'ve always loved the effect of a tousled wave on square faces—it softens the edges and adds a relaxed, yet refined vibe.',
      image: '/images/face-shape-women-square.webp'
    },
    {
      id: 'heart-women',
      title: 'Heart Face Shape: Effortless Elegance with Any Hairstyle',
      description: 'Heart faces are often seen as the ideal face shape because of their balanced proportions. The longer length and narrower jawline provide a versatile canvas for a wide range of hairstyles. Personally, I think the beauty of a heart face is that almost any hairstyle will look great. I love how a sleek straight hairstyle can enhance the natural symmetry of a heart face, but don\'t be afraid to try something bold like a voluminous pixie cut.',
      image: '/images/face-shape-women-heart.webp'
    },
    {
      id: 'diamond-women',
      title: 'Diamond Face Shape: Create Definition and Add Length',
      description: 'A diamond face is soft and full, with rounded cheeks and a rounded jawline. The goal is to elongate the face and add angles to create a more structured look. One of my favorite styles for a diamond face is a layered lob (long bob), which can add both length and structure. Adding volume on top can visually elongate the face, giving it a more defined appearance. Also, I highly recommend trying a side part—it helps add some sharpness and balance.',
      image: '/images/face-shape-women-diamond.webp'
    },
    {
      id: 'oblong-women',
      title: 'Oblong Face Shape: Softening Angles for a Feminine Look',
      description: 'Oblong faces are known for their strong jawlines and wide foreheads, which give the face a bold, confident look. The goal is to soften these angles and add balance. I find that soft curls or waves really do wonders for oblong faces, creating a feminine touch while still allowing you to showcase the strength of your jawline. A textured lob or a shaggy bob also works well to soften the features and give your face a more rounded appearance.',
      image: '/images/face-shape-women-oblong.webp'
    }
  ];

  // 男性脸型数据
  const menFaceShapes = [
    {
      id: 'oval-men',
      title: 'Oval Face Shape',
      description: 'Oval faces are often considered the ideal face shape because they are well-balanced. The length is greater than the width, with a slightly narrower jawline than the forehead. This face shape gives you the freedom to experiment with almost any hairstyle. Personally, I believe that a clean, short fade or a textured crop works exceptionally well with men\'s oval faces.',
      image: '/images/face-shape-men-oval.webp'
    },
    {
      id: 'round-men',
      title: 'Round Face Shape for Men',
      description: 'Round faces are characterized by soft, rounded edges with wide cheeks and a round jawline. The goal with this face shape is to add some angles and create the illusion of length. For a round face, I recommend a high fade with short sides and a bit of volume on top. This adds height and sharpness, helping to elongate the face and make it look more defined.',
      image: '/images/face-shape-men-rounde.webp'
    },
    {
      id: 'square-men',
      title: 'Square Face Shape',
      description: 'Men\'s square faces are defined by a strong jawline, wide cheekbones, and a broad forehead, giving a very strong and masculine appearance. To soften the sharp angles of the jaw, a hairstyle with some texture and volume works best. I personally love a mid fade or a buzz cut with some length on top. It highlights the jawline without emphasizing its sharpness.',
      image: '/images/face-shape-men-square.webp'
    },
    {
      id: 'heart-men',
      title: 'Heart Face Shape for Men',
      description: 'The heart-shaped face has a wide forehead with high cheekbones, narrowing down to a pointed chin. This shape gives a youthful and dynamic look, but the key is to balance out the upper and lower parts of the face. I recommend a hairstyle with some volume on the sides to widen the lower part of the face, like a textured quiff or a pompadour.',
      image: '/images/face-shape-men-heart.webp'
    },
    {
      id: 'diamond-men',
      title: 'Diamond Face Shape',
      description: 'Men\'s diamond faces feature a narrow forehead and chin, with the widest part at the cheekbones. The goal is to soften the sharpness of the cheekbones while balancing the forehead and jaw. I find that a longer hairstyle with some texture works best for this face shape. A side-swept fringe or a tousled, medium-length hairstyle adds softness to the sharp cheekbones.',
      image: '/images/face-shape-men-diamond.webp'
    },
    {
      id: 'oblong-men',
      title: 'Oblong / Rectangle Face Shape',
      description: 'Men\'s oblong faces are longer than they are wide, with a straight jawline and a high forehead. The aim is to reduce the length and add width to the face. I recommend hairstyles with volume on the sides, like a classic pompadour or a voluminous quiff. These styles add width, making the face appear more balanced and proportional. Avoid styles that add height to the top, as this will only emphasize the length of the face.',
      image: '/images/face-shape-men-oblong.webp'
    }
  ];

  const currentData = activeTab === 'women' ? womenFaceShapes : menFaceShapes;

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题 */}
        <div className="text-center mb-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-12">
            Unlock the Best Hairstyles for Face Shape with AI Analysis
          </h2>
        </div>

        {/* Tab 切换 */}
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-full p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('women')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'women'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ♀️ Women
            </button>
            <button
              onClick={() => setActiveTab('men')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'men'
                  ? 'bg-purple-700 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ♂️ Men
            </button>
          </div>
        </div>

        {/* 脸型网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentData.map((faceShape) => (
            <div
              key={faceShape.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
            >
              {/* 图片区域 */}
              <div className="h-70 flex items-center justify-center">
      
                <img
                  src={faceShape.image}
                  alt={faceShape.title}
                  className="w-full h-full object-cover"
                />
            
              </div>

              {/* 内容区域 */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  <span className="line-clamp-2">{faceShape.title}</span>
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  <span className="line-clamp-7">{faceShape.description}</span>
                </p>
                
             
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Ready to find your perfect hairstyle? Upload your photo above to get started!
          </p>
        </div>
      </div>
    </section>
  );
};

export default FaceShapeGuide; 