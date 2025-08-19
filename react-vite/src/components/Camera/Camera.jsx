import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './Camera.css';

const Camera = () => {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' for front, 'environment' for back
  const [capturedImage, setCapturedImage] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sessionUser = useSelector(state => state.session.user);

  // Initialize camera
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageDataUrl);

    return imageDataUrl;
  };

  const detectFaces = async () => {
    if (!videoRef.current) return;

    setIsDetecting(true);
    setDetectionResult(null);

    try {
      const imageDataUrl = captureImage();
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('image', blob);

      // Send to backend for face detection
      const result = await fetch('/api/camera/detect', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${sessionUser?.accessToken || ''}`
        }
      });

      if (result.ok) {
        const data = await result.json();
        setDetectionResult(data);
        
        // Draw face boxes on canvas if faces detected
        if (data.face_count > 0 && canvasRef.current) {
          drawFaceBoxes(data.locations);
        }
      } else {
        throw new Error('Face detection failed');
      }
    } catch (error) {
      console.error('Error detecting faces:', error);
      alert('Error detecting faces. Please try again.');
    } finally {
      setIsDetecting(false);
    }
  };

  const drawFaceBoxes = (faceLocations) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const video = videoRef.current;

    // Clear previous drawings
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw face boxes
    context.strokeStyle = '#00ff00';
    context.lineWidth = 3;
    context.font = '16px Arial';
    context.fillStyle = '#00ff00';

    faceLocations.forEach((location, index) => {
      const [top, right, bottom, left] = location;
      context.strokeRect(left, top, right - left, bottom - top);
      context.fillText(`Face ${index + 1}`, left, top - 10);
    });
  };

  const registerFace = async () => {
    if (!detectionResult || detectionResult.face_count === 0) {
      alert('No faces detected to register');
      return;
    }

    try {
      // Use the first face encoding for registration
      const encoding = detectionResult.encodings[0];
      
      const response = await fetch('/api/camera/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionUser?.accessToken || ''}`
        },
        body: JSON.stringify({
          encoding: encoding,
          sample_image: capturedImage
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Face registered successfully!');
        console.log('Registered face:', result);
      } else {
        throw new Error('Face registration failed');
      }
    } catch (error) {
      console.error('Error registering face:', error);
      alert('Error registering face. Please try again.');
    }
  };

  const recognizeFace = async () => {
    if (!detectionResult || detectionResult.face_count === 0) {
      alert('No faces detected to recognize');
      return;
    }

    try {
      // Use the first face encoding for recognition
      const encoding = detectionResult.encodings[0];
      
      const response = await fetch('/api/camera/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionUser?.accessToken || ''}`
        },
        body: JSON.stringify({ encoding: encoding })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.recognized) {
          alert(`Face recognized! Confidence: ${(1 - result.confidence).toFixed(2)}`);
        } else {
          alert('Face not recognized. Would you like to register it?');
        }
      } else {
        throw new Error('Face recognition failed');
      }
    } catch (error) {
      console.error('Error recognizing face:', error);
      alert('Error recognizing face. Please try again.');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setDetectionResult(null);
  };

  return (
    <div className="camera-container">
      <div className="camera-header">
        <h2>Face Recognition Camera</h2>
        <p>Detect, recognize, and register faces</p>
      </div>

      <div className="camera-content">
        <div className="camera-preview">
          {!capturedImage ? (
            <div className="video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
              <canvas ref={canvasRef} className="camera-canvas" style={{ display: 'none' }} />
            </div>
          ) : (
            <div className="captured-image-container">
              <img src={capturedImage} alt="Captured" className="captured-image" />
              {detectionResult && (
                <div className="detection-info">
                  <p>Faces detected: {detectionResult.face_count}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="camera-controls">
          {!capturedImage ? (
            <>
              <button onClick={captureImage} className="btn btn-primary">
                Capture Photo
              </button>
              <button onClick={switchCamera} className="btn btn-secondary">
                Switch Camera
              </button>
            </>
          ) : (
            <>
              <button onClick={detectFaces} disabled={isDetecting} className="btn btn-primary">
                {isDetecting ? 'Detecting...' : 'Detect Faces'}
              </button>
              {detectionResult && detectionResult.face_count > 0 && (
                <>
                  <button onClick={recognizeFace} className="btn btn-success">
                    Recognize Face
                  </button>
                  <button onClick={registerFace} className="btn btn-warning">
                    Register Face
                  </button>
                </>
              )}
              <button onClick={retakePhoto} className="btn btn-secondary">
                Retake Photo
              </button>
            </>
          )}
        </div>

        {detectionResult && (
          <div className="detection-results">
            <h3>Detection Results</h3>
            <p>Faces detected: {detectionResult.face_count}</p>
            {detectionResult.face_count > 0 && (
              <div className="face-details">
                <p>Face locations: {JSON.stringify(detectionResult.locations)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;