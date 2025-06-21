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
                  <h3 className="text-gray-800 mt-2 text-lg sm:text-xl font-bold">{tool.description}</h3>
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
    "AI Braids Filter": {
      title: "AI Braids Filter",
      description: "Try Braids Instantly, Avoid Styling Regrets",
      link: "/ai-braids",  
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
      link: "/dreadlocks",
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
    "Hairstyle Simulator for Male": {
      title: "Hairstyle Simulator for Male",
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
    "Low Fade Haircut Filter": {
      title: "Low Fade Haircut Filter",
      description: "Try Low Fade Styles Risk-Free",
      link: "/low-fade-haircut",
      image: "/images/low-fade-hero3.webp"
    },
    "Pompadour Filter": {
      title: "Pompadour Filter",
      description: "Try Classic Pompadour Styles Risk-Free",
      link: "/pompadour",
      image: "/images/pompadour-hero-2man.webp"
    },
    "Man Bun Filter": {
      title: "Man Bun Filter",
      description: "Try Man Bun Hairstyles Online Free",
      link: "/man-bun",
      image: "/images/man-bun-hero2.webp"
    },
    "Undercut Filter": {
      title: "Undercut Filter",
      description: "Preview Undercut Styles Risk-Free",
      link: "/undercut",
      image: "/images/undercut-hero.webp"
    },
    "Textured Fringe Filter": {
      title: "Textured Fringe Filter",
      description: "Try Textured Fringe Styles Risk-Free",
      link: "/textured-fringe",
      image: "/images/textured-fringe-hero2.webp"
    }
  };

  // 根据传入的工具名称显示对应的工具（最多3个）
  const toolsToDisplay: AiTool[] = toolNames.map(name => allToolsData[name]).filter(Boolean);

  return (
    <section className="max-w-7xl mx-auto mt-12 mb-6 px-4">
      <div className=" rounded-xl p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 ">More Free AI Tools from Hairstyle AI</h2>
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
                <h3 className="text-gray-800 mt-2 text-lg sm:text-xl font-bold">{tool.description}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
} 