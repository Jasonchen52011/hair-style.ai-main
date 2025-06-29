'use client';

import Image from 'next/image';
import Link from 'next/link';

// 工具类型定义
interface AiTool {
  title: string;
  description: string;
  image: string;
  link: string;
}

// 组件参数类型定义
interface MoreFreeAIToolsProps {
  moreToolsSection?: {
    title: string;
    tools: AiTool[];
  };
  toolNames?: string[]; // 保持向后兼容性
}

export default function MoreFreeAITools({ moreToolsSection, toolNames }: MoreFreeAIToolsProps) {
  // 优先使用配置文件数据，如果没有则使用原来的方式
  if (moreToolsSection) {
    return (
      <section className="max-w-7xl mx-auto mt-12 mb-6 px-4">
        <div className=" rounded-xl p-6 md:p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 ">{moreToolsSection.title}</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {moreToolsSection.tools.map((tool, index) => (
              <Link 
                key={index} 
                href={tool.link}
                className="rounded-xl  transition-all duration-300 "
              >
                <div className="relative h-60 overflow-hidden rounded-xl">
                  <Image
                    src={tool.image}
                    alt={tool.title}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-2">
                  <h3 className="text-gray-800 mt-2 text-lg sm:text-xl font-bold">{tool.title}</h3>
                  <p className="text-gray-600 text-sm sm:text-base mt-1">{tool.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // 如果没有配置数据但有toolNames，使用原来的方式（向后兼容）
  if (!toolNames) {
    return null;
  }

  // 在组件内部维护所有工具的完整数据
  const allToolsData: Record<string, AiTool> = {
    "AI Hairstyle Changer": {
      title: "AI Hairstyle Changer",
      description: "Try 60+ Hairstyles with Free AI Generator",
      link: "/",
      image: "/images/hero/ba3.jpg"
    },
        "AI Braids Filter": {
      title: "AI Braids Filter",
      description: "Try Braids Instantly, Avoid Styling Regrets",
      link: "/ai-braids-filter",
      image: "/images/fishtail-braid-after-h1.webp"
    },
    "Bob Haircut Filter": {
      title: "Bob Haircut Filter",
      description: "Preview Bob Cuts Before Salon Visit",
      link: "/bob-haircut-filter",
      image: "/images/bob-cut-after.webp"
    },
    "Pixie Cut Filter": {
      title: "Pixie Cut Filter",
      description: "See Short Pixie Looks, Boost Confidence",
      link: "/pixie-cut-filter",
      image: "/images/pixie-cut-h1-after.webp"
    },
    "Dreadlocks Filter": {
      title: "Dreadlocks Filter",
      description: "Try Dreadlock Styles Risk-Free",
      link: "/dreadlocks-filter",
      image: "/images/dreadlock-hairs.webp"
    },
    "Short Hair Filter": {
      title: "Short Hair Filter",
      description: "Preview Short Cuts, Make Confident Choices",
      link: "/short-hair-filter",
      image: "/images/short-hair-filter-h1.webp"
    },
    "Long Hair Filter": {
      title: "Long Hair Filter",
      description: "Test Long Styles Instantly",
      link: "/long-hair-filter",
      image: "/images/long-hair-filter-hero.webp"
    },
    "Bangs Filter": {
      title: "Bangs Filter",
      description: "Find Perfect Bangs For Face Shape",
      link: "/bangs-filter",
      image: "/images/h1-bangs-a.jpg"
    },
    "Buzz Cut Filter": {
      title: "Buzz Cut Filter",
      description: "Preview Buzz Cuts Before Big Chop",
      link: "/buzz-cut-filter",
      image: "/images/buzz-cut-hero.webp"
    },
    "Hairstyle for Men": {
      title: "Hairstyle for Men",
      description: "Discover Perfect Men's Haircuts",
      link: "/hairstyles-for-men",
      image: "/images/man-hair-hero.webp"
    },
    "Hairstyle Simulator for Female": {
      title: "Hairstyle for Female",
      description: "Discover Perfect Women's Hairstyles",
      link: "/hairstyles-for-women",
      image: "/images/hairstyle-for-women-hero.webp"
    },
    "Hairstyles for Girls": {
      title: "Hairstyles for Girls",
      description: "Discover Trendy Hairstyles for Girls",
      link: "/hairstyles-for-girls",
      image: "/images/hairstyle-for-girls-hero5.webp"
    },
    "Low Fade Haircut Filter": {
      title: "Low Fade Haircut Filter",
      description: "Try Low Fade Styles Risk-Free",
      link: "/low-fade-haircut-filter",
      image: "/images/low-fade-hero3.webp"
    },
    "Pompadour Filter": {
      title: "Pompadour Filter",
      description: "Try Classic Pompadour Styles Risk-Free",
      link: "/pompadour-filter",
      image: "/images/pompadour-hero-2man.webp"
    },
    "Man Bun Filter": {
      title: "Man Bun Filter",
      description: "Try Man Bun Hairstyles Online Free",
      link: "/man-bun-filter",
      image: "/images/man-bun-hero2.webp"
    },
    "Perm Filter": {
      title: "Perm Filter",
      description: "Try Perm Hairstyles Risk-Free",
      link: "/perm-filter",
      image: "/images/perm-filter-hero.webp"
    },
    "Undercut Filter": {
      title: "Undercut Filter",
      description: "Preview Undercut Styles Risk-Free",
      link: "/undercut-filter",
      image: "/images/undercut-hero1.webp"
    },
    "Textured Fringe Filter": {
      title: "Textured Fringe Filter",
      description: "Try Textured Fringe Styles Risk-Free",
      link: "/textured-fringe-filter",
      image: "/images/textured-fringe-hero2.webp"
    },
    "Face Shape Detector": {
      title: "Face Shape Detector",
      description: "AI Face Shape Detector - Find Your Perfect Hairstyle",
      link: "/face-shape-detector",
      image: "/images/face-shape-hero.webp"
    },
    "Blonde Hair Filter": {
      title: "Blonde Hair Filter",
      description: "Try Blonde Hair Colors Risk-Free",
      link: "/ai-hairstyle?style=Blonde",
      image: "/images/blonde-filter-hero.webp"
    },
    "Black Hair Filter": {
      title: "Black Hair Filter",
      description: "Try Black Hair Colors Risk-Free",
      link: "/ai-hairstyle?style=Black",
      image: "/images/black-hair-filter-hero.webp"
    },
    "Red Hair Filter": {
      title: "Red Hair Filter",
      description: "Try Red Hair Colors Risk-Free",
      link: "/ai-hairstyle?style=Red",
      image: "/images/red-hair-filter-hero.webp"
    },
    "White Hair Filter": {
      title: "White Hair Filter",
      description: "Try White Hair Colors Risk-Free",
      link: "/ai-hairstyle?style=White",
      image: "/images/white-hair-hero.webp"
    },
    "Gray Hair Filter": {
      title: "Gray Hair Filter",
      description: "Try Gray Hair Colors Risk-Free",
      link: "/ai-hairstyle?style=Gray",
      image: "/images/gray-hair-hero.webp"
    }
  };

  // 根据传入的工具名称显示对应的工具（最多3个）
  const toolsToDisplay: AiTool[] = toolNames.map(name => allToolsData[name]).filter(Boolean);

  return (
    <section className="max-w-7xl mx-auto mt-12 mb-6 px-4">
      <div className=" rounded-xl p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 ">Try More Virtual Hair Filters</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {toolsToDisplay.map((tool, index) => (
            <Link 
              key={index} 
              href={tool.link}
              className="rounded-xl  transition-all duration-300 "
            >
              <div className="relative h-60 overflow-hidden rounded-xl">
                <Image
                  src={tool.image}
                  alt={tool.title}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="p-2">
                <h3 className="text-gray-800 mt-2 text-lg sm:text-xl font-bold">{tool.title}</h3>
                <p className="text-gray-600 text-sm sm:text-base mt-1">{tool.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 