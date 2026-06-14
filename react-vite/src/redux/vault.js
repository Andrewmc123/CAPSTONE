// ============================================================
// Face-vault slice — people the user has taught + the photos filed under them.
// ============================================================

const SET_PEOPLE = "vault/setPeople";
const ADD_PERSON = "vault/addPerson";
const UPDATE_PERSON = "vault/updatePerson";
const REMOVE_PERSON = "vault/removePerson";
const SET_PHOTOS = "vault/setPhotos";
const ADD_PHOTOS = "vault/addPhotos";

const setPeople = (people) => ({ type: SET_PEOPLE, people });
const addPersonAct = (person) => ({ type: ADD_PERSON, person });
const updatePersonAct = (person) => ({ type: UPDATE_PERSON, person });
const removePersonAct = (id) => ({ type: REMOVE_PERSON, id });
const setPhotos = (personId, photos) => ({ type: SET_PHOTOS, personId, photos });
const addPhotosAct = (photos) => ({ type: ADD_PHOTOS, photos });

// ---------- Thunks ----------
export const fetchPeople = (withDescriptors = false) => async (dispatch) => {
  const url = withDescriptors ? "/api/vault/people?descriptors=1" : "/api/vault/people";
  const res = await fetch(url, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(setPeople(data.people));
    return data.people;
  }
  return [];
};

export const createPerson = (payload) => async (dispatch) => {
  const res = await fetch("/api/vault/people", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const person = await res.json();
    dispatch(addPersonAct(person));
    return person;
  }
  return null;
};

export const updatePerson = (id, payload) => async (dispatch) => {
  const res = await fetch(`/api/vault/people/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const person = await res.json();
    dispatch(updatePersonAct(person));
    return person;
  }
  return null;
};

export const deletePerson = (id) => async (dispatch) => {
  const res = await fetch(`/api/vault/people/${id}`, { method: "DELETE", credentials: "include" });
  if (res.ok) dispatch(removePersonAct(id));
};

export const fetchPersonPhotos = (personId) => async (dispatch) => {
  const res = await fetch(`/api/vault/people/${personId}/photos`, { credentials: "include" });
  if (res.ok) {
    const data = await res.json();
    dispatch(setPhotos(personId, data.photos));
    return data;
  }
  return null;
};

export const addPhotos = (payload) => async (dispatch) => {
  const res = await fetch("/api/vault/photos", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    const data = await res.json();
    dispatch(addPhotosAct(data.photos));
    return data.photos;
  }
  return null;
};

// ---------- Selectors ----------
export const selectPeople = (state) => state.vault.people;
export const selectPersonPhotos = (personId) => (state) => state.vault.photosByPerson[personId];

// ---------- Reducer ----------
const initialState = { people: [], photosByPerson: {}, loaded: false };

export default function vaultReducer(state = initialState, action) {
  switch (action.type) {
    case SET_PEOPLE:
      return { ...state, people: action.people, loaded: true };
    case ADD_PERSON:
      return {
        ...state,
        people: [...state.people.filter((p) => p.id !== action.person.id), action.person],
      };
    case UPDATE_PERSON:
      return {
        ...state,
        people: state.people.map((p) => (p.id === action.person.id ? action.person : p)),
      };
    case REMOVE_PERSON:
      return {
        ...state,
        people: state.people.filter((p) => p.id !== action.id),
        photosByPerson: Object.fromEntries(
          Object.entries(state.photosByPerson).filter(([k]) => Number(k) !== action.id),
        ),
      };
    case SET_PHOTOS:
      return {
        ...state,
        photosByPerson: { ...state.photosByPerson, [action.personId]: action.photos },
      };
    case ADD_PHOTOS: {
      const byPerson = { ...state.photosByPerson };
      const delta = {};
      action.photos.forEach((ph) => {
        delta[ph.person_id] = (delta[ph.person_id] || 0) + 1;
        if (byPerson[ph.person_id]) byPerson[ph.person_id] = [ph, ...byPerson[ph.person_id]];
      });
      return {
        ...state,
        photosByPerson: byPerson,
        people: state.people.map((p) =>
          delta[p.id] ? { ...p, photo_count: (p.photo_count || 0) + delta[p.id] } : p,
        ),
      };
    }
    default:
      return state;
  }
}
