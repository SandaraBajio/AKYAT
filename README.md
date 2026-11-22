# Akyat

Guided-hike booking app for Batangas. React Native (Expo) + Firebase + PayMongo.
Dark green mobile app: book a licensed guide, **record your hike Strava-style**, share moments like Instagram, rate trails and guides, and compete with friends.

```
akyat/
├── functions/   Backend: payments, guide dispatch, reminders, profile stats   [done, 18 tests]
├── mobile/      The app (Expo Router + services layer)                          [full UI, mock data]
├── firestore.rules          Who can read/write what (server-only: bookings, guide counters, profile stats)
├── firestore.indexes.json
└── firebase.json
```

## Open it on your iPhone (free, 5 minutes)

1. Install **Node 24 or newer** from nodejs.org (Expo SDK 58 needs it). Restart your terminal.
2. On the iPhone, install **Expo Go** from the App Store.
3. On your computer:
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
4. Scan the QR code with the iPhone **Camera** app. It opens in Expo Go.
   - Phone and computer must be on the **same Wi-Fi**. If it can't connect (school or office Wi-Fi often blocks it), run `npx expo start --tunnel` instead.
   - Windows firewall may ask for permission the first time. Allow it on private networks.

With no Firebase keys the app runs in **mock mode**: sign in with any email and password and everything works with fake data.
Quickest desktop preview: `npm run web`.

### What works on the iPhone in Expo Go, and what doesn't

| Works | Needs more than Expo Go |
|---|---|
| Everything in the UI, mock data, photo picker for posts and stories | **Recording with the screen locked** (background GPS) needs a development build |
| Foreground GPS recording, live compass heading, satellite map | **Push notifications** need a development build and Apple push setup |
| Demo mode (a simulated walk, for trying the recorder at your desk) | **Standalone app / TestFlight / App Store** needs a paid Apple Developer account (US$99/year) |

Honest status: the GPS tracking math is unit-tested (`npm test`), and the screens were walked through in a browser, but the **native map, GPS and compass have not been tried on a real phone yet**. Test a short real walk early and tell the team what you see.

## The app

| Tab | What is there |
|---|---|
| **Home** | Greeting, search, difficulty chips, trail carousel, next booked hike, weekly goal ring, top guides |
| **Explore** | Search and filters, trail list |
| **Record** (centre button) | Pick a trail or free hike, start. Live map, time, distance, pace, climb, compass, pause/resume/finish. Summary with elevation chart: save, share to Community, rate |
| **Community** | Stories row, posts with likes and comments, create a post or a 24 h story with a photo |
| **Profile** | Level and XP, totals, weekly goal, badges, friends, leaderboard rank, recent hikes, bookings, saved trails |

Also: trail detail (Details / Map / Reviews / Photos), booking and PayMongo checkout flow, rate a trail and its guide (stars, tags, comment), guide profile, follow people, weekly leaderboard.

**Emergency alert:** the button on the live hike screen is a placeholder. It tells the hiker plainly that nothing was sent. The Cloud Function that texts the guide and barangay responders is not written yet (`safetyService` in `mobile/src/services/contracts.ts`). Do not demo it as working.

## Adding your photos

Every photo slot shows a green "Add photo" placeholder until you give it an image.

1. Copy pictures into `mobile/assets/trails/` (for example `mt-maculot.jpg`).
2. Register them in `mobile/src/data/trailImages.ts`. The key is the trail id (`mt-maculot`, `mt-batulao`, `taal-view`). The first image is the cover; the rest fill the Photos tab.

Post and story photos come from the phone's photo library. In Firebase mode they still need Cloud Storage upload (see the TODO in `services/firebase.ts`).

## Run against the real backend (local emulators)

```bash
# terminal 1
cd functions && npm install && npm run serve        # auth, firestore, functions emulators
# terminal 2
cd functions && npm run seed:emulator               # trails, guides, demo hikers, posts, stories
# terminal 3
cd mobile && cp .env.example .env
```

Edit `mobile/.env`: your Firebase web-app keys in `EXPO_PUBLIC_FIREBASE_*`, `EXPO_PUBLIC_USE_EMULATOR=true`, and `EXPO_PUBLIC_EMULATOR_HOST` (`localhost` for web, **your computer's Wi-Fi IP for a real iPhone**). The PayMongo checkout needs `PAYMONGO_SECRET_KEY` (see `functions/README.md`).

`firestore.rules` and the new Firebase-mode social services (posts, stories, follows) were written but **not run against the emulator yet**. Expect a few fixes.

## How the pieces connect

```
Screens (mobile/app/*)  ──import only from──►  mobile/src/services/index.ts
                                                   ├── mock.ts      (default without keys)
                                                   └── firebase.ts  (Auth / Firestore / Cloud Functions)
                                                            │
                                                            ▼
                                              functions/src (checkout, webhook, dispatch, onActivityCreated)
```

**Rule for everyone:** screens never call Firebase directly. Add what you need to `services/contracts.ts`, implement it in `mock.ts` and `firebase.ts`, then use it from a screen.

`mobile/src/types.ts` is copied from `functions/src/types.ts`. After changing backend types run `npm run sync-types` in `mobile/`.

## Where things are (UI teammates)

- Colours, fonts, spacing: `mobile/src/theme.ts` (palette `#051F20 #0B2B26 #163832 #235347 #8EB69B #DAF1DE`, Outfit font).
- Reusable pieces: `mobile/src/components/` (TrailCard, PostCard, Compass, RouteMap, RingProgress, Stars, FloatingTabBar...).
- Live hike state and GPS: `mobile/src/state/hike.ts`; the maths is in `mobile/src/lib/tracking.ts` with tests.
- Screens: `mobile/app/` (file name = route).

## Ideas for next

Photo upload to Cloud Storage, real trail data and photos, guide and barangay dashboards, push reminders, offline trail maps, group hikes with live friend locations, achievements feed, weekly goal setting, Google/Apple sign-in, emergency alert Cloud Function.

## Checks

```bash
cd mobile && npx tsc --noEmit && npm test      # 16 tests
cd functions && npx tsc --noEmit && npm test    # 18 tests
```
