import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inspectCommand } from "@shared/game/engine";
import type { GameStateV2 } from "@shared/game/schemas/state";
import type { GameCommandIntent } from "@shared/game/schemas/commands";

export default function EconomicSection({
  simulation,
  onCommand,
}: {
  simulation: GameStateV2;
  onCommand: (intent: GameCommandIntent) => void;
}) {
  const [fee, setFee] = useState(simulation.revenue.monthlyFee);
  const revenue = simulation.revenue;
  const commands: {
    title: string;
    body: string;
    items: { label: string; intent: GameCommandIntent; testId?: string }[];
  }[] = [
    {
      title: "API service",
      body: `${revenue.developers.toLocaleString()} developers · $${revenue.b2b.toLocaleString()}/tick · ${revenue.apiPlatformBuilt ? "Platform built" : "Platform not built"} · ${revenue.apiEnabled ? "Service on" : "Service off"}`,
      items: [
        {
          label: "Build API Platform",
          intent: { type: "BUILD_API_PLATFORM", payload: {} },
          testId: "button-build-api-platform",
        },
        {
          label: revenue.apiEnabled
            ? "Disable API service"
            : "Enable API service",
          intent: { type: "TOGGLE_API_SERVICE", payload: {} },
          testId: "switch-api-service",
        },
        {
          label: "Improve developer tools",
          intent: { type: "UPGRADE_DEVELOPER_TOOLS", payload: {} },
        },
      ],
    },
    {
      title: "Chatbot service",
      body: `${revenue.subscribers.toLocaleString()} subscribers · $${revenue.b2c.toLocaleString()}/tick · ${revenue.chatbotPlatformBuilt ? "Platform built" : "Platform not built"} · ${revenue.chatbotEnabled ? "Service on" : "Service off"}`,
      items: [
        {
          label: "Build Chatbot Platform",
          intent: { type: "BUILD_CHATBOT_PLATFORM", payload: {} },
          testId: "button-build-chatbot-platform",
        },
        {
          label: revenue.chatbotEnabled
            ? "Disable chatbot service"
            : "Enable chatbot service",
          intent: { type: "TOGGLE_CHATBOT_SERVICE", payload: {} },
          testId: "switch-chatbot-service",
        },
        {
          label: "Improve chatbot",
          intent: { type: "UPGRADE_CHATBOT", payload: {} },
        },
        {
          label: "Run advertising campaign",
          intent: { type: "RUN_MARKETING_CAMPAIGN", payload: {} },
        },
      ],
    },
  ];
  const priceIntent: GameCommandIntent = {
    type: "SET_MONTHLY_FEE",
    payload: { fee },
  };
  const priceInspection = inspectCommand(simulation, priceIntent);
  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-5">
        <h2 className="text-2xl font-semibold text-amber-200">
          Financial Dashboard
        </h2>
        <p className="mt-2 text-xl text-teal-200">
          Available Funds: $
          {simulation.money.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          })}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          Build, enable, and price services to earn revenue. Live services share
          compute with training. These are simplified game rules, not business
          forecasts.
        </p>
        <p className="mt-2 text-sm text-gray-300">
          Earned service revenue: $
          {simulation.facts.earnedRevenue.toLocaleString()} · external funding:
          ${simulation.facts.externalFunding.toLocaleString()} · emergency
          funding: ${simulation.facts.emergencyFunding.toLocaleString()}
        </p>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2">
        {commands.map((group) => (
          <section
            key={group.title}
            className="rounded-lg border border-gray-700 bg-gray-900 p-5"
          >
            <h3 className="text-lg font-semibold text-teal-200">
              {group.title}
            </h3>
            <p className="mt-2 text-sm text-gray-300">{group.body}</p>
            <div className="mt-4 space-y-3">
              {group.items.map((action) => {
                const inspection = inspectCommand(simulation, action.intent);
                return (
                  <div key={action.intent.type}>
                    <Button
                      data-testid={action.testId}
                      disabled={!inspection.enabled}
                      onClick={() => onCommand(action.intent)}
                      className="h-auto min-h-11 w-full whitespace-normal bg-teal-800 px-3 py-3 text-white hover:bg-teal-700"
                    >
                      {action.label}
                      {inspection.cost !== null && inspection.cost > 0
                        ? ` · $${inspection.cost.toLocaleString()}`
                        : ""}
                    </Button>
                    {!inspection.enabled && (
                      <p className="mt-1 text-xs text-amber-200">
                        {inspection.reason?.replaceAll("_", " ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <section className="rounded-lg border border-gray-700 bg-gray-900 p-5">
        <h3 className="text-lg font-semibold text-teal-200">Chatbot pricing</h3>
        <p className="mt-2 text-sm text-gray-300">
          In this simulation, price changes revenue and demand. Current fee: $
          {revenue.monthlyFee}. Compare the outcome with your capacity and
          training reserve.
        </p>
        <label
          htmlFor="chatbot-price"
          className="mt-4 block text-sm text-gray-200"
        >
          Monthly subscription fee ($5–$25)
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <input
            id="chatbot-price"
            type="number"
            min={5}
            max={25}
            step={1}
            value={fee}
            onChange={(event) => setFee(Number(event.target.value))}
            className="min-h-11 w-24 rounded border border-gray-600 bg-gray-800 px-3 text-white"
          />
          <Button
            disabled={!priceInspection.enabled || fee === revenue.monthlyFee}
            onClick={() => onCommand(priceIntent)}
            className="min-h-11 bg-teal-800 text-white hover:bg-teal-700"
          >
            Apply monthly fee
          </Button>
        </div>
        {!priceInspection.enabled && (
          <p className="mt-2 text-sm text-amber-200">
            {priceInspection.reason?.replaceAll("_", " ")}
          </p>
        )}
      </section>
    </section>
  );
}
