# Single image for the whole monorepo; compose overrides the command per app.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build:all   # nest build <app> for every app — webpack-bundles each into dist/apps/<app>/main.js

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# ffmpeg binary for the transcoder app's thumbnail generation (fluent-ffmpeg
# shells out to it — the npm package alone is just a wrapper, not a binary).
RUN apk add --no-cache ffmpeg
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
# TS source + root configs — needed to run ts-node-based one-off scripts
# (migrations, promote-admin, seed:*) inside the deployed container, not just
# in dev. The webpack-bundled dist/ above is still what actually serves
# traffic; this is only for `docker compose run --rm <service> npm run ...`.
COPY --from=build /app/apps ./apps
COPY --from=build /app/libs ./libs
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/tsconfig.build.json ./
# default; compose sets a concrete `command:` per service
CMD ["node", "dist/apps/gateway/main.js"]
