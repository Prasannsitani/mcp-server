export interface IAlertsFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    status?: string;
    headline?: string;
  };
}

export interface IAlertsResponse {
  features: IAlertsFeature[];
}

export interface IForecastPeriod {
  name?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
}

export interface IPointsResponse {
  properties: {
    forecast?: string;
  };
}

export interface IForecastResponse {
  properties: {
    periods: IForecastPeriod[];
  };
}
