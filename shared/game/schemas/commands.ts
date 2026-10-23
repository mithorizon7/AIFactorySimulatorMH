import { z } from "zod";
import { Era } from "../domain/era";
import { COMMAND_SCHEMA_VERSION } from "../../version";

const commandBase = {
  id: z.string().uuid(),
  tick: z.number().int().nonnegative(),
  commandSchemaVersion: z.literal(COMMAND_SCHEMA_VERSION),
};

const emptyPayload = z.object({}).strict();
const emptyCommand = <T extends string>(type: T) =>
  z
    .object({ ...commandBase, type: z.literal(type), payload: emptyPayload })
    .strict();

export const gameCommandSchema = z.discriminatedUnion("type", [
  emptyCommand("START_RUN"),
  emptyCommand("PAUSE_RUN"),
  emptyCommand("RESUME_RUN"),
  emptyCommand("INVEST_COMPUTE"),
  emptyCommand("INVEST_ELECTRICITY"),
  emptyCommand("INVEST_HARDWARE"),
  emptyCommand("INVEST_REGULATION"),
  emptyCommand("INVEST_DATA_QUALITY"),
  emptyCommand("INVEST_DATA_QUANTITY"),
  emptyCommand("INVEST_DATA_FORMATS"),
  emptyCommand("INVEST_ALGORITHM_ARCHITECTURE"),
  emptyCommand("HIRE_RESEARCH_ENGINEER"),
  emptyCommand("BUILD_API_PLATFORM"),
  emptyCommand("BUILD_CHATBOT_PLATFORM"),
  emptyCommand("TOGGLE_API_SERVICE"),
  emptyCommand("TOGGLE_CHATBOT_SERVICE"),
  z
    .object({
      ...commandBase,
      type: z.literal("SET_MONTHLY_FEE"),
      payload: z.object({ fee: z.number().finite().min(5).max(25) }).strict(),
    })
    .strict(),
  emptyCommand("UPGRADE_DEVELOPER_TOOLS"),
  emptyCommand("UPGRADE_CHATBOT"),
  emptyCommand("RUN_MARKETING_CAMPAIGN"),
  z
    .object({
      ...commandBase,
      type: z.literal("START_TRAINING"),
      payload: z.object({ targetEra: z.nativeEnum(Era) }).strict(),
    })
    .strict(),
]);

export type GameCommand = z.infer<typeof gameCommandSchema>;
export type GameCommandType = GameCommand["type"];

export function parseGameCommand(input: unknown): GameCommand {
  return gameCommandSchema.parse(input);
}
