import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import './VideoGallery.css';

const VideoGallery = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null); // URL of the currently playing video

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('review_videos')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setVideos(data || []);
      } catch (err) {
        console.error("Failed to load review videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <section className="video-gallery">
        <div className="container" style={{ textAlign: 'center', color: '#888' }}>
          Loading review gallery...
        </div>
      </section>
    );
  }

  if (videos.length === 0) return null;

  return (
    <section className="video-gallery">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Community Reviews</h2>
          <p className="section-subtitle">Real athletes. Real reviews. See BludWear in action.</p>
        </div>

        <div className="video-grid">
          {videos.map((vid) => (
            <div 
              key={vid.id} 
              className="video-card"
              onClick={() => setActiveVideo(vid.video_url)}
            >
              <div className="video-thumbnail-wrapper">
                <video 
                  src={vid.video_url} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="video-thumbnail"
                  style={{ pointerEvents: 'none' }}
                />
                <div className="play-overlay">
                  <div className="play-btn-circle">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </div>
              <h3 className="video-card-title">{vid.title}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Video Player Modal */}
      {activeVideo && (
        <div className="video-lightbox-overlay" onClick={() => setActiveVideo(null)}>
          <div className="video-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setActiveVideo(null)}>&times;</button>
            <video 
              src={activeVideo} 
              controls 
              autoPlay 
              className="lightbox-video-player"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default VideoGallery;
