import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GameStateType } from "@/lib/gameState";
import type { GameTab } from "@shared/experience/schemas";
import type { GameStateV2 } from "@shared/game/schemas/state";
import InvestmentPanel from "./InvestmentPanel";
import EconomicSection from "./EconomicSection";
import SynergyDashboard from "./SynergyDashboard";
import DashboardContent from "./DashboardContent";
import JourneyPanel from "./JourneyPanel";
import { TrainingTab } from "./TrainingTab";
import type { GameCommandIntent } from "@shared/game/schemas/commands";

interface MainGameTabsProps {
  gameState: GameStateType;
  simulation: GameStateV2;
  onCommand: (intent: GameCommandIntent) => void;
  activeTab?: GameTab;
  onActiveTabChange?: (tab: GameTab) => void;
  advanceTutorial?: () => void;
  allocateMoneyToCompute: () => void;
  allocateMoneyToData: () => void;
  allocateMoneyToAlgorithm: () => void;
  allocateMoneyToElectricity: () => void;
  allocateMoneyToHardware: () => void;
  allocateMoneyToRegulations: () => void;
  allocateMoneyToDataQuality: () => void;
  allocateMoneyToDataQuantity: () => void;
  allocateMoneyToDataFormats: () => void;
  allocateMoneyToAlgorithmArchitectures: () => void;
  hireResearchEngineer: () => void;
  toggleApiService: () => void;
  toggleChatbotService: () => void;
  setMonthlyFee: (fee: number) => void;
  improveDeveloperTools?: () => void;
  improveChatbot?: () => void;
  runAdvertisingCampaign?: () => void;
  buildApiPlatform?: () => void;
  buildChatbotPlatform?: () => void;
  trainModel?: () => void;
}

export default function MainGameTabs(props: MainGameTabsProps) {
  const [localTab, setLocalTab] = useState<GameTab>("dashboard");
  const savedTab = props.activeTab ?? localTab;
  // Release A aliases remain valid in durable saves; presentation alone merges them.
  const activeTab =
    savedTab === "breakthroughs" || savedTab === "progression"
      ? "journey"
      : savedTab;
  const setActiveTab = (tab: GameTab) => {
    setLocalTab(tab);
    props.onActiveTabChange?.(tab);
  };
  return (
    <Tabs
      value={activeTab}
      onValueChange={(tab) => setActiveTab(tab as GameTab)}
      className="w-full min-w-0"
    >
      <TabsList
        aria-label="Lab sections"
        className="mb-5 grid h-auto w-full grid-cols-2 gap-2 rounded-lg border border-gray-700 bg-gray-900 p-2 sm:grid-cols-5"
      >
        {(
          [
            ["dashboard", "Dashboard"],
            ["training", "Training"],
            ["resources", "Resources"],
            ["economy", "Economy"],
            ["journey", "Journey"],
          ] as const
        ).map(([tab, label]) => (
          <TabsTrigger
            key={tab}
            value={tab}
            data-tab={tab}
            data-testid={
              tab === "training" ? "training-tab-trigger" : undefined
            }
            className="min-h-11 whitespace-normal rounded-md px-3 py-3 text-sm font-medium text-gray-200 hover:bg-gray-800 data-[state=active]:bg-amber-700 data-[state=active]:text-white"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="dashboard" className="mt-0">
        <DashboardContent
          gameState={props.gameState}
          setActiveTab={setActiveTab}
        />
      </TabsContent>
      <TabsContent value="training" className="mt-0">
        <TrainingTab
          gameState={props.gameState}
          simulation={props.simulation}
          onStartTraining={props.trainModel ?? (() => {})}
        />
      </TabsContent>
      <TabsContent value="resources" className="mt-0 space-y-5">
        <InvestmentPanel
          simulation={props.simulation}
          onCommand={props.onCommand}
        />
        <section aria-label="Resource synergies">
          <h2 className="mb-3 text-lg font-semibold text-teal-200">
            Resource synergies
          </h2>
          <p className="mb-3 text-sm text-gray-300">
            All relationships and values below are simplified in-simulation
            rules, not real-world evidence or a capability forecast.
          </p>
          <SynergyDashboard gameState={props.gameState} />
        </section>
      </TabsContent>
      <TabsContent value="economy" className="mt-0">
        <EconomicSection
          simulation={props.simulation}
          onCommand={props.onCommand}
        />
      </TabsContent>
      <TabsContent value="journey" className="mt-0">
        <JourneyPanel simulation={props.simulation} />
      </TabsContent>
    </Tabs>
  );
}
