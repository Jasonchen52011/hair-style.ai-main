interface FaceShapesSectionProps {
  isRightSection: {
    title: string
    tableData: Array<{
      feature: string
      description: string
    }>
    textContent: string[]
  }
}

export default function FaceShapesSection({ isRightSection }: FaceShapesSectionProps) {
  return (
    <section className="py-10 sm:py-20 bg-white">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
        <h2 className="text-2xl sm:text-4xl font-bold mb-12 text-center text-gray-800">
          {isRightSection.title}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* 左侧表格 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 grid grid-cols-2 gap-4">
              <div className="font-semibold text-gray-800">Feature</div>
              <div className="font-semibold text-gray-800">Description</div>
            </div>
            
            {isRightSection.tableData.map((row, index) => (
              <div key={index} className={`px-6 py-4 ${index !== isRightSection.tableData.length - 1 ? 'border-b border-gray-100' : ''} grid grid-cols-2 gap-4`}>
                <div className="text-sm sm:text-lg font-medium text-gray-800">{row.feature}</div>
                <div className="text-gray-800 text-sm sm:text-lg">
                  {row.feature === "Popularity in 2025" ? (
                    <div className="flex items-center">
                      <span className="text-yellow-400">★★★★★</span>
                      <span className="ml-2">{row.description}</span>
                    </div>
                  ) : (
                    row.description
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* 右侧文本 */}
          <div className="space-y-4 text-gray-800 text-sm sm:text-lg leading-relaxed">
            {isRightSection.textContent.map((paragraph, index) => (
              <p key={index}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
} 