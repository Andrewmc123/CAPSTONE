import { useState, useEffect, useRef, useCallback } from "react";
import "./Camera.css";

const Camera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [photoData, setPhotoData] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
    } catch (err) {
      console.error("Camera access denied", err);
    }
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const width = 414;
    const height = width / (16 / 9);
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    setPhotoData(canvasRef.current.toDataURL("image/png"));
    setPhotoTaken(true);
  };

  const redoPhoto = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setPhotoTaken(false);
    setPhotoData(null);
  };

  const handleAddFriend = () => {
    setShowModal(true);
  };

  const handleSubmitFriend = (e) => {
    e.preventDefault();
    // Here you can dispatch to redux or send to backend
    console.log("Friend info:", { firstName, lastName, dob, photoData });
    setShowModal(false);
    redoPhoto(); // Clear camera after adding
    // Reset form
    setFirstName("");
    setLastName("");
    setDob("");
  };

  return (
    <div className="camera-container">
      <div className="camera">
        {!photoTaken && <video ref={videoRef} autoPlay playsInline className="camera-video" />}
        <canvas ref={canvasRef} className="camera-canvas"></canvas>

        {/* Buttons */}
        {!photoTaken ? (
          <div className="camera-controls">
            <button className="capture-btn" onClick={takePhoto}>📸</button>
            <button className="redo-btn" onClick={redoPhoto}>🔄</button>
          </div>
        ) : (
          <div className="camera-controls">
            <button className="add-friend-btn" onClick={handleAddFriend}>Add Friend</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Add Friend Info</h2>
            <form onSubmit={handleSubmitFriend}>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <input
                type="date"
                placeholder="Date of Birth"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
              <button type="submit" className="add-friend-submit">Add Friend to Vault</button>
            </form>
            <button className="modal-close" onClick={() => setShowModal(false)}>✖</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Camera;
