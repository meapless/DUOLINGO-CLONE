# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Lingua Expo app. The SDK was already installed; the integration adds autocapture configuration, a `UserTracker` component for robust user identification via Clerk user IDs, and `posthog.capture()` calls across all key user flows — onboarding, authentication, language selection, home screen engagement, and sign-out. Users are identified on every app load when a Clerk session is active, ensuring returning-visitor events are linked to the correct person.

| Event | Description | File |
|---|---|---|
| `onboarding_get_started` | User taps the 'Get Started' button on the onboarding screen. | `src/app/onboarding.tsx` |
| `user_signed_up` | User successfully completes email sign-up and email verification. | `src/app/(auth)/sign-up.tsx` |
| `sign_up_failed` | User encounters an error during the sign-up flow. | `src/app/(auth)/sign-up.tsx` |
| `user_signed_in` | User successfully signs in with email/password or magic code. | `src/app/(auth)/sign-in.tsx` |
| `magic_code_requested` | User requests a passwordless magic-code email instead of password sign-in. | `src/app/(auth)/sign-in.tsx` |
| `language_selected` | User confirms their language choice on the language selection screen. | `src/app/language-select.tsx` |
| `lesson_continued` | User taps the 'Continue' button on the home screen to resume their current lesson. | `src/app/(tabs)/home.tsx` |
| `plan_item_tapped` | User taps an item in the 'Today's plan' list on the home screen. | `src/app/(tabs)/home.tsx` |
| `user_signed_out` | User taps Sign Out on the profile screen. | `src/app/(tabs)/profile.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://eu.posthog.com/project/202162/dashboard/757317)
- [Onboarding to Language Selection Funnel](https://eu.posthog.com/project/202162/insights/81Xhlzrd)
- [Daily Sign-ins](https://eu.posthog.com/project/202162/insights/ydQPFnDK)
- [Language Popularity](https://eu.posthog.com/project/202162/insights/mzHNpmy0)
- [Lesson Engagement](https://eu.posthog.com/project/202162/insights/9XfPmDlO)
- [Churn Signal: Sign-outs](https://eu.posthog.com/project/202162/insights/koK5U7Fx)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `EXPO_PUBLIC_POSTHOG_API_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Confirm the returning-visitor path also calls `identify` — the `UserTracker` component in `_layout.tsx` handles this on every app load when a Clerk session is active, but verify it fires correctly for users who were already signed in before the integration was added.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
