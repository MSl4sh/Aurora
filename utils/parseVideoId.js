// parseVideoId.js
module.exports = function parseVideoId(str) {
    // Si str = "yt:video:abcdEFGH", on extrait "abcdEFGH".
    const match = str.match(/yt:video:(.+)/);
    return match ? match[1] : null;
  };
  