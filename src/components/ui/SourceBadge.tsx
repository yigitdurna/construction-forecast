/**
 * Source Badge Component
 *
 * Visual indicator showing the source of a data value:
 * - default: System default value (gray)
 * - manual: User-entered value (blue)
 * - calculated: Computed from other values (green)
 * - sektor: Industry average (yellow)
 */

export type DataSource = 'default' | 'manual' | 'calculated' | 'sektor' | 'tuik' | 'bakanlik';

interface SourceBadgeProps {
  source: DataSource;
  /** Custom label override */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

const SOURCE_CONFIG: Record<DataSource, { text: string; bgColor: string; textColor: string }> = {
  default: {
    text: 'Varsayılan',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
  manual: {
    text: 'Manuel',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  calculated: {
    text: 'Hesaplanan',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
  },
  sektor: {
    text: 'Sektör Ort.',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
  },
  tuik: {
    text: 'TÜİK',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
  bakanlik: {
    text: 'Bakanlık',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
  },
};

export function SourceBadge({ source, label, size = 'sm' }: SourceBadgeProps): JSX.Element {
  const config = SOURCE_CONFIG[source];
  const displayText = label || config.text;

  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded ${config.bgColor} ${config.textColor} ${sizeClasses} font-medium`}
    >
      {displayText}
    </span>
  );
}

export default SourceBadge;
