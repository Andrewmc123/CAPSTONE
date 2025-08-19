from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from app.models import db, FaceEncoding, VaultContent
from datetime import datetime

vault_routes = Blueprint('vault', __name__)

@vault_routes.route('/faces', methods=['GET'])
@login_required
def get_faces():
    faces = FaceEncoding.query.filter_by(user_id=current_user.id).all()
    return jsonify([f.to_dict() for f in faces])

@vault_routes.route('/faces/<int:face_id>', methods=['DELETE'])
@login_required
def delete_face(face_id):
    face = FaceEncoding.query.get_or_404(face_id)
    if face.user_id != current_user.id:
        return jsonify({"error": "Unauthorized"}), 403
        
    db.session.delete(face)
    db.session.commit()
    return jsonify({"success": True})

@vault_routes.route('/content', methods=['GET'])
@login_required
def get_vault_content():
    content = VaultContent.query.filter_by(owner_id=current_user.id).all()
    return jsonify([item.to_dict() for item in content])

@vault_routes.route('/content', methods=['POST'])
@login_required
def add_vault_content():
    data = request.json
    new_content = VaultContent(
        owner_id=current_user.id,
        face_id=data.get('face_id'),
        content_type=data['content_type'],
        file_path=data.get('file_path'),
        text_content=data.get('text_content')
    )
    db.session.add(new_content)
    db.session.commit()
    return jsonify(new_content.to_dict()), 201