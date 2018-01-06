import callApi from '../../util/apiCaller';

// Export Constants
export const ADD_POST = 'ADD_POST';
export const ADD_POSTS = 'ADD_POSTS';
export const DELETE_POST = 'DELETE_POST';
export const DELETE_ADDITIONAL = 'DELETE_ADDITIONAL';

// Export Actions
export function addPost(post) {
  return {
    type: ADD_POST,
    post,
  };
}

export function addPostRequest(post) {
  return (dispatch) => {
    return callApi('posts', 'post', {
      post: {
        name: post.name,
        title: post.title,
        content: post.content,
      },
    }).then(res => dispatch(addPost(res.post)));
  };
}

export function deleteAdditionalAction(_id) {
  return {
    type: DELETE_ADDITIONAL,
    _id,
  };
}
export function addPosts(posts) {
  return {
    type: ADD_POSTS,
    posts,
  };
}

export function fetchPosts(params) {
  return (dispatch) => {
    let query = 'files?';
    if (params) {
      Object.keys(params).forEach(key => {
        query += key + '=' + params[key] + '&';
      });
    }
    return callApi(query).then(res => {
      dispatch(addPosts(res.files));
    });
  };
}

export function encodingStart(_id) {
  //http://localhost:8000/api/toMp4/5a4f0274157edd35241c3310
  return callApi(`toMp4/${_id}`);
}

export function fetchPost(_id) {
  return (dispatch) => {
    return callApi(`files/${_id}`).then(res => dispatch(addPosts([res.file])));
  };
}

export function addAdditional(fileId, linkValue, linkType, linkInfo) {
  return (dispatch) => {
    return callApi(`addAdditional/${fileId}`, 'post', { fileId, linkValue, linkType, linkInfo }).then(res => {
      if (res.errors) {
        alert(res.message);
        return;
      }
      return dispatch(addPosts([res.file]));
    });
  };
}

export function deleteAdditional(_id) {
  return (dispatch) => {
    return callApi(`addAdditional/${_id}`, 'delete', { _id }).then(res => dispatch(deleteAdditionalAction(_id)));
  };
}

export function modifyPost(_id, tags = null, rating = null) {
  return (dispatch) => {
    return callApi(`files/${_id}`, 'post', { tags, rating }).then(res => dispatch(addPosts([res.file])));
  };
}

export function deletePost(_id) {
  return {
    type: DELETE_POST,
    _id,
  };
}

export function deletePostRequest(_id) {
  return (dispatch) => {
    return callApi(`files/${_id}`, 'delete').then(() => dispatch(deletePost(_id)));
  };
}
