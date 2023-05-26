ARG NODE_VERSION
FROM node:${NODE_VERSION}-buster-slim as base

ENV NODE_ENV="development"

ARG WORKING_DIRECTORY=/application
WORKDIR ${WORKING_DIRECTORY}
ENV PATH="/application/bin:$PATH"

RUN \
  apt-get update -qq \
  && apt-get install -y --no-install-recommends \
    curl \
    apt-transport-https \
    ca-certificates \
    dumb-init \
  && apt-get clean \
  && rm -rf /var/cache/apt/archives/* /var/lib/apt/lists/* /tmp/* /var/tmp/* \
  && truncate -s 0 /var/log/*log

FROM base AS install

ARG WORKING_DIRECTORY=/application
WORKDIR ${WORKING_DIRECTORY}

COPY package.json package-lock.json tsconfig.json ./
RUN npm ci && npm cache clean --force
RUN npm prune
COPY src ./src

FROM base

ARG WORKING_DIRECTORY=/application
WORKDIR ${WORKING_DIRECTORY}

ENV USERNAME=app
ENV UID=10001
ENV GID=10001
RUN groupadd -g ${GID} -o ${USERNAME} && useradd --create-home -u ${UID} -g ${GID} --shell /sbin/nologin ${USERNAME} && \
  chown -R ${USERNAME} ./
USER ${USERNAME}

COPY --chown=${USERNAME} --from=install ${WORKING_DIRECTORY}/node_modules ./node_modules/
COPY --chown=${USERNAME} --from=install ${WORKING_DIRECTORY}/src ./@workflow-runner
COPY --chown=${USERNAME} package.json ./

EXPOSE 3333

# Start server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--require", "esbuild-register", "./@workflow-runner/app"]
