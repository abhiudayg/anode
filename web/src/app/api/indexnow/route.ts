import { NextResponse } from "next/server";

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
  `https://${HOST}/llms.txt`,
  `https://${HOST}/llms-full.txt`
];

export async function GET() {
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: URL_LIST
  };

  const results: Record<string, number> = {};

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
      results[endpoint] = res.status;
    } catch (err: any) {
      results[endpoint] = 500;
    }
  }

  return NextResponse.json({
    success: true,
    submitted_urls: URL_LIST.length,
    results
  });
}

export async function POST() {
  return GET();
}
