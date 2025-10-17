function removeTrailingSlash(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
function initializePosthog() {
  const referrer = document.referrer;
  if (!referrer.includes("upstash.com")) {
    document.cookie =
      "ph_referral_track=" +
      removeTrailingSlash(referrer) +
      "; domain=.upstash.com";
  }

  !(function (t, e) {
    var o, n, p, r;
    e.__SV ||
      ((window.posthog = e),
      (e._i = []),
      (e.init = function (i, s, a) {
        function g(t, e) {
          var o = e.split(".");
          2 == o.length && ((t = t[o[0]]), (e = o[1])),
            (t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            });
        }
        ((p = t.createElement("script")).type = "text/javascript"),
          (p.async = !0),
          (p.src = s.api_host + "/static/array.js"),
          (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(
            p,
            r
          );
        var u = e;
        for (
          void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
            u.people = u.people || [],
            u.toString = function (t) {
              var e = "posthog";
              return (
                "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e
              );
            },
            u.people.toString = function () {
              return u.toString(1) + ".people (stub)";
            },
            o =
              "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(
                " "
              ),
            n = 0;
          n < o.length;
          n++
        )
          g(u, o[n]);
        e._i.push([i, s, a]);
      }),
      (e.__SV = 1));
  })(document, window.posthog || []);

  posthog.init("phc_hT8RJLWZ74BfzZwduj8jrZNePw8bzC7ByQnUlVNEnR8", {
    api_host: "https://stats.upstash.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    cross_subdomain_cookie: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: "cookie",
    opt_out_capturing_by_default: true,
    rate_limiting: {
      events_burst_limit: 1000,
      events_per_second: 100,
    },
  });
  posthog.opt_in_capturing();
}
// Validation function to replace zod
function validateCacheData(data) {
  if (!data || typeof data !== "object") return false;
  if (typeof data.isEuropean !== "boolean") return false;
  if (typeof data.expiresAt !== "number") return false;
  return true;
}

// Cache management functions
const GEO_CACHE_KEY = "geo:is_eu";
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * @returns {boolean | null}
 */
function getCachedIsEuropean() {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!validateCacheData(parsed)) {
      localStorage.removeItem(GEO_CACHE_KEY);
      return null;
    }

    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(GEO_CACHE_KEY);
      return null;
    }

    return parsed.isEuropean;
  } catch {
    return null;
  }
}

function setCachedIsEuropean(isEuropean) {
  const expiresAt = Date.now() + GEO_CACHE_TTL_MS;
  localStorage.setItem(
    GEO_CACHE_KEY,
    JSON.stringify({ isEuropean, expiresAt })
  );
}

const checkGeolocation = () => {
  const cachedIsEU = getCachedIsEuropean();
  if (cachedIsEU !== null) {
    if (!cachedIsEU) {
      localStorage.setItem("cookieConsent", "true");
      initializePosthog();
      return Promise.resolve(true); // indicates we've handled non-European user
    }
    return Promise.resolve(false); // indicates we should show the banner
  }

  // If no cache, fetch from API
  return fetch("https://upstash.com/api/geolocation")
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      // Cache the result
      setCachedIsEuropean(data.isEuropean);

      if (!data.isEuropean) {
        localStorage.setItem("cookieConsent", "true");
        initializePosthog();
        return true; // indicates we've handled non-European user
      }
      return false; // indicates we should show the banner
    })
    .catch((error) => {
      return false;
    });
};

function initialize() {
  if (localStorage.getItem("cookieConsent") === "true") {
    initializePosthog();
  } else {
    createCookieConsentBanner();
  }
}

initialize();
function createCookieConsentBanner() {
  if (
    document.getElementById("cookie-consent-banner") ||
    localStorage.getItem("cookieConsent")
  )
    return;

  return checkGeolocation().then((isHandled) => {
    if (!isHandled) {
      const style = document.createElement("style");
      style.textContent = `
        #cookie-consent-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          background-color: rgb(52, 211, 153);
          padding: 6px 80px 6px 16px;
          font-size: 14px;
          color: black;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
        }
        @media (min-width: 768px) {
          #cookie-consent-banner {
            bottom: 16px;
            left: 50%;
            width: 600px;
            transform: translateX(-50%);
            gap: 16px;
            padding: 6px 6px 6px 16px;
            border-radius: 9999px;
          }
        }
      `;
      document.head.appendChild(style);

      const banner = document.createElement("div");
      banner.id = "cookie-consent-banner";

      const message = document.createElement("span");
      message.innerHTML =
        'We use cookies to improve your experience. <a href="https://upstash.com/trust/privacy.pdf" style="margin-left: 4px; text-decoration: underline;">Read our privacy policy.</a>';

      const buttonContainer = document.createElement("div");
      buttonContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
      `;

      const acceptButton = document.createElement("button");
      const acceptText = document.createElement("p");
      acceptText.textContent = "Accept";
      acceptButton.appendChild(acceptText);
      acceptButton.style.cssText = `
        display: flex;
        align-items: center;
        background-color: white;
        padding: 4px 12px 4px 12px;
        border-radius: 9999px;
        border: none;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
      `;

      const closeButton = document.createElement("button");
      closeButton.textContent = "x";
      closeButton.style.cssText = `
        display: flex;
        height: 24px;
        width: 24px;
        align-items: center;
        justify-content: center;
        border-radius: 9999px;
        border: none;
        background: transparent;
        cursor: pointer;
        padding-bottom: 3px;
        transition: background-color 0.2s;
      `;

      acceptButton.addEventListener(
        "mouseover",
        () => (acceptButton.style.backgroundColor = "#f3f4f6")
      );
      acceptButton.addEventListener(
        "mouseout",
        () => (acceptButton.style.backgroundColor = "white")
      );
      closeButton.addEventListener(
        "mouseover",
        () => (closeButton.style.backgroundColor = "rgb(16, 185, 129)")
      );
      closeButton.addEventListener(
        "mouseout",
        () => (closeButton.style.backgroundColor = "transparent")
      );

      acceptButton.addEventListener("click", () => {
        localStorage.setItem("cookieConsent", "true");
        banner.remove();
        initializePosthog();
      });

      closeButton.addEventListener("click", () => banner.remove());

      buttonContainer.appendChild(acceptButton);
      buttonContainer.appendChild(closeButton);
      banner.appendChild(message);
      banner.appendChild(buttonContainer);
      document.body.appendChild(banner);
    }
  });
}
