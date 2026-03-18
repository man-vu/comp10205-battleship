export default function Histogram({ gameHistory }) {
  if (gameHistory.length < 2) return null;

  // Build histogram buckets
  const min = Math.min(...gameHistory);
  const max = Math.max(...gameHistory);
  const bucketSize = Math.max(1, Math.ceil((max - min + 1) / 20));
  const buckets = {};

  for (const shots of gameHistory) {
    const bucket = Math.floor((shots - min) / bucketSize) * bucketSize + min;
    buckets[bucket] = (buckets[bucket] || 0) + 1;
  }

  const entries = Object.entries(buckets)
    .map(([k, v]) => [Number(k), v])
    .sort((a, b) => a[0] - b[0]);

  const maxCount = Math.max(...entries.map(e => e[1]));

  return (
    <div className="histogram">
      <h4>Shot Distribution</h4>
      <div className="histogram-chart">
        {entries.map(([bucket, count]) => (
          <div key={bucket} className="histogram-bar-container">
            <div
              className="histogram-bar"
              style={{ height: `${(count / maxCount) * 100}%` }}
              title={`${bucket}-${bucket + bucketSize - 1}: ${count} games`}
            />
            <span className="histogram-label">{bucket}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
