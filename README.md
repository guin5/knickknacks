# Knickknacks

Open `index.html` in a browser, or serve this directory with a static web server.
The checked-in `js/app.bundle.js` supports both ways of opening the site.
File conversion and PDF tools load their third-party libraries on demand and
require an internet connection.

## Updating JavaScript

Edit the source modules in `js/`, then rebuild the browser bundle:

```sh
npm install
npm run build
```

Include the updated `js/app.bundle.js` when publishing source changes. The bundle
keeps tool initialization lazy while avoiding local-file module restrictions.
