import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import StarRatingComponent from 'react-star-rating-component'; //https://www.npmjs.com/package/react-star-rating-component

// Import Style
import styles from '../../components/PostListItem/PostListItem.css';

// Import Actions
import { fetchPost } from '../../PostActions';

// Import Selectors
import { getPost } from '../../PostReducer';

class PostDetailPage extends Component {
  state = {
    muted: false,
    source: [
      {
        src: '/api/stream/' + this.props.post._id,
        type: 'video/webm'
      }
    ]
  };

  render() {
    const VideoStyle = {
      backgroundColor: 'green'
    };
    let tagsArray = [];
    const { tags, rating } = this.props.post.metadata;
    if (tags && Array.isArray(tags)) {
      tagsArray = tags;
    }
    return (
      <div>
        <Helmet title={this.props.post.metadata.title} />
        <div className={`${styles['single-post']} ${styles['post-detail']}`}>
          <h3 className={styles['post-title']}>{this.props.post.metadata.title}</h3>
          <StarRatingComponent
            name="rate1"
            starCount={5}
            value={rating}
          />
          <div>
            {
              tagsArray ? tagsArray.map(tag => (
                <span key={tag} className={styles['tag']}> {tag} </span>
              )) : ''
            }
          </div>
          <p>{this.props.post.filename}</p>
          <video className={styles['video']} controls>
            <source src={'/api/stream/' + this.props.post._id} type='video/webm' />
          </video>
        </div>
      </div>
    );
  }
}

// Actions required to provide data for this component to render in sever side.
PostDetailPage.need = [params => {
  return fetchPost(params._id);
}];

// Retrieve data from store as props
function mapStateToProps(state, props) {
  return {
    post: getPost(state, props.params.cuid),
  };
}

PostDetailPage.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      title: PropTypes.string.isRequired,
      rating: PropTypes.number,
      tags: PropTypes.array,
      size: PropTypes.number
    }).isRequired
  }).isRequired,
};

export default connect(mapStateToProps)(PostDetailPage);
