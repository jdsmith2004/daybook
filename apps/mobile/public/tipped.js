/* The page a web tip comes back to (apps/mobile/src/lib/tip.ts explains the whole way).
   - ?go=<a Stripe page>: the app opened this page first, in its own browser sheet. It notes that (for this tab only) and
     goes on to the tip page. Only Stripe's own pages are followed.
   - ?session_id=<id>: Stripe sent the person back after paying. If the app opened this tab, the id goes back to the app
     (daybook://tipped); otherwise this is the web app, so the id is kept in this site's storage and Daybook opens again,
     where it is confirmed with the server. The id proves the payment to Daybook's server only; it holds no card details. */
(function () {
  var FROM_APP = 'daybook.tip.app';
  var PENDING = 'daybook.tipped';
  var q = new URLSearchParams(location.search);
  var go = q.get('go');
  var id = q.get('session_id');
  function say(title, msg) {
    if (title) document.getElementById('title').textContent = title;
    document.getElementById('msg').textContent = msg;
  }
  if (go) {
    if (!/^https:\/\/(buy|checkout)\.stripe\.com\//.test(go)) {
      say('Nothing to do here.', 'That is not a Daybook tip page.');
      return;
    }
    try {
      sessionStorage.setItem(FROM_APP, '1');
    } catch (e) {
      /* storage is off: the page will offer a button back instead */
    }
    say('Daybook', 'Opening the tip page…');
    location.replace(go);
    return;
  }
  if (!id || !/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(id)) {
    say('Nothing to do here.', 'This page is where a tip comes back to Daybook.');
    return;
  }
  var app = false;
  try {
    app = sessionStorage.getItem(FROM_APP) === '1';
    sessionStorage.removeItem(FROM_APP);
  } catch (e) {
    app = false;
  }
  var back = document.getElementById('back');
  if (app) {
    var to = 'daybook://tipped?session_id=' + encodeURIComponent(id);
    back.href = to;
    location.replace(to);
    return;
  }
  try {
    localStorage.setItem(PENDING, id);
  } catch (e) {
    /* the address below carries it too */
  }
  var web = './tipped?session_id=' + encodeURIComponent(id);
  back.href = web;
  location.replace(web);
})();
