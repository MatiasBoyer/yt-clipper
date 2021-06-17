var player;
var isReady = false;

var videoId = "nsk2FGx7Cw8";

var onReady = null;

function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    height: "350",
    width: "576",
    videoId: videoId,
    events: {
      onReady: onPlayerReady,
    },
  });
}

function onPlayerReady(event) {
  event.target.playVideo();

  if(onReady != null)
    onReady();

  isReady = true;
}

function CreateYTPlayer(id = null, onready = null) {
  if (id != null) videoId = id;

  var tag = document.createElement("script");

  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  onReady = onready;
}

function LoadID_StartEnd(id, start, end) {
  if (!isReady) return;

  player.loadVideoById({
    videoId: id,
    startSeconds: start,
    endSeconds: end,
  });
}