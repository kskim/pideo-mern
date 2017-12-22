import React, { Component, PropTypes } from 'react';
import { injectIntl, intlShape, FormattedMessage } from 'react-intl';

// Import Style
import styles from './PostCreateWidget.css';
import openSocket from 'socket.io-client';
import helper from '../../../../util/helper';
import { Line } from 'rc-progress';
import { WithContext as ReactTags } from 'react-tag-input';
import StarRatingComponent from 'react-star-rating-component'; //https://www.npmjs.com/package/react-star-rating-component

export class PostCreateWidget extends Component {
  constructor(props) {
    super(props);
    this.socket = openSocket('http://localhost:8000');
    this.socket.on('protocol', (data) => {
      if (data.pieceSize) {
        this.pieceSize = data.pieceSize;
      }
    });
  }

  state = {
    showProgress: false,
    progress: 10,
    tags: [],
    suggestions: [],
    rating: 0,
  };

  pieceSize = null;

  addPost = () => {
    const file = this.refs.file.files[0];
    if (!file) return;

    const fileName = file.name;
    const size = file.size;
    const socket = this.socket;
    const title = this.refs.title.value;
    const rating = this.state.rating;
    const tags = this.state.tags.map(value => value['text']);
    console.log(fileName, size, title, tags, rating);

    socket.emit('file-transfer-ready', { fileName, size, title, tags, rating });

    this.socket.on('file-transfer-continue', (data) => {
      const fileReader = helper.sliceFile(file, data.pieceIndex, this.pieceSize);
      const percent = ((data.pieceIndex * this.pieceSize) / file.size) * 100;
      this.setState({ showProgress: true, progress: Math.round(percent) });
      fileReader.onload = (event) => {
        let fileData;
        if (!event) {
          fileData = fileReader.content;
        } else {
          fileData = event.target.result;
        }
        socket.emit('file-transfer-data', { fileName, fileData, title });
      };
    });
    this.socket.on('file-transfer-complate', () => {
      this.setState({ showProgress: false, progress: 100 });
      alert('complate');
      this.clear();
    });
  };

  clear = () => {
    this.refs.title.value = '';
    this.refs.file.value = '';
    this.setState({ tags: [], rating: 0 });
  };

  handleDelete = (i) => {
    let tags = this.state.tags;
    tags.splice(i, 1);
    this.setState({ tags });
  };

  handleAddition = (tag) => {
    let tags = this.state.tags;
    tags.push({
      id: tags.length + 1,
      text: tag,
    });
    this.setState({ tags });
    console.log(tags.map(value => value['text']));
  };

  handleDrag = (tag, currPos, newPos) => {
    let tags = this.state.tags;

    // mutate array
    tags.splice(currPos, 1);
    tags.splice(newPos, 0, tag);

    // re-render
    this.setState({ tags });
  };

  onStarClick = (nextValue, prevValue, name) => {
    this.setState({ rating: nextValue });
  };

  render() {
    const cls = `${styles.form} ${(this.props.showAddPost ? styles.appear : '')}`;
    const { tags, suggestions, showProgress, progress, rating } = this.state;
    return (
      <div className={cls}>
        <div className={`${styles['form-content']} ${showProgress ? styles['hide'] : ''}`} >
          <h2 className={styles['form-title']}><FormattedMessage id="createNewPost" /></h2>
          <input placeholder={this.props.intl.messages.postTitle} className={styles['form-field']} ref="title" />
          <input type="file" className={styles['form-field']} ref="file" />
          <StarRatingComponent
            name="rate1"
            starCount={5}
            value={rating}
            onStarClick={this.onStarClick.bind(this)}
          />
          <ReactTags
            tags={tags}
            suggestions={suggestions}
            handleDelete={this.handleDelete}
            handleAddition={this.handleAddition}
            handleDrag={this.handleDrag}
            classNames={{
              tags: styles['ReactTags__tags'],
              tagInput: styles['ReactTags__tagInput'],
              tagInputField: styles['ReactTags__tagInputField'],
              selected: styles['ReactTags__selected'],
              tag: styles['ReactTags__tag'],
              remove: styles['ReactTags__remove'],
              suggestions: styles['ReactTags__suggestions'],
              activeSuggestion: styles['ReactTags__activeSuggestion'],
            }}
          />
          <a className={styles['post-submit-button']} href="#" onClick={this.addPost}><FormattedMessage id="submit" ref="submit" /></a>
        </div>
        <div className={`${styles['form-content']} ${showProgress ? '' : styles['hide']}`} >
          <span>Progress {progress}%</span>
          <Line percent={progress} strokeWidth="4" strokeColor="#2db7f5" trailColor="#D9D9D9" />
        </div>
      </div>
    );
  }
}

PostCreateWidget.propTypes = {
  addPost: PropTypes.func.isRequired,
  showAddPost: PropTypes.bool.isRequired,
  intl: intlShape.isRequired,
};

export default injectIntl(PostCreateWidget);
