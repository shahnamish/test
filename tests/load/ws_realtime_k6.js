import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

export const options = {
  vus: Number(__ENV.WS_VUS || 25),
  duration: __ENV.WS_DURATION || '1m',
  thresholds: {
    ws_connection_failures: ['count==0'],
    ws_messages_received: ['count>0'],
  },
};

const connectionFailures = new Counter('ws_connection_failures');
const messagesReceived = new Counter('ws_messages_received');
const messageLatency = new Trend('ws_message_latency', true);

const baseURL = __ENV.WS_URL || 'ws://localhost:8080/ws';
const token = __ENV.WS_TOKEN;
const subscribeChannels = (__ENV.WS_CHANNELS || 'lines,order_book,analytics')
  .split(',')
  .map((channel) => channel.trim())
  .filter((channel) => channel.length > 0);

if (!token) {
  throw new Error('WS_TOKEN environment variable is required to authenticate load test connections');
}

export default function () {
  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  let connectedAt = Date.now();
  const response = ws.connect(baseURL, params, function (socket) {
    socket.on('open', function () {
      connectedAt = Date.now();
      socket.send(
        JSON.stringify({
          type: 'subscribe',
          channels: subscribeChannels,
        }),
      );
    });

    socket.on('message', function (data) {
      messagesReceived.add(1);
      messageLatency.add(Date.now() - connectedAt);
    });

    socket.on('close', function () {
      sleep(1);
    });

    socket.on('error', function () {
      connectionFailures.add(1);
    });

    socket.setTimeout(function () {
      socket.send(JSON.stringify({ type: 'ping' }));
    }, 1000);

    socket.setInterval(function () {
      socket.send(JSON.stringify({ type: 'ping' }));
    }, 10000);

    socket.setTimeout(function () {
      socket.close();
    }, Number(__ENV.WS_SESSION_LENGTH || 15000));
  });

  check(response, {
    'connection established': (res) => res && res.status === 101,
  }) || connectionFailures.add(1);
}
