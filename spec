This job involves development of a Google Chrome extension. The extension will
coordinate data between a Google Calendar and another site's calendar
information. (We'll call this second site other.com, since it is not yet public
and I'll do the integration against that site later.)

Requirements:
- Must have permissions for both: calendar.google.com, and other.com
- Ui to log in to other.com under popup:
  https://developer.chrome.com/docs/extensions/mv2/user_interface/#popup; takes
a username and password, posts to other.com/api/web/account/signin. Stores
response (will be a jwt) for use in future reqs.
- State of login in badge (empty if logged in, red '?' if jwt is expired)

Google Calendar components:
- a function returning an iterator (array is fine) of every event visible on the page (daily, weekly, etc views)
- function to add a 'badge' to an event - should be a small image in the upper-right
  corner of the event box. Badge must be settable per-event (will be used for a
state machine with 4 states.) Placeholder images are fine. This is _not_ what
  the Google Calendar Event calls a gadget, since that is deprecated.
- API to get/set an event's `extendedProperties.private`
  (https://developers.google.com/calendar/api/v3/reference/events/update). This
is where we'll store the badge's state, in json: `{"state": "on"}`.
- clicking the badge should open a modal with a form. Form shows, and allows you
  to set, the state (in extendedProperties.private) from a dropdown listing the
valid states. This form also updates the badge.
- One of the badge states, 'off', should be set if extendedProperties.private is
  empty (or invalid)
- due to the new CORS enforcement in chrome extensions
  (https://www.chromium.org/Home/chromium-security/extension-content-script-fetches),
the extension must have a background page with an onMessage listener; it can be
a stub that just responds with `{success: true}`.
