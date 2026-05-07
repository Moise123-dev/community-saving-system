export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
