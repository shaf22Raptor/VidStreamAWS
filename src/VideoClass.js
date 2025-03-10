// Class used to store video meta-data as object
class VideoInfo {
  constructor(videoKey, displayName, uploadTime) {
    this.displayName = displayName;
    this.videoKey = videoKey;
    this.uploadTime = uploadTime;
  }
}

export default VideoInfo;