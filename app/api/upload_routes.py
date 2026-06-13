"""
File upload API — stores videos, images, GIFs and audio recorded or chosen
in the Upload Studio under app/uploads/ and serves them at /uploads/<name>.
"""
import os
import uuid

from flask import Blueprint, request, current_app
from flask_login import login_required

upload_routes = Blueprint('uploads', __name__)

ALLOWED_EXTENSIONS = {
    # video
    'mp4', 'webm', 'mov', 'm4v', 'ogv',
    # image
    'png', 'jpg', 'jpeg', 'gif', 'webp',
    # audio
    'mp3', 'wav', 'ogg', 'm4a', 'weba',
}

MIME_FALLBACK_EXT = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/mpeg': 'mp3',
    'audio/webm': 'weba',
    'audio/wav': 'wav',
}


def upload_dir():
    path = os.path.join(current_app.root_path, 'uploads')
    os.makedirs(path, exist_ok=True)
    return path


@upload_routes.route('', methods=['POST'])
@upload_routes.route('/', methods=['POST'])
@login_required
def upload_file():
    """
    Accepts multipart form-data with a 'file' field.
    Returns {url} pointing at the stored file.
    """
    if 'file' not in request.files:
        return {'error': 'No file provided'}, 400

    file = request.files['file']
    if not file or file.filename == '':
        return {'error': 'No file selected'}, 400

    ext = ''
    if '.' in file.filename:
        ext = file.filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = MIME_FALLBACK_EXT.get(file.mimetype, '')
    if ext not in ALLOWED_EXTENSIONS:
        return {'error': f'File type not supported. Allowed: {", ".join(sorted(ALLOWED_EXTENSIONS))}'}, 400

    name = f'{uuid.uuid4().hex}.{ext}'
    file.save(os.path.join(upload_dir(), name))

    kind = 'video' if ext in {'mp4', 'webm', 'mov', 'm4v', 'ogv'} else (
        'audio' if ext in {'mp3', 'wav', 'ogg', 'm4a', 'weba'} else 'image')

    return {'url': f'/uploads/{name}', 'media_kind': kind}, 201
