import { FixedSizeList } from 'react-window';
import EmptyState from './EmptyState';

export default function VirtualList({
  items = [],
  itemHeight = 80,
  renderItem,
  className = '',
  height = 600,
}) {
  if (!items.length) {
    return (
      <EmptyState
        title="No items"
        description="There are no items to display."
      />
    );
  }

  return (
    <div className={className}>
      <FixedSizeList
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        width="100%"
      >
        {({ index, style }) => (
          <div style={style}>
            {renderItem(items[index], index)}
          </div>
        )}
      </FixedSizeList>
    </div>
  );
}
