const conf = require("./config.js");
module.exports = 
{
    REQ_UNDEFINED:          new Error("vid_id OR from_val OR to_val are UNDEFINED!"),
    REQ_ID_LENGTH:          new Error("vid_id length is longer than permitted!"),
    REQ_FROM_GREATER:       new Error("From is GREATER than TO! You cannot travel back to the future!"),
    REQ_EXCEEDED_DURATION:  new Error("The video duration exceeds the limit of " + conf.MAX_VIDEO_DURATION + "s !"),

    STATUS_VIDEO_NOT_FOUND: new "Video NOT found! Keep in mind that videos are stored for up to ${conf.ADEL_OLDER_THAN} mins."


}