import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { GameStateType } from "@/lib/gameState";

interface UnifiedTutorialProps {
  gameState: GameStateType;
  onDismissWelcome: () => void;
  onSkipTutorial: () => void;
}

/** One introduction; the actual tutorial is the playable GNT-2 lab. */
export function UnifiedTutorialSystem({
  gameState,
  onDismissWelcome,
  onSkipTutorial,
}: UnifiedTutorialProps) {
  if (
    !gameState.tutorial.isActive ||
    gameState.tutorial.isCompleted ||
    gameState.tutorial.hasShownWelcome ||
    gameState.clock.activeTick > 0 ||
    gameState.narrativeFlags.totalInvestmentAmount > 0
  )
    return null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onDismissWelcome();
      }}
    >
      <DialogContent
        className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg border-gray-700 bg-gray-900 text-white sm:max-w-xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          document
            .querySelector<HTMLButtonElement>(
              '[data-testid="button-start-game"]',
            )
            ?.focus();
        }}
      >
        <DialogHeader>
          <p className="text-sm font-medium text-teal-300">
            Spark · your lab guide
          </p>
          <DialogTitle className="pr-8 text-2xl text-amber-300">
            Welcome to AI Factory!
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed text-gray-200">
            Run a small AI lab. Invest your seed capital, build services, set
            prices, and reserve enough compute to train your next model.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 rounded-lg border border-teal-800 bg-teal-950/40 p-4 text-sm leading-relaxed">
          <p>
            <strong className="text-teal-200">Your first goal:</strong> prepare
            and complete GNT-3 training. GNT-2 is a hands-on practice era; the
            next goal and usable choices stay visible while you play.
          </p>
          <p className="text-gray-300">
            Plan for a 20–30 minute run. Pause whenever you like. Progress is
            saved privately on this device; closing the tab does not advance
            time.
          </p>
        </div>
        <p className="text-sm leading-relaxed text-gray-300">
          This is a simplified learning simulation, not a forecast. GNT model
          names are fictional, Model Capability is a synthetic game measure, and
          GNT-5–GNT-7 are speculative scenarios.
        </p>
        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onSkipTutorial}
            className="min-h-11 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Skip Tutorial
          </Button>
          <Button
            onClick={onDismissWelcome}
            className="min-h-11 bg-amber-700 text-white hover:bg-amber-800"
          >
            Open my lab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
