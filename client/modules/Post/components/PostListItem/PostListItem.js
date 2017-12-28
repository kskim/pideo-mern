import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';

// Import Style
import styles from './PostListItem.css';
import StarRatingComponent from 'react-star-rating-component'; //https://www.npmjs.com/package/react-star-rating-component

function PostListItem(props) {
  let tagsArray = [];
  const { tags, rating } = props.post.metadata;
  if (tags && Array.isArray(tags)) {
    tagsArray = tags;
  }
  return (
    <div className={styles['single-post']}>
      <h3 className={styles['post-title']}>
        <Link to={`/files/${props.post._id}`} >
          {props.post.metadata.title ? props.post.metadata.title : 'untitled'}
        </Link>
      </h3>
      <p className={styles['post-desc']}>{props.post.filename}</p>
      <StarRatingComponent
        name="rate1"
        starCount={5}
        value={rating ? rating : 1}
      />
      <div>
        {
          tagsArray ? tagsArray.map(tag => (
            <span key={tag} className={styles['tag']}> {tag} </span>
          )) : ''
        }
      </div>
      <p className={styles['post-action']}><a href="#" onClick={props.onDelete}><FormattedMessage id="deletePost" /></a></p>
      <hr className={styles.divider} />
    </div>
  );
}

PostListItem.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    contentType: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      title: PropTypes.string.isRequired,
      rating: PropTypes.number,
      tags: PropTypes.array,
      size: PropTypes.number
    }).isRequired
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default PostListItem;
