import Link from "next/link";

type Props = {
  framework: string;
  routesDetected: boolean;
  className?: string;
};

// Shown on guides so a reader sees what the analyzer covers before following the steps.
export function LimitationsCallout({ framework, routesDetected, className = "" }: Props) {
  return (
    <aside className={`rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-5 text-sm text-neutral-300 leading-relaxed space-y-2 ${className}`}>
      <p className="font-bold text-amber-300">
        {routesDetected ? `Check the ${framework} routes in your lockfile.` : `The analyzer does not read ${framework} routes.`}
      </p>
      <p>
        {routesDetected
          ? `Route detection covers ${framework}'s basic method calls. Compare anode.lock.json's ingress table with your routes before you deploy.`
          : `Routes registered with ${framework} do not appear in anode.lock.json's ingress table, so Caddy has no public route to them. Check the ingress table after anode inspect. Connections your code opens (database, Redis) are still recognized.`}
      </p>
      <Link href="/limitations" className="inline-block text-amber-300 underline underline-offset-4">
        Full support matrix
      </Link>
    </aside>
  );
}
