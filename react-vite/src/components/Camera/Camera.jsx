import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { thunkCreatePost } from "../../redux/posts";
import "./Camera.css";

const Camera = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.session.user);
  const [stream, setStream] = useState(null);
  const [videoRef, setVideoRef] = useState(null);
  const [photoRef, setPhotoRef] = useState(null);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [facingMode, setFacingMode] = useState("environment");
  const [isLoading, setIsLoading] = useState(false);

  // Use useCallback to memoize the startCamera function
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef) {
        videoRef.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  }, [facingMode, videoRef]);

  // Use useCallback to memoize the stopCamera function
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]); // Now including the memoized functions

  const takePhoto = () => {
    if (!videoRef || !photoRef) return;

    const width = 414;
    const height = width / (16 / 9);

    photoRef.width = width;
    photoRef.height = height;

    const context = photoRef.getContext("2d");
    context.drawImage(videoRef, 0, 0, width, height);

    const imageData = photoRef.toDataURL("image/png");
    setPhotoData(imageData);
    setHasPhoto(true);
  };

  const clearPhoto = () => {
    if (photoRef) {
      const context = photoRef.getContext("2d");
      context.clearRect(0, 0, photoRef.width, photoRef.height);
    }
    setHasPhoto(false);
    setPhotoData(null);
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(facingMode === "user" ? "environment" : "user");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoData) return;

    setIsLoading(true);
    try {
      // Convert base64 to blob for file upload
      const response = await fetch(photoData);
      const blob = await response.blob();
      const file = new File([blob], "photo.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("image", file);
      formData.append("caption", caption);
      formData.append("location", location);
      formData.append("user_id", user.id);

      await dispatch(thunkCreatePost(formData));
      navigate("/dashboard");
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="camera-container">
      <div className="camera">
        <video
          ref={(ref) => setVideoRef(ref)}
          className="video-feed"
          autoPlay
          playsInline
        ></video>
        <button className="capture-btn" onClick={takePhoto}>
          📸
        </button>
        <button className="switch-camera-btn" onClick={switchCamera}>
          🔄
        </button>
      </div>

      <div className={`result ${hasPhoto ? "hasPhoto" : ""}`}>
        <canvas ref={(ref) => setPhotoRef(ref)}></canvas>
        {hasPhoto && (
          <div className="photo-form">
            <button className="clear-btn" onClick={clearPhoto}>
              ❌
            </button>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Add a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={150}
              />
              <input
                type="text"
                placeholder="Add location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={100}
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Posting..." : "Share Photo"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;