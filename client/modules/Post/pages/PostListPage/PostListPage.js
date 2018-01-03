import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';

// Import Components
import PostList from '../../components/PostList';
import PostCreateWidget from '../../components/PostCreateWidget/PostCreateWidget';

// Import Actions
import { addPostRequest, fetchPosts, deletePostRequest } from '../../PostActions';
import { toggleAddPost } from '../../../App/AppActions';

// Import Selectors
import { getShowAddPost } from '../../../App/AppReducer';
import { getPosts } from '../../PostReducer';

import styles from './PostListPage.css';

class PostListPage extends Component {
  componentDidMount() {
    this.props.dispatch(fetchPosts());
  }

  handleDeletePost = post => {
    if (confirm('Do you want to delete this post')) { // eslint-disable-line
      this.props.dispatch(deletePostRequest(post));
    }
  };

  handleAddPost = () => {
    // this.props.dispatch(toggleAddPost());
    // this.props.dispatch(addPostRequest({ name, title, content }));ls
    this.handleSearchClick();
  };

  handleSearchClick = () => {
    this.props.dispatch(fetchPosts(this.refs.tags.value, this.refs.rating.value));
  };

  handleNextClick = () => {
    this.props.dispatch(fetchPosts(this.refs.tags.value, this.refs.rating.value, this.state.page + 1));
    this.setState({ page: this.state.page + 1 });
  };

  handlePreviousClick = () => {
    this.props.dispatch(fetchPosts(this.refs.tags.value, this.refs.rating.value, this.state.page - 1));
    this.setState({ page: this.state.page - 1 });
  };

  state = {
    page: 1
  }

  render() {
    return (
      <div>
        <div className={styles['form']}>
          <input className={styles['form-field']} type="text" placeholder="tags" ref="tags" />
          <input className={styles['form-field']} type="text" placeholder="rating" ref="rating" />
          <a className={styles['button']} href="#" onClick={this.handleSearchClick}>Search</a>
        </div>
        <PostCreateWidget addPost={this.handleAddPost} showAddPost={this.props.showAddPost} />
        <PostList handleDeletePost={this.handleDeletePost} posts={this.props.posts} />
        {this.state.page > 1 ?
          <a className={styles['button']} href="#" onClick={this.handlePreviousClick}>previous</a> : ""
        }
        <a className={styles['button']} href="#" onClick={this.handleNextClick}>next</a>
      </div>
    );
  }
}

// Actions required to provide data for this component to render in sever side.
PostListPage.need = [() => { return fetchPosts(); }];

// Retrieve data from store as props
function mapStateToProps(state) {
  return {
    showAddPost: getShowAddPost(state),
    posts: getPosts(state),
  };
}

PostListPage.propTypes = {
  posts: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    contentType: PropTypes.string.isRequired,
    metadata: PropTypes.shape({
      rating: PropTypes.number,
      tags: PropTypes.array,
      size: PropTypes.number
    }).isRequired
  })).isRequired,
  showAddPost: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
};

PostListPage.contextTypes = {
  router: React.PropTypes.object,
};

export default connect(mapStateToProps)(PostListPage);
