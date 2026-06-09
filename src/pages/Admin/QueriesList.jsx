import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const QueriesList = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQueries(data || []);
    } catch (err) {
      console.error("Failed to load queries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (queryId) => {
    if (!window.confirm("Are you sure you want to delete this customer query?")) return;
    try {
      const { error } = await supabase
        .from('contact_queries')
        .delete()
        .eq('id', queryId);

      if (error) throw error;
      setQueries(queries.filter(q => q.id !== queryId));
    } catch (err) {
      console.error("Failed to delete query:", err);
      alert("Failed to delete customer query.");
    }
  };

  if (loading) return <div>Loading customer queries...</div>;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '2rem' }}>Customer Queries (Contact Us)</h2>

      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer Name</th>
              <th>Email Address</th>
              <th>Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queries.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No customer queries found.</td>
              </tr>
            ) : (
              queries.map(q => (
                <tr key={q.id}>
                  <td style={{ fontSize: '0.85rem', color: '#aaa', whiteSpace: 'nowrap' }}>
                    {new Date(q.created_at).toLocaleDateString()} {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontWeight: '600' }}>{q.name}</td>
                  <td>
                    <a href={`mailto:${q.email}`} style={{ color: '#007aff', textDecoration: 'none' }}>
                      {q.email}
                    </a>
                  </td>
                  <td style={{ fontSize: '0.9rem', color: '#ccc', maxWidth: '400px', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {q.message}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(q.id)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        backgroundColor: '#ff3b30',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QueriesList;
