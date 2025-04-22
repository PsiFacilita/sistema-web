import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DocumentType {
  id: string;
  name: string;
  route: string;
}

interface DocumentCategory {
  name: string;
  documents: DocumentType[];
}

interface DocumentCategoryDropdownProps {
  categories: DocumentCategory[];
  className?: string;
}

const DocumentCategoryDropdown: React.FC<DocumentCategoryDropdownProps> = ({
  categories,
  className = '',
}) => {
  const navigate = useNavigate();
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const toggleCategory = (categoryName: string) => {
    setOpenCategory(openCategory === categoryName ? null : categoryName);
  };

  const handleSelectDocument = (route: string) => {
    navigate(route);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {categories.map((category) => (
        <div key={category.name} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCategory(category.name)}
            className="w-full bg-green-700 text-white py-3 px-4 flex justify-between items-center hover:bg-green-800 transition-colors"
          >
            <span className="font-medium">{category.name}</span>
            <svg
              className={`w-5 h-5 transform ${openCategory === category.name ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {openCategory === category.name && (
            <ul className="bg-white">
              {category.documents.map((doc) => (
                <li key={doc.id} className="border-t border-gray-200">
                  <button
                    onClick={() => handleSelectDocument(doc.route)}
                    className="w-full text-left py-2 px-4 hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{doc.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default DocumentCategoryDropdown;