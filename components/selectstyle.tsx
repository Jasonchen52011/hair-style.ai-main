interface SelectStyleProps {
    uploadedImageUrl?: string;
    onStyleSelect: (style: string) => void;
    renderCategoryTitle?: (title: string) => React.ReactNode;
}

export default function SelectStyle({ uploadedImageUrl, onStyleSelect, renderCategoryTitle }: SelectStyleProps) {
    return (
        <div>
            {/* Female Styles */}
            {renderCategoryTitle ? (
                renderCategoryTitle('Female Hairstyle')
            ) : (
                <div className="text-lg font-medium text-gray-700 mb-3">Female Hairstyle</div>
            )}
            {/* ... female styles ... */}

            {/* Male Styles */}
            {renderCategoryTitle ? (
                renderCategoryTitle('Male Hairstyle')
            ) : (
                <div className="text-lg font-medium text-gray-700 mb-3">Male Hairstyle</div>
            )}
            {/* ... male styles ... */}
        </div>
    );
}