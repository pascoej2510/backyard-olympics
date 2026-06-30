BACKYARD OLYMPICS V2

WHAT THIS IS
A polished web scoreboard for 8 teams and multiple yard games:
- TV leaderboard view
- Admin control center
- Captain iPhone score-entry links
- Cornhole, Can Jam, Ladder Ball, Bottle Bash, Flip Cup, Beer Pong

FILES TO UPLOAD TO GITHUB PAGES
Upload these 4 files to your GitHub Pages repo:
- index.html
- styles.css
- app.js
- config.js

BASIC LINKS
TV display:
https://YOURUSERNAME.github.io/YOURREPO/?view=tv

Admin panel:
https://YOURUSERNAME.github.io/YOURREPO/?view=admin

Captain links:
https://YOURUSERNAME.github.io/YOURREPO/?view=captain&team=t0
https://YOURUSERNAME.github.io/YOURREPO/?view=captain&team=t1
https://YOURUSERNAME.github.io/YOURREPO/?view=captain&team=t2
https://YOURUSERNAME.github.io/YOURREPO/?view=captain&team=t3
https://YOURUSERNAME.github.io/YOURREPO/?view=captain&team=t4
https://YOURUSERNAME.github.io/YOURREPO/?view=captain&team=t5
https://YOURUSERNAME.github.io/YOURREPO/?view=captain&team=t6
https://YOURUSERNAME.github.io/YOURREPO/?view=captain&team=t7

IMPORTANT
Without Firebase, this works as a single-device demo only because browser storage does not sync across different iPhones.
For live multi-device scoring, add Firebase Realtime Database config to config.js.

FIREBASE SETUP SUMMARY
1. Go to Firebase Console.
2. Create a free project.
3. Add a Web App.
4. Enable Realtime Database.
5. Copy the Firebase config into config.js like this:

window.FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

6. Publish the files to GitHub Pages.
7. Open the TV view on your TV and captain links on iPhones.

NEXT UPGRADES
- QR code page
- Password-protected admin
- Better animations
- Score correction controls
- Team logos/photos
