import React from 'react';

interface TemplateCardProps {
  name: string;
  description: string;
  icon?: string; // Assuming icon is an emoji or a URL
  // Add any other props you expect for a template card
}

const TemplateCard: React.FC<TemplateCardProps> = ({ name, description, icon }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 m-2 flex flex-col items-center text-center cursor-pointer hover:shadow-lg transition-shadow duration-200">
      {icon && <div className="text-4xl mb-2">{icon}</div>}
      <h3 className="text-lg font-semibold mb-1">{name}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

export default TemplateCard;

