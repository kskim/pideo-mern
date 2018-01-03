import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import StarRatingComponent from 'react-star-rating-component'; // https://www.npmjs.com/package/react-star-rating-component
import { WithContext as ReactTags } from 'react-tag-input';
import { modifyPost, addAdditional, deleteAdditional } from '../../PostActions';
import { Link } from 'react-router';

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
    tags: this.props.post.metadata.tags ? this.props.post.metadata.tags.map((v, i) => { return { id: i, text: v }; }) : [],
    muted: false,
    source: [
      {
        src: '/api/stream/' + this.props.post._id,
        type: 'video/webm',
      },
    ],
  };

  handleOnClick = (event) => {
    const linkFileId = this.refs.linkFileId.value;
    const linkType = this.refs.linkType.value;
    this.props.dispatch(addAdditional(this.props.post._id, linkFileId, linkType));
  };

  handleAdditionalDeleteClick = (_id) => {
    this.props.dispatch(deleteAdditional(_id));
  };

  additionalRender = (add) => {
    switch (add.linkType) {
      case 'snapshot':
      case 'poster':
      case 'cover':
        return (
          <div key={add._id}>
            <div>
              <span>{add.linkType} : </span>
              <span><a href={`/files/${add.linkFileId}`}><img src={`/api/stream/${add.linkFileId}`} /></a></span>
              <span> &nbsp; [<a href="#" onClick={ () => this.handleAdditionalDeleteClick(add._id)}>delete</a>]</span>
            </div>
          </div>
        );
      default :
        return (
          <div key={add._id}>
            <div>
              <span>{add.linkType} : </span>
              <span><a href={`/files/${add.linkFileId}`}>{add.linkFileId}</a></span>
              <span> &nbsp; [<a href="#" onClick={ () => this.handleAdditionalDeleteClick(add._id)}>delete</a>]</span>
            </div>
          </div>
        );
    }
  };

  tracksRender = (post) => {
    if (post.additionals) {
      return post.additionals.filter(add => add.linkType === 'subtitle').map(add => {
        return (
          <track kind="subtitles" label="subtitles" src={`/api/stream/${add.linkFileId}`} srclang="ko"></track>
        );
      });
    }
    return '';
  };

  render() {
    const { rating } = this.props.post.metadata;
    return (
      <div>
        <Helmet title={this.props.post.metadata.title} />
        <div className={`${styles['single-post']} ${styles['post-detail']}`}>
          <StarRatingComponent
            name="rate1"
            starCount={5}
            value={rating}
            onStarClick={this.handleOnStarClick}
          />
          <ReactTags
            tags={this.state.tags}
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
          <a href={'/api/stream/' + this.props.post._id}>{this.props.post.filename}</a>
          {this.props.post.additionals ? this.props.post.additionals.map(this.additionalRender) : ''}
          {
            this.props.post.contentType == 'video/mp4' ||
            this.props.post.contentType == 'video/webm' ?
            <video className={styles['video']} controls>
              <source src={'/api/stream/' + this.props.post._id} type={this.props.post.contentType} />
              {this.tracksRender(this.props.post)}
            </video>
            : ''
          }
        </div>
        <div>
          <select ref="linkType">
            <option value="subtitle">subtitle</option>
            <option value="poster">poster</option>
            <option value="cover">cover</option>
            <option value="snapshot">snapshot</option>
          </select>
          <input type="text" placeholder="link file id" ref="linkFileId" />
          <a href="#" onClick={this.handleOnClick}>[ADD]</a>
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
    contentType: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      rating: PropTypes.number,
      tags: PropTypes.array,
      size: PropTypes.number,
    }).isRequired,
    additionals: PropTypes.array.isRequired,
  }).isRequired,
};

export default connect(mapStateToProps)(PostDetailPage);
