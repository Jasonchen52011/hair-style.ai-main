'use client';

import Link from 'next/link';

interface Tool {
  title: string;
  description: string;
  image: string;
  link: string;
}

interface ExploreOtherToolsProps {
  title?: string;
  tools: Tool[];
}

export default function ExploreOtherTools({ 
  title = "Explore Other Tools", 
  tools 
}: ExploreOtherToolsProps) {
  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto mt-12 mb-6 px-4">
      <div className="rounded-xl p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-gray-800">
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {tools.map((tool, index) => (
            <Link 
              key={index} 
              href={tool.link}
              className="rounded-xl transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className="relative h-60 overflow-hidden rounded-xl">
                <img
                  src={tool.image}
                  alt={tool.title}
                  className="w-full h-full object-cover transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
              <div className="p-2">
                <h3 className="text-gray-800 mt-2 text-lg sm:text-xl font-bold">
                  {tool.title}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base mt-1">
                  {tool.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}