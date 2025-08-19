# from flask import Blueprint, request, jsonify
# from flask_login import login_required, current_user
# import face_recognition
# import numpy as np
# import os
# import pickle
# from app.models import db, FaceEncoding
# from datetime import datetime

# camera_routes = Blueprint('camera', __name__)   

# # Ensure directory exists
# os.makedirs('storage/faces', exist_ok=True)

# @camera_routes.route('/detect', methods=['POST'])
# @login_required
# def detect_faces():
#     if 'image' not in request.files:
#         return jsonify({"error": "No image provided"}), 400
        
#     try:
#         image = request.files['image']
#         img = face_recognition.load_image_file(image)
#         face_locations = face_recognition.face_locations(img)
#         face_encodings = face_recognition.face_encodings(img, face_locations)
        
#         return jsonify({
#             "face_count": len(face_locations),
#             "locations": face_locations,
#             "encodings": [e.tolist() for e in face_encodings]
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @camera_routes.route('/recognize', methods=['POST'])
# @login_required
# def recognize_face():
#     data = request.json
#     try:
#         unknown_encoding = np.array(data['encoding'])
#         known_faces = FaceEncoding.query.filter_by(user_id=current_user.id).all()
        
#         for face in known_faces:
#             stored_encoding = pickle.loads(face.encoding)
#             matches = face_recognition.compare_faces([stored_encoding], unknown_encoding)
            
#             if matches[0]:
#                 return jsonify({
#                     "recognized": True,
#                     "face_id": face.id,
#                     "confidence": float(face_recognition.face_distance([stored_encoding], unknown_encoding)[0])
#                 })
                
#         return jsonify({"recognized": False})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# @camera_routes.route('/register', methods=['POST'])
# @login_required
# def register_face():
#     data = request.json
#     try:
#         encoding = np.array(data['encoding'])
#         new_face = FaceEncoding(
#             user_id=current_user.id,
#             encoding=pickle.dumps(encoding),
#             sample_image=data.get('sample_image')
#         )
#         db.session.add(new_face)
#         db.session.commit()
#         return jsonify(new_face.to_dict()), 201
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500