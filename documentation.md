# Google Calendar/Boostlingo extension

Welcome! This extension aims to share data from your Boostlingo account back to your Google Calendar.

## Installation

After installing the extension, you should see its icon in the Chrome toolbar, next to the URL bar. (If you do not, you may need to click the puzzle piece to show the extensions list.)

The popup when you click the menu has a form to log in to Boostlingo. Log in is good for 30 days, and once you have, the form will include the date/time at which your log in will expire.

## Information

Currently, 3 types of information are supported:

### Icons.

Each calendar event now has an icon indicating boostlingo status; the icon is also a clickable link to the boostlingo job.

| Status | Icon |
|--------|------|
| No Boostlingo job | ![](/images/sample-meeting-circle.png) |
| No interpreters scheduled yet | ![](/images/sample-meeting-tasks.png) |
| Interpreters scheduled | ![](/images/sample-meeting-interpret.png) |
|  Job completed | ![](/images/sample-meeting-completed.png) |

### Interpreter name(s)
For a calendar event with interpreters, mouse over the icon to see their name(s):

![](/images/sample-meeting-popup.png)

### Optional warnings

Configurable via a checkbox in the extension icon's popup menu.

#### Zoom Link Mismatch Warning
Toggles off and on; defaults to off.

When checked, if the Boostlingo job doesn't contain the same Zoom link as the Google Calendar event, clicking on the event will show a warning:

![](/images/sample-meeting-warning.png)

## Caveats

This extension does not (currently) create or update any data in Boostlingo or Google Calendar; its intended use is "my job created a meeting in Google Calendar, I requested interpreters in Boostlingo, now I see info about both in Google Calendar". (From an interpreter perspective, you'll need to create your own Google Calendar events for each job.)
