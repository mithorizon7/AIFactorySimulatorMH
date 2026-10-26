import type { LearningClaim as Claim } from "@/lib/learningContent";
import { sourceTitle } from "@/lib/learningContent";

export default function LearningClaim({ claim }: { claim: Claim }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      <p className="text-gray-200">{claim.text}</p>
      <p className="text-xs text-teal-200">{claim.uncertaintyLabel}</p>
      <details className="text-xs text-gray-300">
        <summary className="min-h-11 cursor-pointer py-3 text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-300">
          Sources and review
        </summary>
        <p className="mt-2">
          Claim type: {claim.claimType} · Reviewed {claim.reviewedAt}
        </p>
        {claim.sourceUrls.length ? (
          <ul className="mt-2 space-y-2 break-words">
            {claim.sourceUrls.map((url) => (
              <li key={url}>
                <a
                  className="inline-flex min-h-11 min-w-11 items-center break-words py-2 underline underline-offset-2 hover:text-white"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {sourceTitle(url)}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">
            In-simulation explanation, not external evidence.
          </p>
        )}
        <p className="mt-2 break-words">
          Linked mechanics: {claim.linkedMechanics.join(", ")}
        </p>
      </details>
    </div>
  );
}
