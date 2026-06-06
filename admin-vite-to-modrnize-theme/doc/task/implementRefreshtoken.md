I have completed all the tasks for implementing the token verification and refresh logic.

### Summary of what was done:
- [x] **New Response Models**: Updated `src/features/auth/types/auth.ts` to include `RefreshTokenRequest` and updated `AuthResponseData` to make `user` info optional for refresh responses.
- [x] **Enhanced Auth Service**: Added `verifyToken` (GET) and `refreshToken` (POST) to `src/lib/auth/api/auth.service.ts`.
- [x] **Updated Redux State**: Modified `src/features/auth/authSlice.ts` to support `refreshToken` and handle state initialization from `localStorage`.
- [x] **Session Manager**: Created `src/app/providers/SessionManager.tsx` to handle the verification logic on app startup.
- [x] **Integration**: Integrated the `SessionManager` in `src/app/providers/index.tsx` and updated `Login.tsx` to sync with the new Redux state.

You can find the full details in the [walkthrough.md](file:///C:/Users/ASAD/.gemini/antigravity/brain/86341bff-5f9a-4d2a-9eba-2497b07477a4/walkthrough.md) artifact.

Everything is ready! Let me know if there's anything else you'd like to adjust.