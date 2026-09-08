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
