type SparklineChartProps = {
  values: number[];
  width: number;
  height: number;
  color: string;
};

export function SparklineChart({
  values,
  width,
  height,
  color,
}: SparklineChartProps) {
  if (values.length === 0) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  // Avoid division by zero when all values are equal
  const range = max - min || 1;
  const count = values.length;

  const points = values
    .map((v, i) => {
      const x = count === 1 ? width / 2 : (i / (count - 1)) * width;
      // Invert Y axis: higher value = lower pixel position
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        style={{ stroke: color }}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
