interface AttomConfig {
  apiKey: string;
  baseUrl: string;
}

interface AttomPropertyDetailResponse {
  status: {
    version: string;
    code: number;
    msg: string;
    total: number;
  };
  property: Array<{
    identifier?: {
      Id?: number;
      fips?: string;
      apn?: string;
    };
    lot?: {
      lotSize1?: number;
      lotSize2?: number;
    };
    area?: {
      blockNum?: string;
      countrySecSubd?: string;
      countyUse1?: string;
      munCode?: string;
      munName?: string;
      srvyRange?: string;
      srvySection?: string;
      srvyTownship?: string;
      taxCodeArea?: string;
    };
    address?: {
      country?: string;
      countrySubd?: string;
      line1?: string;
      line2?: string;
      locality?: string;
      matchCode?: string;
      oneLine?: string;
      postal1?: string;
      postal2?: string;
      postal3?: string;
    };
    location?: {
      accuracy?: string;
      elevation?: number;
      latitude?: number;
      longitude?: number;
      distance?: number;
      geoid?: string;
    };
    summary?: {
      absenteeInd?: string;
      propClass?: string;
      propSubType?: string;
      propType?: string;
      yearBuilt?: number;
      propLandUse?: string;
      propIndicator?: string;
    };
    utilities?: {
      coolingType?: string;
      heatingFuel?: string;
      heatingType?: string;
    };
    building?: {
      size?: {
        bldgSize?: number;
        grossSize?: number;
        grossSizeAdjusted?: number;
        groundFloorSize?: number;
        livingSize?: number;
        sizeInd?: string;
        universalSize?: number;
      };
      rooms?: {
        bathFixtures?: number;
        bathsFull?: number;
        bathsHalf?: number;
        bathsTotal?: number;
        beds?: number;
        roomsTotal?: number;
      };
      interior?: {
        bsmtSize?: number;
        bsmtType?: string;
        fplcCount?: number;
        fplcInd?: string;
        fplcType?: string;
      };
      construction?: {
        conditionStndCode?: string;
        constructionType?: string;
        exteriorWallType?: string;
        foundationType?: string;
        frameType?: string;
        roofCover?: string;
        roofShape?: string;
        wallType?: string;
      };
      parking?: {
        garageType?: string;
        garageSqft?: number;
        prkgSize?: number;
        prkgSpaces?: string;
        prkgType?: string;
      };
      summary?: {
        archStyle?: string;
        bldgType?: string;
        bldgsNum?: number;
        imprType?: string;
        levels?: number;
        mobileHomeInd?: string;
        quality?: string;
        storyDesc?: string;
        unitsCount?: string;
        yearBuilt?: number;
        yearBuiltEffective?: number;
      };
    };
    assessment?: {
      appraised?: {
        apprImprValue?: number;
        apprLandValue?: number;
        apprTtlValue?: number;
      };
      assessed?: {
        assdImprValue?: number;
        assdLandValue?: number;
        assdTtlValue?: number;
      };
      market?: {
        mktImprValue?: number;
        mktLandValue?: number;
        mktTtlValue?: number;
      };
      tax?: {
        taxAmt?: number;
        taxYear?: number;
      };
    };
  }>;
}

export class AttomApiService {
  private config: AttomConfig;

  constructor() {
    this.config = {
      apiKey: process.env.ATTOM_API_KEY || '',
      baseUrl: 'https://api.gateway.attomdata.com',
    };
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  private getHeaders() {
    return {
      'apikey': this.config.apiKey,
      'Accept': 'application/json',
    };
  }

  async getPropertyDetail(address1: string, address2: string): Promise<AttomPropertyDetailResponse> {
    const url = new URL(`${this.config.baseUrl}/propertyapi/v1.0.0/property/detail`);
    url.searchParams.set('address1', address1);
    url.searchParams.set('address2', address2);

    console.log(`[ATTOM] Fetching property detail for: ${address1}, ${address2}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ATTOM] API error ${response.status}: ${errorText}`);
      throw new Error(`ATTOM API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as AttomPropertyDetailResponse;
    console.log(`[ATTOM] Got ${data.property?.length || 0} property result(s)`);
    return data;
  }
}

export const attomApi = new AttomApiService();
