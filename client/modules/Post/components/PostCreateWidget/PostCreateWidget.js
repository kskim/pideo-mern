import React, { Component, PropTypes } from 'react';
import { injectIntl, intlShape, FormattedMessage } from 'react-intl';

// Import Style
import styles from './PostCreateWidget.css';
import openSocket from 'socket.io-client';
import helper from '../../../../util/helper';
import { Line } from 'rc-progress';

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
    progress: 10
  };

  pieceSize = null;

  addPost = () => {
    const file = this.refs.file.files[0];
    if (!file) return;

    const fileName = file.name;
    const size = file.size;
    const socket = this.socket;
    socket.emit('file-transfer-ready', { fileName, size });

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
        socket.emit('file-transfer-data', { fileName, fileData });
      };
    });
    this.socket.on('file-transfer-complate', () => {
      this.setState({ showProgress: false, progress: 100 });
      alert('complate');
      this.clear();
    });
  };

  clear = () => {
    this.refs.title.value='';
    this.refs.content.value='';
    this.refs.file.value='';
  };

  render() {
    const cls = `${styles.form} ${(this.props.showAddPost ? styles.appear : '')}`;
    return (
      <div className={cls}>
        <div className={`${styles['form-content']} ${this.state.showProgress ? styles['hide'] : ''}`} >
          <h2 className={styles['form-title']}><FormattedMessage id="createNewPost" /></h2>
          <input placeholder={this.props.intl.messages.postTitle} className={styles['form-field']} ref="title" />
          <input type="file" className={styles['form-field']} ref="file" />
          <textarea placeholder={this.props.intl.messages.postContent} className={styles['form-field']} ref="content" />
          <a className={styles['post-submit-button']} href="#" onClick={this.addPost}><FormattedMessage id="submit" ref="submit" /></a>
        </div>
        <div className={`${styles['form-content']} ${this.state.showProgress ? '' : styles['hide']}`} >
          <span>Progress {this.state.progress}%</span>
          <Line percent={this.state.progress} strokeWidth="4" strokeColor="#2db7f5" trailColor="#D9D9D9" />
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
