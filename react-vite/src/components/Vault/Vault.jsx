import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { ArrowLeft, X, Folder } from 'lucide-react';
import './Vault.css';

const FriendFolder = ({ id, name, photoCount, thumbnail, onClick }) => {
  return (
    <div 
      className="friend-folder"
      onClick={() => onClick(id, name)}
    >
      {thumbnail ? (
        <div className="folder-thumbnail">
          <img 
            src={thumbnail} 
            alt={name} 
            className="thumbnail-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/100?text=" + name.charAt(0);
            }}
          />
        </div>
      ) : (
        <div className="folder-icon">
          <Folder size={24} className="folder-icon-svg" />
        </div>
      )}
      <span className="folder-name">{name}</span>
      <span className="photo-count">{photoCount} photos</span>
    </div>
  );
};

const Vault = () => {
  const [faces, setFaces] = useState([]);
  const [selectedFaceId, setSelectedFaceId] = useState(null);
  const [selectedFaceName, setSelectedFaceName] = useState('');
  const [vaultContent, setVaultContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sessionUser = useSelector(state => state.session.user);

  // Fetch faces list
  useEffect(() => {
    const fetchFaces = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vault/faces', {
          headers: {
            'Authorization': `Bearer ${sessionUser?.accessToken || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setFaces(data);
          setError(null);
        } else {
          throw new Error('Failed to fetch faces');
        }
      } catch (err) {
        console.error('Error fetching faces:', err);
        setError('Failed to load faces. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFaces();
  }, [sessionUser]);

  // Fetch vault content when a face is selected
  useEffect(() => {
    if (!selectedFaceId) return;
    
    const fetchVaultContent = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/vault/content', {
          headers: {
            'Authorization': `Bearer ${sessionUser?.accessToken || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Filter content by selected face ID
          const faceContent = data.filter(item => item.face_id === selectedFaceId);
          setVaultContent(faceContent);
          setError(null);
        } else {
          throw new Error('Failed to fetch vault content');
        }
      } catch (err) {
        console.error('Error fetching vault content:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVaultContent();
  }, [selectedFaceId, sessionUser]);

  const openFolder = (faceId, faceName) => {
    setSelectedFaceId(faceId);
    setSelectedFaceName(faceName);
    setVaultContent([]);
  };

  const closeFolder = () => {
    setSelectedFaceId(null);
    setSelectedFaceName('');
    setVaultContent([]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getContentPreview = (content) => {
    if (content.file_path) {
      return content.file_path;
    } else if (content.text_content) {
      return content.text_content.substring(0, 50) + '...';
    } else if (content.content_type === 'image') {
      return 'Image content';
    } else {
      return 'Unknown content type';
    }
  };

  return (
    <div className="vault-container">
      {/* Vault header */}
      <div className="vault-header">
        {selectedFaceId ? (
          <>
            <button onClick={closeFolder} className="back-button">
              <ArrowLeft size={24} />
            </button>
            <h1 className="vault-title">
              {selectedFaceName}'s Vault
            </h1>
            <div className="header-spacer"></div>
          </>
        ) : (
          <>
            <h1 className="vault-title">Face Vault</h1>
            <div></div>
          </>
        )}
      </div>

      {/* Vault content */}
      <div className="vault-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
          </div>
        ) : !selectedFaceId ? (
          faces.length > 0 ? (
            <div className="folders-grid">
              {faces.map((face) => (
                <FriendFolder
                  key={face.id}
                  id={face.id}
                  name={face.name || `Face ${face.id}`}
                  photoCount={face.content_count || 0}
                  thumbnail={face.sample_image}
                  onClick={openFolder}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Folder size={48} className="empty-icon" />
              <p>No faces registered yet</p>
              <p className="empty-subtext">Use the Camera to add faces to your vault</p>
            </div>
          )
        ) : vaultContent.length > 0 ? (
          <div className="content-grid">
            {vaultContent.map((content) => (
              <div
                key={content.id}
                className="content-item"
                onClick={() => setSelectedContent(content)}
              >
                <div className="content-preview">
                  {content.content_type === 'image' && content.file_path ? (
                    <img
                      src={content.file_path}
                      alt={`Content ${content.id}`}
                      className="content-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300?text=Image";
                      }}
                    />
                  ) : (
                    <div className="text-content-preview">
                      <p>{getContentPreview(content)}</p>
                    </div>
                  )}
                </div>
                <div className="content-info">
                  <span className="content-type">{content.content_type}</span>
                  <span className="content-date">{formatDate(content.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Folder size={48} className="empty-icon" />
            <p>No content yet</p>
            <p className="empty-subtext">Add content for {selectedFaceName} using the Camera</p>
          </div>
        )}
      </div>

      {/* Content viewer modal */}
      {selectedContent && (
        <div className="content-modal">
          <div className="modal-header">
            <button onClick={() => setSelectedContent(null)} className="close-button">
              <X size={24} />
            </button>
            <div className="modal-date">{formatDate(selectedContent.created_at)}</div>
            <div></div>
          </div>
          <div className="modal-content">
            {selectedContent.content_type === 'image' && selectedContent.file_path ? (
              <img
                src={selectedContent.file_path}
                alt="Selected content"
                className="modal-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/800?text=Error+Loading+Image";
                }}
              />
            ) : selectedContent.text_content ? (
              <div className="text-content-modal">
                <p>{selectedContent.text_content}</p>
              </div>
            ) : (
              <div className="unknown-content">
                <p>Unable to display this content type</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Vault;