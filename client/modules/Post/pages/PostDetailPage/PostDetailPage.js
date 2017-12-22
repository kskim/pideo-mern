import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import Helmet from 'react-helmet';
import { Link } from 'react-router';
import ReactVideo from 'react.video';

// Import Style
import styles from '../../components/PostListItem/PostListItem.css';

// Import Actions
import { fetchPost } from '../../PostActions';

// Import Selectors
import { getPost } from '../../PostReducer';


// export function PostDetailPage(props) {
//   function onClickPlay() {
//     this.refs.VideoComp.play();
//   };
//   return (
//     <div>
//       <Helmet title={props.post.title} />
//       <div className={`${styles['single-post']} ${styles['post-detail']}`}>
//         <h3 className={styles['post-title']}>{props.post.title}</h3>
//         <p>{props.post.fileName}</p>
//         <Link to={`/file/download/${props.post.fileId}`} >
//           Download
//         </Link>
//
//         <ReactVideo
//           ref={'VideoComp'}
//           cls={'custom-video'}
//           height={500} width={'100%'}
//           style={VideoStyle}
//           muted={this.state.muted}
//           src={`/file/stream/${props.post.fileId}`}
//           source={this.state.source}>
//         </ReactVideo>
//
//         <div>
//           <div onClick={this.onClickPlay}>Play</div>
//         </div>
//
//       </div>
//     </div>
//   );
// }

class PostDetailPage extends Component {
  state = {
    muted: false,
    source: [
      {
        src: 'http://www.html5rocks.com/en/tutorials/video/basics/devstories.mp4',
        type: 'video/mp4'
      }
    ]
  };

  onClickPlay = () => {
    this.refs.VideoComp.play();
  };


  render() {
    const VideoStyle = {
      backgroundColor: 'green'
    };
    return (
      <div>
        <Helmet title={this.props.post.title} />
        <div className={`${styles['single-post']} ${styles['post-detail']}`}>
          <h3 className={styles['post-title']}>{this.props.post.title}</h3>
          <p>{this.props.post.fileName}</p>
          <Link to={`/file/download/${this.props.post.fileId}`} >
            Download
          </Link>

          <ReactVideo
            ref={'VideoComp'}
            cls={'custom-video'}
            height={500} width={'100%'}
            style={VideoStyle}
            muted={this.state.muted}
            src={`/file/stream/${this.props.post.fileId}`}
            source={this.state.source}>
          </ReactVideo>

          <div>
            <div onClick={this.onClickPlay}>Play</div>
          </div>

        </div>
      </div>
    );
  }
}

// Actions required to provide data for this component to render in sever side.
PostDetailPage.need = [params => {
  return fetchPost(params.cuid);
}];

// Retrieve data from store as props
function mapStateToProps(state, props) {
  return {
    post: getPost(state, props.params.cuid),
  };
}

PostDetailPage.propTypes = {
  post: PropTypes.shape({
    title: PropTypes.string.isRequired,
    fileName: PropTypes.string.isRequired,
    fileId: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    cuid: PropTypes.string.isRequired,
  }).isRequired,
};

export default connect(mapStateToProps)(PostDetailPage);
