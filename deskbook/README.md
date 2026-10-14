# Deskbook

Our office went hybrid. People come in two or three days a week, and the facilities team wants
employees to book a desk for the days they are in, instead of hunting for a free one at 9am.

The frontend is finished and you should not change it. Build the backend it needs.

You have 60 minutes. Talk through your decisions as you go.

## Run it

    npm install
    npm start            # http://localhost:3000
    npm run check        # a smoke test of the API the frontend calls

Node 18 or newer. The backend is Express. There is no database yet: `backend/data.js` holds the
office's people and desks in memory.

## What is here

    frontend/            the app people use (do not modify)
    backend/server.js    the Express server, serving the frontend and the API
    backend/data.js      people and desks
    scripts/check.js     the smoke test
    DECISIONS.md         write your assumptions and decisions here

There is no login yet. The frontend sends the signed-in person's id in the `X-User-Id` header.
