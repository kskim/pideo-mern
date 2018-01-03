import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';

// Import Style
import styles from './PostListItem.css';
import StarRatingComponent from 'react-star-rating-component'; // https://www.npmjs.com/package/react-star-rating-component

function PostListItem(props) {
  let tagsArray = [];
  const { tags, rating } = props.post.metadata;
  if (tags && Array.isArray(tags)) {
    tagsArray = tags;
  }
  return (
    <div className={styles['divTableRow']}>
      <div className={styles['divTableCell']} >
          {props.post._id}
      </div>
      <div className={styles['divTableCell']} >
        <Link to={`/files/${props.post._id}`} >
          {props.post.filename ? props.post.filename : 'unknown'}
        </Link>
      </div>
      <div className={styles['divTableCell']} >
        {props.post.contentType}
      </div>
      <div className={`${styles['divTableCell']} ${styles['rating']}`}>
        <StarRatingComponent
          name="rate1"
          starCount={5}
          value={rating ? rating : 1}
        />
      </div>
      <div className={styles['divTableCell']} >
        {
          tagsArray ? tagsArray.map(tag => (
            <span key={tag} className={styles['tag']}> {tag} </span>
          )) : ''
        }
      </div>
      <div className={styles['divTableCell']} >
        <p className={styles['post-action']}><a href="javascript:void(0);" onClick={props.onDelete}><FormattedMessage id="deletePost" /></a></p>
      </div>
    </div>
  );
}

PostListItem.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    contentType: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      rating: PropTypes.number,
      tags: PropTypes.array,
      size: PropTypes.number,
    }).isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default PostListItem;
