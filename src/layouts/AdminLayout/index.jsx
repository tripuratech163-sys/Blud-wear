import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Home%20Page/1.jpeg" 
            alt="BludWear" 
            style={{ height: '32px', width: '32px', borderRadius: '4px', objectFit: 'cover' }}
          />
          <h2>BludWear</h2>
        </div>
        <nav className="admin-nav">
          <Link 
            to="/admin" 
            className={`admin-nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/admin/products" 
            className={`admin-nav-link ${location.pathname.startsWith('/admin/products') ? 'active' : ''}`}
          >
            Products
          </Link>
          <Link 
            to="/admin/orders" 
            className={`admin-nav-link ${location.pathname.startsWith('/admin/orders') ? 'active' : ''}`}
          >
            Orders
          </Link>
          <Link 
            to="/admin/queries" 
            className={`admin-nav-link ${location.pathname.startsWith('/admin/queries') ? 'active' : ''}`}
          >
            Customer Queries
          </Link>
          <Link 
            to="/admin/videos" 
            className={`admin-nav-link ${location.pathname.startsWith('/admin/videos') ? 'active' : ''}`}
          >
            Review Videos
          </Link>
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={handleSignOut} className="admin-signout-btn">
            Sign Out
          </button>
          <Link to="/" className="admin-back-btn">
            Back to Store
          </Link>
        </div>
      </aside>
      
      <main className="admin-main">
        <header className="admin-header">
          <h1>
            {location.pathname === '/admin' && 'Dashboard'}
            {location.pathname.includes('/products') && 'Products Management'}
            {location.pathname.includes('/orders') && 'Orders Management'}
            {location.pathname.includes('/queries') && 'Customer Queries'}
            {location.pathname.includes('/videos') && 'Review Videos'}
          </h1>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
