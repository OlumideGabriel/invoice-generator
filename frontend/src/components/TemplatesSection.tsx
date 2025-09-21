import React, { useState } from 'react';
import { FileText, Check, Palette, Layout, Minimize2 } from 'lucide-react';

const TemplatesSection = ({ showNotification }) => {
  const [activeTemplate, setActiveTemplate] = useState('modern');

  const templates = [
    {
      id: 'modern',
      title: 'Modern Template',
      description: 'Clean and professional design with contemporary styling',
      icon: Layout,
      color: 'teal',
      preview: 'Modern layout with clean lines and professional typography'
    },
    {
      id: 'classic',
      title: 'Classic Template',
      description: 'Traditional business style with timeless appeal',
      icon: FileText,
      color: 'blue',
      preview: 'Traditional format with formal business presentation'
    },
    {
      id: 'minimal',
      title: 'Minimal Template',
      description: 'Simple and elegant with focus on content',
      icon: Minimize2,
      color: 'gray',
      preview: 'Stripped-down design emphasizing clarity and simplicity'
    },
    {
      id: 'creative',
      title: 'Creative Template',
      description: 'Unique design for creative professionals',
      icon: Palette,
      color: 'purple',
      preview: 'Artistic layout with creative elements and modern flair'
    }
  ];

  const TemplateCard = ({ template, isActive, onSelect }) => {
    const IconComponent = template.icon;

    return (
      <div
        className={`bg-white border border-gray-300 rounded-lg p-6 transition-all duration-200 cursor-pointer hover:shadow-sm ${
          isActive ? 'ring-2 ring-teal-500 border-teal-300' : 'hover:border-gray-400'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${
            isActive
              ? 'bg-teal-100'
              : 'bg-gray-100'
          }`}>
            <IconComponent className={`h-6 w-6 ${
              isActive
                ? 'text-teal-600'
                : 'text-gray-600'
            }`} />
          </div>
          {isActive && (
            <div className="flex items-center justify-center w-6 h-6 bg-teal-600 rounded-full">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-900 mb-2">{template.title}</h4>
          <p className="text-sm text-gray-500 mb-3">{template.description}</p>
          <p className="text-xs text-gray-400 hidden italic">{template.preview}</p>
        </div>

        <div className="flex items-center justify-between">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-teal-600 text-white cursor-default'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={isActive}
          >
            {isActive ? 'Current Template' : 'Select Template'}
          </button>
          <button className="text-teal-600 text-sm font-medium hover:text-teal-700 transition-colors">
            Preview
          </button>
        </div>
      </div>
    );
  };

  const handleTemplateSelect = (templateId, templateTitle) => {
    if (templateId === activeTemplate) return;

    setActiveTemplate(templateId);
    if (showNotification) {
      showNotification(`${templateTitle} selected successfully`, 'success');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Main Templates Section */}
      <div className="bg-white rounded-xl p-8 border border-gray-300">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Invoice Templates</h2>
            <p className="text-gray-500 text-sm mt-1">Choose your preferred invoice template design to match your brand</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              {templates.find(t => t.id === activeTemplate)?.title} active
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isActive={activeTemplate === template.id}
              onSelect={() => handleTemplateSelect(template.id, template.title)}
            />
          ))}
        </div>
      </div>

      {/* Template Customization Section */}
      <div className="bg-white rounded-xl p-8 border border-gray-300">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Template Customization</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Colors & Branding</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex space-x-2">
                  {['#0d9488', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Upload
                </label>
                <button className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors w-full">
                  Click to upload company logo
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Layout Options</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Show Company Logo</h4>
                  <p className="text-sm text-gray-500">Display your logo on invoices</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" defaultChecked />
                  <div className="w-12 h-6 bg-teal-500 rounded-full relative cursor-pointer">
                    <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full transition-transform"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Include Footer Text</h4>
                  <p className="text-sm text-gray-500">Add custom footer message</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" />
                  <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Show Payment Terms</h4>
                  <p className="text-sm text-gray-500">Display payment terms and conditions</p>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" defaultChecked />
                  <div className="w-12 h-6 bg-teal-500 rounded-full relative cursor-pointer">
                    <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full transition-transform"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-300">
          <button className="px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-medium">
            Reset to Default
          </button>
          <button className="px-6 py-3 bg-teal-600 text-white rounded-md hover:bg-teal-500 transition-colors font-medium">
            Save Template Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplatesSection;