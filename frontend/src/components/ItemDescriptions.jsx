// components/ItemDescriptions.jsx
import React from 'react';

const ItemDescriptions = ({ items, handleChange }) => {
  return (
    <>
      {items.map((item, index) =>
        item.showDesc ? (
          <div key={`desc-${index}`} className="mb-4">
            <textarea
              placeholder="Item description"
              value={item.description}
              onChange={(e) => handleChange(index, 'description', e.target.value)}
              rows="2"
              className="w-full p-3 rounded-md bg-neutral-700 border border-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ) : null
      )}
    </>
  );
};

export default ItemDescriptions;
