import React, { useEffect, useRef } from "react";
import { GridStack, GridStackNode } from "gridstack";
import "gridstack/dist/gridstack.min.css";
import InvoiceLine, { InvoiceItem } from "./InvoiceLine";

interface InvoiceGridProps {
  items: InvoiceItem[];
  onChangeItem: (index: number, field: string, value: string | number) => void;
  onRemoveItem: (index: number) => void;
  onToggleDescription: (index: number) => void;
}

const InvoiceGrid: React.FC<InvoiceGridProps> = ({
  items,
  onChangeItem,
  onRemoveItem,
  onToggleDescription,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstance = useRef<GridStack | null>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    // init only once
    if (!gridInstance.current) {
      gridInstance.current = GridStack.init(
        {
          column: 12,
          float: true,
          cellHeight: 120,
        },
        gridRef.current
      );

      // optional: listen for changes (drag/resize)
      gridInstance.current.on("change", (event: Event, nodes: GridStackNode[]) => {
        console.log("layout changed", nodes);
        // you could save nodes to state/localStorage here
      });
    }

    return () => {
      gridInstance.current?.destroy(false);
      gridInstance.current = null;
    };
  }, []);

  return (
    <div ref={gridRef} className="grid-stack">
      {items.map((item, i) => (
        <div
          key={item.id}
          className="grid-stack-item"
          gs-x={0}
          gs-y={i}
          gs-w={12}
          gs-h={1}
        >
          <div className="grid-stack-item-content">
            <InvoiceLine
              item={item}
              index={i}
              onChange={onChangeItem}
              onRemove={onRemoveItem}
              onToggleDescription={onToggleDescription}
              itemsLength={items.length}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default InvoiceGrid;
