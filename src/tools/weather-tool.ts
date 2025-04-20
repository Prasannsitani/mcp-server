import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { NWS_API_BASE } from "../constants/index.js";
import { formatAlert, formatForcast, makeNWSrequest } from "../utils/index.js";
import type {
  IForecastResponse,
  IPointsResponse,
  IAlertsResponse,
} from "../types/index.js";

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

    this.server.tool(
      "get-forcasts",
      "Get weather forcasts for a location",
      {
        latitude: z
          .number()
          .min(-90)
          .max(90)
          .describe("Latitude of the location"),
        longitude: z
          .number()
          .min(-180)
          .max(180)
          .describe("Longitude of the location"),
      },
      async ({ latitude, longitude }) => {
        const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(
          4
        )},${longitude.toFixed(4)}`;
        const pointsData = await makeNWSrequest<IPointsResponse>(pointsUrl);

        if (!pointsData) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to retrieve grid points data for coordinates : ${latitude}, ${longitude}`,
              },
            ],
          };
        }

        const forcastUrl = pointsData.properties.forecast;

        if (!forcastUrl) {
          return {
            content: [
              {
                type: "text",
                text: "Failed to get forecast URL from grid point data",
              },
            ],
          };
        }

        const forecastData = await makeNWSrequest<IForecastResponse>(
          forcastUrl
        );

        if (!forecastData) {
          return {
            content: [
              {
                type: "text",
                text: "Failed to retrieve forecast data",
              },
            ],
          };
        }

        const periods = forecastData.properties?.periods || [];
        if (periods.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No forecast periods available",
              },
            ],
          };
        }

        // Format forecast periods
        const formattedForecast = periods.map(formatForcast);

        const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join(
          "\n"
        )}`;

        return {
          content: [
            {
              type: "text",
              text: forecastText,
            },
          ],
        };
      }
    );
  }
}
