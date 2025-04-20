import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NWS_API_BASE } from "../constants/index.js";
import { formatAlert, makeNWSrequest } from "../utils/index.js";
import type { IAlertsResponse } from "../types/index.js";

export class WeatherTool {
  constructor(private readonly server: McpServer) {
    this.server = server;
    this.registerTool();
  }

  private registerTool() {
    this.server.tool(
      "get-alerts",
      "Get weather alerts for a state",
      {
        state: z
          .string()
          .length(2)
          .describe("Two letter state code (e.g. CA, NY)"),
      },
      async ({ state }) => {
        const stateCode = state.toUpperCase();
        const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
        const alertsData = await makeNWSrequest<IAlertsResponse>(alertsUrl);

        if (!alertsData) {
          return {
            content: [
              {
                type: "text",
                text: "Failed to retrive alerts data",
              },
            ],
          };
        }

        const features = alertsData.features || [];

        if (features.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No active alerts for ${stateCode}`,
              },
            ],
          };
        }

        const formattedAlerts = features.map(formatAlert);
        const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join(
          "\n"
        )}`;

        return {
          content: [
            {
              type: "text",
              text: alertsText,
            },
          ],
        };
      }
    );
  }
}
