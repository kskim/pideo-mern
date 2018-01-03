import React, { Component, PropTypes } from 'react';
import { injectIntl, intlShape, FormattedMessage } from 'react-intl';
import Dropzone from 'react-dropzone';
import request from 'superagent';

// Import Style
import styles from './PostCreateWidget.css';
import { Line } from 'rc-progress';
import { WithContext as ReactTags } from 'react-tag-input';
import StarRatingComponent from 'react-star-rating-component'; // https://www.npmjs.com/package/react-star-rating-component

export class PostCreateWidget extends Component {
  state = {
    showProgress: false,
    transferSize: 0,
    progress: 10,
    tags: [],
    suggestions: [],
    rating: 1,
  };

  handleDelete = (i) => {
    let tags = this.state.tags;
    tags.splice(i, 1);
    this.setState({ tags });
  };

  handleAddition = (tag) => {
    const tags = this.state.tags;
    tags.push({
      id: tags.length + 1,
      text: tag,
    });
    this.setState({ tags });
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

  onDrop = files => {
    const rating = this.state.rating;
    const tags = this.state.tags.map(value => value['text']);
    const req = request.post('/api/fileUploads');
    req.field('rating', rating);
    req.field('tags', tags);
    files.forEach((file) => {
      req.attach(file.name, file);
    });
    this.setState({ showProgress: true, transferSize: 0, progress: 0 });
    req.on('progress', event => {
      const transferSize = event.loaded;
      const progress = Math.floor(event.percent);
      this.setState({ transferSize, progress });
    });
    req.end(() => {
      this.setState({ showProgress: false });
      this.props.addPost();
    });
  };

  render() {
    const cls = `${styles.form} ${(this.props.showAddPost ? styles.appear : '')}`;
    const { tags, suggestions, showProgress, progress, rating } = this.state;
    return (
      <div className={cls}>
        <div className={`${styles['form-content']} ${showProgress ? styles['hide'] : ''}`} >
          <h2 className={styles['form-title']}>Upload new files</h2>
          <Dropzone className={styles['dropzone']} onDrop={this.onDrop}>
            <div> Try dropping some files here, or click to select files to upload. </div>
          </Dropzone>
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
