import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';

// Import Style
import styles from './PostListItem.css';
import StarRatingComponent from 'react-star-rating-component'; //https://www.npmjs.com/package/react-star-rating-component

function PostListItem(props) {
  const { tags, rating } = props.post;
  let tagsArray = [];
  if (Array.isArray(tags)) {
    tagsArray = tags[0];
  }
  console.log(tags, tagsArray);
  return (
    <div className={styles['single-post']}>
      <h3 className={styles['post-title']}>
        <Link to={`/posts/${props.post.slug}-${props.post.cuid}`} >
          {props.post.title}
        </Link>
      </h3>
      <p className={styles['post-desc']}>{props.post.fileName}</p>
      <StarRatingComponent
        name="rate1"
        starCount={5}
        value={rating}
      />
      <div>
        {
          tagsArray ? tagsArray.map(tag => (
            <span className={styles['tag']}> {tag} </span>
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
    title: PropTypes.string.isRequired,
    fileName: PropTypes.string.isRequired,
    rating: PropTypes.string.isRequired,
    tags: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    cuid: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default PostListItem;
