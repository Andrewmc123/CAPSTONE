"""
Face Vault API — the people a user has taught the app and the photos filed
under them. Face detection/recognition runs client-side (face-api.js); this
API just stores name + descriptors + photos and serves them back.
"""
import json
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.models import db, VaultPerson, VaultPhoto

vault_routes = Blueprint('vault', __name__)


@vault_routes.route('/people')
@login_required
def get_people():
    """List the people in the current user's vault. Pass ?descriptors=1 to
    include face descriptors (the browser uses them to match faces)."""
    include = request.args.get('descriptors') in ('1', 'true')
    people = VaultPerson.query.filter_by(user_id=current_user.id)\
        .order_by(VaultPerson.name.asc()).all()
    return jsonify({'people': [p.to_dict(with_descriptors=include) for p in people]})


@vault_routes.route('/people', methods=['POST'])
@login_required
def create_person():
    """Teach the app a new face: a name + at least one descriptor (+ cover)."""
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Name is required'}), 400

    samples = data.get('descriptors') or ([data['descriptor']] if data.get('descriptor') else [])
    if not samples:
        return jsonify({'error': 'A face descriptor is required'}), 400

    try:
        person = VaultPerson(
            user_id=current_user.id,
            name=name,
            descriptors=json.dumps(samples),
            cover_image=data.get('cover_image'),
        )
        db.session.add(person)
        db.session.commit()
        return jsonify(person.to_dict(with_descriptors=True)), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@vault_routes.route('/people/<int:person_id>', methods=['PATCH'])
@login_required
def update_person(person_id):
    """Rename, update cover, or add a descriptor sample (keeps learning)."""
    person = VaultPerson.query.get(person_id)
    if not person or person.user_id != current_user.id:
        return jsonify({'error': 'Not found'}), 404

    data = request.get_json() or {}
    if data.get('name'):
        person.name = data['name'].strip()
    if data.get('cover_image'):
        person.cover_image = data['cover_image']
    if data.get('descriptor'):
        samples = person.descriptor_list()
        samples.append(data['descriptor'])
        person.descriptors = json.dumps(samples[-10:])  # keep the 10 most recent samples
    db.session.commit()
    return jsonify(person.to_dict(with_descriptors=True))


@vault_routes.route('/people/<int:person_id>', methods=['DELETE'])
@login_required
def delete_person(person_id):
    person = VaultPerson.query.get(person_id)
    if not person or person.user_id != current_user.id:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(person)
    db.session.commit()
    return jsonify({'id': person_id})


@vault_routes.route('/people/<int:person_id>/photos')
@login_required
def get_person_photos(person_id):
    person = VaultPerson.query.get(person_id)
    if not person or person.user_id != current_user.id:
        return jsonify({'error': 'Not found'}), 404
    photos = VaultPhoto.query.filter_by(user_id=current_user.id, person_id=person_id)\
        .order_by(VaultPhoto.created_at.desc()).all()
    return jsonify({
        'person': person.to_dict(),
        'photos': [p.to_dict() for p in photos],
    })


@vault_routes.route('/photos', methods=['POST'])
@login_required
def add_photos():
    """File a photo under each recognized person. Creates one row per person
    so a group photo appears in every matched friend's gallery."""
    data = request.get_json() or {}
    image_url = data.get('image_url')
    person_ids = data.get('person_ids') or []
    caption = data.get('caption')
    if not image_url:
        return jsonify({'error': 'image_url is required'}), 400
    if not person_ids:
        return jsonify({'error': 'No recognized people to file under'}), 400

    try:
        valid = {p.id for p in VaultPerson.query.filter(
            VaultPerson.user_id == current_user.id,
            VaultPerson.id.in_(person_ids),
        ).all()}
        created = []
        for pid in person_ids:
            if pid not in valid:
                continue
            photo = VaultPhoto(
                user_id=current_user.id,
                person_id=pid,
                image_url=image_url,
                caption=caption,
            )
            db.session.add(photo)
            created.append(photo)
        db.session.commit()
        return jsonify({'photos': [p.to_dict() for p in created]}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@vault_routes.route('/photos/<int:photo_id>', methods=['DELETE'])
@login_required
def delete_photo(photo_id):
    photo = VaultPhoto.query.get(photo_id)
    if not photo or photo.user_id != current_user.id:
        return jsonify({'error': 'Not found'}), 404
    db.session.delete(photo)
    db.session.commit()
    return jsonify({'id': photo_id})
