import { logBonsaiError } from '@/bonsai/logs';
import { useQuery } from '@tanstack/react-query';

import { IndexerPositionSide } from '@/types/indexer/indexerApiGen';

import { useAccounts } from '@/hooks/useAccounts';

import { getOpenPositions } from '@/state/accountSelectors';
import { useAppSelector } from '@/state/appTypes';

import { Nullable } from '@/lib/typeUtils';

// import { useEndpointsConfig } from './useEndpointsConfig';

export type SharePnlImageParams = {
  marketId: string;
  side: Nullable<IndexerPositionSide>;
  leverage: Nullable<number>;
  oraclePrice: Nullable<number>;
  entryPrice: Nullable<number>;
  unrealizedPnl: Nullable<number>;
  type?: 'open' | 'closed' | 'liquidated' | undefined;
};

// Helper to convert image URL to base64
const imageToBase64 = (imageUrl: string) => {
  let base64 = null;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
    base64 = canvas.toDataURL('image/png');
  };
  img.onerror = () => {
    // eslint-disable-next-line no-console
    console.error('Failed to load image for base64 conversion:', imageUrl);
    base64 = null;
  };

  return base64;
};

export const useSharePnlImage = ({
  marketId,
  side,
  leverage,
  oraclePrice,
  entryPrice,
  unrealizedPnl,
  type = 'open',
}: SharePnlImageParams) => {
  // const { pnlImageApi } = useEndpointsConfig();
  const pnlImageApi = 'https://image-generator.bonk.trade/generate-trade-card-web';
  // 'https://pp-image-generator-bonk-ab5fd4e66c9b.herokuapp.com/generate-trade-card-web';

  // Get user wallet address for username
  const { dydxAddress } = useAccounts();

  // Get full position data from state
  const openPositions = useAppSelector(getOpenPositions);
  const position = openPositions?.find((p) => p.market === marketId);
  const userImage = imageToBase64('/hedgie-profile.png');

  const queryFn = async (): Promise<Blob | undefined> => {
    // if (!pnlImageApi || !dydxAddress) {
    if (!dydxAddress) {
      return undefined;
    }

    // Build the request body matching the API's zod schema
    const requestBody = {
      ticker: marketId,
      type,
      leverage: leverage ?? 0,
      username: dydxAddress,
      isLong: side === IndexerPositionSide.LONG,
      isCross: position?.marginMode === 'CROSS',

      // Optional fields - include if available
      size: position?.unsignedSize.toNumber(),
      userImage,
      pnl: position?.realizedPnl.toNumber(),
      uPnl: unrealizedPnl ?? undefined,
      pnlPercentage: position?.updatedUnrealizedPnlPercent?.toNumber(),
      entryPx: entryPrice ?? undefined,
      liquidationPx: position?.liquidationPrice?.toNumber(),
      markPx: oraclePrice ?? undefined,
    };

    const response = await fetch(pnlImageApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      logBonsaiError('useSharePnlImage', 'Failed to fetch share image', { response });
      throw new Error(`Failed to fetch share image: ${response.status}`);
    }

    return response.blob();
  };

  return useQuery({
    queryKey: [
      'sharePnlImage',
      marketId,
      dydxAddress,
      side,
      leverage,
      oraclePrice,
      entryPrice,
      unrealizedPnl,
      type,
      position?.marginMode,
      position?.unsignedSize.toString(),
      position?.liquidationPrice?.toString(),
    ],
    queryFn,
    enabled: Boolean(dydxAddress),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2,
    retryDelay: 1000,
    retryOnMount: true,
  });
};
