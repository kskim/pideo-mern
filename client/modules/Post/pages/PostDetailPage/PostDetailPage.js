import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import StarRatingComponent from 'react-star-rating-component'; //https://www.npmjs.com/package/react-star-rating-component
import { WithContext as ReactTags } from 'react-tag-input';
import { modifyPost } from '../../PostActions';

// Import Style
import styles from '../../components/PostListItem/PostListItem.css';
import styles2 from '../../components/PostCreateWidget/PostCreateWidget.css';

// Import Actions
import { fetchPost } from '../../PostActions';

// Import Selectors
import { getPost } from '../../PostReducer';

class PostDetailPage extends Component {

  handleAddition = (tag) => {
    let tags = this.state.tags;
    tags.push({
      id: tags.length + 1,
      text: tag,
    });
    this.setState({ tags });
    // synch
    this.props.dispatch(modifyPost(this.props.post._id, tags.map(value => value['text']), null));
  };

  handleDrag = (tag, currPos, newPos) => {
    let tags = this.state.tags;

    // mutate array
    tags.splice(currPos, 1);
    tags.splice(newPos, 0, tag);

    // re-render
    this.setState({ tags });
  };

  handleDelete = (i) => {
    let tags = this.state.tags;
    tags.splice(i, 1);
    this.setState({ tags });
    // synch
    this.props.dispatch(modifyPost(this.props.post._id, tags.map(value => value['text']), null));
  };

  handleOnStarClick = (nextValue, prevValue, name) => {
    // synch
    this.props.dispatch(modifyPost(this.props.post._id, null, parseInt(nextValue, 10)));
  };

  state = {
    tags: this.props.post.metadata.tags ? this.props.post.metadata.tags.map((v,i) => { return { id:i, text:v }; }) : [],
    muted: false,
    source: [
      {
        src: '/api/stream/' + this.props.post._id,
        type: 'video/webm'
      }
    ]
  };

  render() {
    const { rating } = this.props.post.metadata;
    return (
      <div>
        <Helmet title={this.props.post.metadata.title} />
        <div className={`${styles['single-post']} ${styles['post-detail']}`}>
          <h3 className={styles['post-title']}>{this.props.post.metadata.title}</h3>
          <StarRatingComponent
            name="rate1"
            starCount={5}
            value={rating}
            onStarClick={this.handleOnStarClick}
          />
          <ReactTags
            tags={ this.state.tags }
            suggestions={[]}
            handleDelete={this.handleDelete}
            handleAddition={this.handleAddition}
            handleDrag={this.handleDrag}
            classNames={{
              tags: styles2['ReactTags__tags'],
              tagInput: styles2['ReactTags__tagInput'],
              tagInputField: styles2['ReactTags__tagInputField'],
              selected: styles2['ReactTags__selected'],
              tag: styles2['ReactTags__tag'],
              remove: styles2['ReactTags__remove'],
              suggestions: styles2['ReactTags__suggestions'],
              activeSuggestion: styles2['ReactTags__activeSuggestion'],
            }}
          />
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
    post: getPost(state, props.params._id),
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
