import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const VideosList = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [newVideo, setNewVideo] = useState({
    title: '',
    video_url: '',
    thumbnail_url: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('review_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (err) {
      console.error("Failed to load review videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!newVideo.title || !newVideo.video_url) {
      setFormError('Please fill in title and video URL.');
      setFormLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('review_videos')
        .insert([newVideo])
        .select()
        .single();

      if (error) throw error;

      setVideos([data, ...videos]);
      setNewVideo({ title: '', video_url: '', thumbnail_url: '' });
    } catch (err) {
      console.error("Failed to add video:", err);
      setFormError(err.message || 'Failed to add video.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this review video?")) return;
    try {
      const { error } = await supabase
        .from('review_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err) {
      console.error("Failed to delete video:", err);
      alert("Failed to delete video.");
    }
  };

  if (loading) return <div>Loading review videos...</div>;

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: '2rem' }}>Manage Review Videos</h2>

      {/* Add New Video Form */}
      <div className="admin-card" style={{ marginBottom: '2.5rem', maxWidth: '600px' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Add Review Video</h3>
        {formError && <div style={{ color: '#ff3b30', fontSize: '0.85rem', marginBottom: '1rem' }}>{formError}</div>}
        <form onSubmit={handleAddVideo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Video Title *</label>
            <input 
              type="text" 
              value={newVideo.title}
              onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
              placeholder="e.g. Core Hoodie Performance Review"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Video URL (MP4 Link) *</label>
            <input 
              type="text" 
              value={newVideo.video_url}
              onChange={(e) => setNewVideo({ ...newVideo, video_url: e.target.value })}
              placeholder="e.g. https://domain.com/video.mp4"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.25rem' }}>Cover Thumbnail Image URL (Optional)</label>
            <input 
              type="text" 
              value={newVideo.thumbnail_url}
              onChange={(e) => setNewVideo({ ...newVideo, thumbnail_url: e.target.value })}
              placeholder="e.g. https://domain.com/thumbnail.jpg"
              style={inputStyle}
            />
          </div>
          <button 
            type="submit" 
            disabled={formLoading}
            style={{
              padding: '0.75rem',
              backgroundColor: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: formLoading ? 'not-allowed' : 'pointer',
              opacity: formLoading ? 0.5 : 1,
              marginTop: '0.5rem'
            }}
          >
            {formLoading ? 'Adding Video...' : 'Add Video to Gallery'}
          </button>
        </form>
      </div>

      {/* Videos List Grid */}
      <div className="admin-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Video Title</th>
              <th>URLs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videos.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No review videos found.</td>
              </tr>
            ) : (
              videos.map(v => (
                <tr key={v.id}>
                  <td>
                    <img 
                      src={v.thumbnail_url || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=150'} 
                      alt={v.title} 
                      style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #333' }}
                    />
                  </td>
                  <td style={{ fontWeight: '600' }}>{v.title}</td>
                  <td style={{ fontSize: '0.8rem', color: '#888' }}>
                    <div style={{ wordBreak: 'break-all', marginBottom: '0.25rem' }}><strong>Video:</strong> {v.video_url}</div>
                    {v.thumbnail_url && <div style={{ wordBreak: 'break-all' }}><strong>Thumb:</strong> {v.thumbnail_url}</div>}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleDelete(v.id)}
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

const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.75rem',
  backgroundColor: '#000',
  border: '1px solid #333',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '0.9rem'
};

export default VideosList;
