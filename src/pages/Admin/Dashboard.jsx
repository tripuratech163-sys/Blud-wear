import { useState, useEffect } from 'react';
import { adminFetchDashboardStats } from '../../backend/admin';

const Dashboard = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await adminFetchDashboardStats();

        setStats({
          products: data.productsCount,
          orders: data.ordersCount,
          revenue: data.revenue
        });
      } catch (err) {
        console.error("Error loading dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        <div className="admin-card">
          <h3 style={{ color: '#888', marginBottom: '0.5rem', fontSize: '1rem', textTransform: 'uppercase' }}>Total Products</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{stats.products}</p>
        </div>
        <div className="admin-card">
          <h3 style={{ color: '#888', marginBottom: '0.5rem', fontSize: '1rem', textTransform: 'uppercase' }}>Total Orders</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{stats.orders}</p>
        </div>
        <div className="admin-card">
          <h3 style={{ color: '#888', marginBottom: '0.5rem', fontSize: '1rem', textTransform: 'uppercase' }}>Total Revenue</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>${stats.revenue.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
