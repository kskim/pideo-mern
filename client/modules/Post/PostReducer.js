import { ADD_POST, ADD_POSTS, DELETE_POST, DELETE_ADDITIONAL } from './PostActions';

// Initial State
const initialState = { data: [] };

const PostReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_POST :
      return {
        data: [action.post, ...state.data],
      };

    case ADD_POSTS :
      return {
        data: action.posts,
      };

    case DELETE_POST :
      return {
        data: state.data.filter(post => post._id !== action._id),
      };

    case DELETE_ADDITIONAL :
      return {
        data: state.data.map(post => {
          post.additionals = post.additionals.filter(additional => additional._id !== action._id);
          return post;
        }),
      };
    default:
      return state;
  }
};

/* Selectors */

// Get all posts
export const getPosts = state => state.posts.data;

// Get post by cuid
export const getPost = (state, _id) => state.posts.data.filter(post => post._id === _id)[0];

// Export Reducer
export default PostReducer;
