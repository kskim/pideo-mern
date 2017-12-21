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
};

export default helper;
