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
    linkValue: undefined,
    linkInfo: undefined,
    tags: this.props.post.metadata.tags ? this.props.post.metadata.tags.map((v, i) => { return { id: i, text: v }; }) : [],
    muted: false,
    source: [
      {
        src: '/api/stream/' + this.props.post._id,
        type: 'video/webm',
      },
    ],
  };

  handleOnClick = () => {
    const linkType = this.refs.linkType.value;
    const linkValue = this.refs.linkValue.value;
    const linkInfo = this.refs.linkInfo.value;
    console.log(linkValue, linkType, linkInfo);
    this.props.dispatch(addAdditional(this.props.post._id, linkValue, linkType, linkInfo));
  };

  handleAdditionalDeleteClick = (_id) => {
    this.props.dispatch(deleteAdditional(_id));
  };

  handlePinClick = (time) => {
    this.refs.video.currentTime = time;
    this.refs.video.play();
  };

  additionalRender = (add) => {
    switch (add.linkType) {
      case 'pin':
        return (
          <div key={add._id}>
            <div>
              <span>{add.linkType} : </span>
              <span>[<a href='javascript:void(0);' onClick={() => this.handlePinClick(add.linkValue)} >{add.linkValue}</a>]({add.linkInfo})</span>
              <span> &nbsp; [<a href="javascript:void(0);" onClick={() => this.handleAdditionalDeleteClick(add._id)}>X</a>]</span>
            </div>
          </div>
        );
      case 'snapshot':
      case 'poster':
      case 'cover':
        return (
          <div key={add._id}>
            <div>
              <span>{add.linkType} : </span>
              <span><a href={`/files/${add.linkValue}`}><img src={`/api/stream/${add.linkValue}`} /></a></span>
              <span> &nbsp; [<a href="javascript:void(0);" onClick={() => this.handleAdditionalDeleteClick(add._id)}>delete</a>]</span>
            </div>
          </div>
        );
      default :
        return (
          <div key={add._id}>
            <div>
              <span>{add.linkType} : </span>
              <span><a href={`/files/${add.linkValue}`}>{add.linkValue}</a></span>
              <span> &nbsp; [<a href="javascript:void(0);" onClick={() => this.handleAdditionalDeleteClick(add._id)}>delete</a>]</span>
            </div>
          </div>
        );
    }
  };

  tracksRender = (post) => {
    if (post.additionals) {
      return post.additionals.filter(add => add.linkType === 'subtitle').map(add => {
        return (
          <track kind="subtitles" label="subtitles" src={`/api/stream/${add.linkValue}`} srclang={add.linkInfo}></track>
        );
      });
    }
    return '';
  };

  handleSelectChange = (event) => {
    if (event.target.value === 'pin') {
      this.setState({ linkValue: this.refs.video.currentTime });
    }
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
          <div>
            <span>
              <a href={`/api/toMp4/${this.props.post._id}`} target='_blank'>encoding to mp4</a>
            </span>
            <span>(process:{this.props.post.metadata.process ? 'processing': 'process done'})</span>
          </div>
          <span>
            <a href={'/api/stream/' + this.props.post._id}>{this.props.post.filename}</a>
            (size : {(this.props.post.length / 1048576).toFixed(2)}Mb)
          </span>
          {this.props.post.additionals ? this.props.post.additionals.map(this.additionalRender) : ''}
          {
            this.props.post.contentType == 'video/mp4' ||
            this.props.post.contentType == 'video/webm' ?
            <video className={styles['video']} controls ref="video">
              <source src={'/api/stream/' + this.props.post._id} type={this.props.post.contentType} />
              {this.tracksRender(this.props.post)}
            </video>
            : ''
          }
        </div>
        <div>
          <select ref="linkType" onChange={this.handleSelectChange}>
            <option value="subtitle">subtitle</option>
            <option value="poster">poster</option>
            <option value="cover">cover</option>
            <option value="snapshot">snapshot</option>
            <option value="pin">pin</option>
          </select>
          <input type="text" placeholder="link value" value={this.state.linkValue} ref='linkValue' />
          <input type="text" placeholder="optional value" value={this.state.linkInfo} ref='linkInfo' />
          <a href="javascript:void(0);" onClick={this.handleOnClick}>[ADD]</a>
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
    length: PropTypes.number.isRequired,
    contentType: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      rating: PropTypes.number,
      tags: PropTypes.array,
      process: PropTypes.boolean
    }).isRequired,
    additionals: PropTypes.array.isRequired,
  }).isRequired,
};

export default connect(mapStateToProps)(PostDetailPage);
