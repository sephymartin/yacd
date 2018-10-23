import {
  getAPIConfig,
  genCommonHeaders,
  getAPIBaseURL
} from 'm/request-helper';
const endpoint = '/logs';
const textDecoder = new TextDecoder('utf-8', { stream: true });

function getURLAndInit() {
  const c = getAPIConfig();
  const baseURL = getAPIBaseURL(c);
  const headers = genCommonHeaders(c);
  return {
    url: baseURL + endpoint,
    init: { headers }
  };
}

const Size = 300;

let even = false;
const store = {
  logs: [],
  size: Size,
  updateCallback: null,
  appendData(o) {
    const now = new Date();
    const time = now.toLocaleString('zh-Hans');
    // mutate input param in place intentionally
    o.time = time;
    o.id = now - 0;
    o.even = even = !even;
    this.logs.unshift(o);
    if (this.logs.length > this.size) this.logs.pop();
    // TODO consider throttle this
    if (this.updateCallback) this.updateCallback();
  }
};

function pump(reader) {
  return reader.read().then(({ done, value }) => {
    if (done) {
      console.log('done');
      return;
    }
    const t = textDecoder.decode(value);
    const arrRawJSON = t.trim().split('\n');
    arrRawJSON.forEach(s => {
      try {
        store.appendData(JSON.parse(s));
      } catch (err) {
        console.log('JSON.parse error', JSON.parse(s));
      }
    });
    return pump(reader);
  });
}

let fetched = false;
function fetchLogs() {
  if (fetched) return store;
  const { url, init } = getURLAndInit();
  fetch(url, init).then(response => {
    fetched = true;
    const reader = response.body.getReader();
    pump(reader);
  });
  return store;
}

export { fetchLogs };