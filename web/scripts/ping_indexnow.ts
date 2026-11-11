const INDEXNOW_KEY = "8f3e2a1b9c4d05e678912345abcdef01";
const HOST = "anode.abhiudayg.dev";
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

const URL_LIST = [
  `https://${HOST}/`,
  `https://${HOST}/vs/docker-compose`,
  `https://${HOST}/vs/systemd`,
  `https://${HOST}/guides/deploy-go-without-docker`,
  `https://${HOST}/guides/deploy-go-postgres-vps`,
  `https://${HOST}/guides/deploy-gin-without-docker`,
  `https://${HOST}/guides/deploy-chi-without-docker`,
  `https://${HOST}/guides/deploy-fiber-without-docker`,
  `https://${HOST}/deploy/hetzner-vps`,
  `https://${HOST}/deploy/digitalocean-droplet`,
  `https://${HOST}/tools/compose-to-systemd`,
  `https://${HOST}/docs`,
  `https://${HOST}/blog`,
  `https://${HOST}/blog/why-we-ditched-docker-for-go-backends`,
  `https://${HOST}/blog/inside-the-ssa-compiler-core`,
  `https://${HOST}/blog/ephemeral-loopback-proxies-zero-port-collisions`,
  `https://${HOST}/blog/stress-testing-10-famous-go-backends`,
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`
];

async function submitIndexNow() {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: URL_LIST
  };

  console.log(`Submitting ${URL_LIST.length} URLs to IndexNow...`);

  const endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow"
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      console.log(`[IndexNow] ${endpoint} -> Status: ${res.status} (${res.statusText || 'OK'})`);
    } catch (err: any) {
      console.error(`[IndexNow Error] Failed at ${endpoint}:`, err.message);
    }
  }
}

submitIndexNow();
