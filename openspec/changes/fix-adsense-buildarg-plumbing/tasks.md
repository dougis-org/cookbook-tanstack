## 1. Dockerfile

- [ ] 1.1 Add `ARG VITE_ADSENSE_ENABLED`, `ARG VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `ARG VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `ARG VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, `ARG VITE_GOOGLE_ANALYTICS_ID` in the builder stage, before `RUN npm run build`.
- [ ] 1.2 Re-export each as `ENV NAME=$NAME` immediately after the `ARG` declarations so `npm run build` (Vite) can read them via `process.env`.
- [ ] 1.3 Verify `docker build --build-arg VITE_ADSENSE_ENABLED=true --build-arg VITE_GOOGLE_ADSENSE_TOP_SLOT_ID=1234567890 .` succeeds locally and the resulting client bundle contains the literal string `1234567890` (confirms Vite inlined the value).
- [ ] 1.4 Verify `docker build .` with no build args still succeeds (no regression to the default/unconfigured path).

## 2. GitHub Actions deploy workflow

- [ ] 2.1 Update `.github/workflows/deploy.yml`'s `flyctl deploy` step to append `--build-arg VITE_ADSENSE_ENABLED=${{ vars.VITE_ADSENSE_ENABLED }}` and the equivalent `--build-arg` flags for the other four variables.
- [ ] 2.2 Confirm the values are read via `vars.*` (GitHub Actions repository Variables), not `secrets.*`.

## 3. Repository configuration (manual, outside the PR diff)

- [ ] 3.1 Create the 5 GitHub Actions repository Variables (`Settings → Secrets and variables → Actions → Variables`): `VITE_ADSENSE_ENABLED`, `VITE_GOOGLE_ADSENSE_TOP_SLOT_ID`, `VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID`, `VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID`, `VITE_GOOGLE_ANALYTICS_ID`, with real values from the AdSense/Analytics dashboards.
- [ ] 3.2 Document (in `.env.example` and/or `docs/`) that these five values must be set as Actions repository Variables, not Fly secrets, because Fly secrets never reach the Docker build step.

## 4. Verification

- [ ] 4.1 Merge to `main` and let the PR-merge-triggered `deploy.yml` run complete.
- [ ] 4.2 View source on the live site (`recipe.dougis.com`) and confirm the `adsbygoogle` script tag and `data-ad-slot` attributes are present with the configured slot IDs.
- [ ] 4.3 Confirm the Google Analytics `gtag`/`dataLayer` script loads on the live site.
- [ ] 4.4 Run the existing unit test suite (`npm run test`) to confirm no regressions to `google-adsense.test.ts`, `ad-policy.test.ts`, or `google-adsense-contract.test.ts`.

## 5. Cleanup (optional, out of band)

- [ ] 5.1 Once verified working, run `fly secrets unset VITE_ADSENSE_ENABLED VITE_GOOGLE_ADSENSE_TOP_SLOT_ID VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID VITE_GOOGLE_ANALYTICS_ID` to remove the now-unused runtime secrets.
