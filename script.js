function removeTrailingSlash(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

(function () {
  var referrer = document.referrer;
  if (!referrer.includes("upstash.com")) {
    document.cookie =
      "ph_referral_track=" +
      removeTrailingSlash(referrer) +
      "; domain=.upstash.com";
  }
})();
