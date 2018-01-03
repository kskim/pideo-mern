const helper = {
  /**
   * 파일을 정해진 사이즈로 자른다
   * @param file
   * @param pieceIndex
   * @param pieceSize
   * @returns {*}
   */
  sliceFile: (file, pieceIndex, pieceSize) => {
    const fileReader = new FileReader();
    const offset = pieceIndex * pieceSize;
    const limit = offset + Math.min(pieceSize, (file.size - offset));
    let pieceFile;
    if (file.webkitSlice) {
      pieceFile = file.webkitSlice(offset, limit);
    } else {
      pieceFile = file.slice(offset, limit);
    }
    fileReader.readAsBinaryString(pieceFile);
    return fileReader;
  },
  getContentType: extension => {
    switch (extension) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'gif':
        return 'image/gif';
      case 'jpeg':
      case 'jpg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'smi':
        return 'text/plain';
      default:
        return null;
    }
  },
  getFileExtension: filename => {
    return filename.split('.').pop();
  }
};

export default helper;
