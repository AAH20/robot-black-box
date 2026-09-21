FROM node:22.23.0-bookworm-slim

WORKDIR /opt/robot-black-box

COPY package.json package-lock.json ./
COPY packages ./packages
RUN npm ci --ignore-scripts --offline --no-audit --no-fund

COPY scripts ./scripts
COPY examples ./examples
COPY docs ./docs
COPY conformance ./conformance
COPY *.md ./

RUN npm run build:core && npm run conformance

RUN useradd --create-home --uid 10001 rbb \
    && mkdir -p /opt/robot-black-box/.rbb \
    && chown -R rbb:rbb /opt/robot-black-box

USER 10001:10001

CMD ["npm", "run", "demo"]
