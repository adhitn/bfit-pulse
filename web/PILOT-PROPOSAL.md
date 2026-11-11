# BFit Pulse · UCLA proposal

**Concept:** a dedicated mobile-friendly site that makes UCLA’s publicly provided BFit zone counts easy to check, with optional community observations kept separate.

**Status:** independent functioning prototype, November 2026. No UCLA endorsement. Real counts are read from the public Connect2 widget linked by UCLA Recreation; there are no sample attendance figures or prediction charts in the current interface.

## The student need

A student on the Hill may have only 45 minutes to exercise. They need a fast way to check BFit’s reported crowd levels and see how recent each zone’s count is before making the trip.

An illustrative persona is Alex, an undergraduate living on the Hill with time to lift between class and dinner. Their main question is: “Is it worth going now, and what do the different zones look like?” This persona is a design hypothesis, not completed user research.

## Existing source and the product

UCLA’s [official BFit page](https://recreation.ucla.edu/facilities/bfit) already links to Live Facility Counts. BFit Pulse reads the same public Connect2 feed and presents the five BFit zone names, last counts, listed capacities, percentages, and source timestamps in a dedicated mobile interface.

The app checks every 15 seconds while visible and when users return to the tab. A 15-second shared cache reduces provider requests. Updates normally appear within about 30 seconds of becoming available, plus network delays; there is no provider push subscription. Source timestamps and app check times are displayed separately. Provider outages use a labeled last-successful snapshot; missing data is never replaced with sample counts.

Totals sum reported open-zone counts and listed capacities, not a deduplicated turnstile total or a verified building occupancy limit. Source timestamps omit time zones; the app interprets them as Pacific time and discloses that assumption. Validate semantics and time-zone interpretation with UCLA/Connect2 before an official launch.

## Optional observations

A collapsed secondary section lets signed-in users share how the gym feels. Observations expire from view after 30 minutes and never change the provider’s count values. On-site confirmation is self-reported; affiliation and location are not independently verified. No public names, photos, or GPS tracking are used.

## Proposed four-week pilot

| Week | Activity | Evidence |
| --- | --- | --- |
| 1 | Interview students and staff; confirm source semantics, time zone, and provider permission expectations | Demand, data interpretation, accessibility needs |
| 2 | Small approved mobile usability trial | Task success, freshness clarity, layout issues |
| 3 | Compare displayed values and update delays against the original source | Data agreement, availability, update lag |
| 4 | Review adoption and usefulness; decide next steps | Repeat use, student feedback, support effort |

Agree numeric targets with UCLA before beginning. Proposed measures include agreement with the source, successful refresh rate, source age, repeat weekly usage, and student-rated usefulness.

## UCLA partnership

An official version would need a Recreation stakeholder, coordination with the count provider and campus IT, accessibility review, confirmation of data semantics and retention expectations, and permission for UCLA branding if desired. There is no direct BruinCard, UCLA SSO, gym sensor, native App Store, or push-notification integration.

## Demo

Open the Live Counts page and compare all five values and timestamps with the original widget. Show the app’s separate automatic check time. Explain the older-update and provider-failure states. Expand the optional observations section only if useful; the primary product is the dedicated count view.
