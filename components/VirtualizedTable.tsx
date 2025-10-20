import React, { memo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTableProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  height?: number;
  itemHeight?: number;
  className?: string;
}

interface TableRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    renderItem: (item: any, index: number) => React.ReactNode;
  };
}

const TableRow = memo<TableRowProps>(({ index, style, data }) => {
  const { items, renderItem } = data;
  const item = items[index];

  if (!item) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="border-b border-gray-200">
      {renderItem(item, index)}
    </div>
  );
});

TableRow.displayName = 'TableRow';

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  items,
  renderItem,
  height = 400,
  itemHeight = 60,
  className = ''
}) => {
  const itemData = { items, renderItem };

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-gray-500 ${className}`}>
        <p>No items found</p>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <List
        height={height}
        width="100%"
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={3}
      >
        {TableRow}
      </List>
    </div>
  );
};

export default VirtualizedTable;
