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

function getCookieConsent() {
  const value = localStorage.getItem("cookieConsent");
  // Backwards compatibility: convert old "true" to "granted"
  if (value === "true") {
    localStorage.setItem("cookieConsent", "granted");
    return "granted";
  }
  return value;
}

function setCookieConsent(value) {
  localStorage.setItem("cookieConsent", value);
}

async function checkGeolocation() {
  try {
    const response = await fetch("https://upstash.com/api/geolocation");
    const data = await response.json();

    if (data.isEuropean) {
      setCookieConsent("pending-eu");
      createCookieConsentBanner();
    } else {
      setCookieConsent("granted");
      initializePosthog();
    }
  } catch (error) {
    console.error("Error checking geolocation:", error);
  }
}

function initialize() {
  const cookieConsent = getCookieConsent();

  if (cookieConsent === "granted") {
    initializePosthog();
  } else if (cookieConsent === "pending-eu") {
    createCookieConsentBanner();
  } else {
    checkGeolocation();
  }
}

initialize();

/* Mintlify positions the fixed #sidebar with an inline `top` computed in a
   window "scroll" listener (handleFooterAndSidebarScrollTop): when the footer
   enters the viewport it shifts the sidebar up (negative top) to clear it, and
   nothing but another scroll event ever recomputes it. If the page height
   changes after a measurement (the /introduction body is client-rendered, so
   the pre-hydration page is short with the footer in view), the sidebar is
   left stuck above the viewport. style.css reserves min-height:100vh on
   #content so that short state can't be painted or measured in the first
   place; this watcher is a backstop for residual cases (e.g. the browser
   clamping a restored scroll position against the not-yet-grown page). Heal by
   re-running Mintlify's own listener with a synthetic scroll event: no actual
   scrolling, so nothing visibly moves - and unlike the old 1px scroll nudge it
   also works when the page is too short to scroll at all, which is exactly the
   state the bug is born in. */
function sidebarLooksBroken() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return false;
  const top = parseFloat(sidebar.style.top);
  if (!(top < 0)) return false;
  // Negative top is legitimate while the footer is in (or near) view; broken
  // is negative top with the footer nowhere near the viewport.
  const footer = document.getElementById("footer");
  if (!footer) return true;
  return footer.getBoundingClientRect().top > window.innerHeight + 200;
}

function watchSidebar() {
  let watchedSidebar = null;
  // cap repairs per page as a guard against fighting a future Mintlify version
  let repairs = 0;
  const repair = () => {
    if (repairs++ < 10) window.dispatchEvent(new Event("scroll"));
  };

  const styleObserver = new MutationObserver(() => {
    if (sidebarLooksBroken()) repair();
  });

  const attach = () => {
    // React can recreate #sidebar across SPA navs; re-attach when it changes
    const sidebar = document.getElementById("sidebar");
    if (sidebar && sidebar !== watchedSidebar) {
      watchedSidebar = sidebar;
      styleObserver.disconnect();
      styleObserver.observe(sidebar, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
    if (sidebarLooksBroken()) repair();
  };

  new MutationObserver(() => {
    repairs = 0;
    attach();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-current-path"],
  });

  window.addEventListener("load", attach);
  attach();
}

watchSidebar();

function createCookieConsentBanner() {
  if (document.getElementById("cookie-consent-banner")) return;

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
    setCookieConsent("granted");
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
