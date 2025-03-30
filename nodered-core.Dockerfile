FROM nodered/node-red
USER root

RUN npm install --unsafe-perm --no-update-notifier --no-fund
RUN npm install @node-red-contrib-themes/midnight-red
RUN npm ci node-binance-api
RUN npm install node-red-contrib-filter
RUN npm install node-red-contrib-redis

RUN npm install node-red-node-ui-table
RUN npm install node-red-contrib-memory-queue
RUN npm install node-red-contrib-simple-message-queue
RUN npm install @flowfuse/node-red-dashboard
RUN npm install @flowfuse/node-red-dashboard-2-ui-led

WORKDIR /usr/src/node-red
