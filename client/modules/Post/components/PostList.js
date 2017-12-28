import React, { PropTypes } from 'react';

// Import Components
import PostListItem from './PostListItem/PostListItem';

function PostList(props) {
  return (
    <div className="listView">
      {
        props.posts ? props.posts.map(post => (
          <PostListItem
            post={post}
            key={post._id}
            onDelete={() => props.handleDeletePost(post._id)}
          />
        )) : ''
      }
    </div>
  );
}

PostList.propTypes = {
  posts: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    contentType: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      title: PropTypes.string.isRequired,
      rating: PropTypes.number,
      tags: PropTypes.array,
      size: PropTypes.number
    }).isRequired
  })).isRequired,
  handleDeletePost: PropTypes.func.isRequired,
};

export default PostList;
