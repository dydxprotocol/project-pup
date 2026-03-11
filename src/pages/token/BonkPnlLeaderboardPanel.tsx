import { useCallback } from 'react';

import styled from 'styled-components';

import { STRING_KEYS, StringGetterFunction } from '@/constants/localization';

import { type BonkPnlLeaderboardItem, useBonkPnlLeaderboard } from '@/hooks/rewards/hooks';
import { useAccounts } from '@/hooks/useAccounts';
import { useStringGetter } from '@/hooks/useStringGetter';

import { TrophyIcon } from '@/icons';

import { AssetIcon } from '@/components/AssetIcon';
import { Icon, IconName } from '@/components/Icon';
import { Link } from '@/components/Link';
import { LoadingSpace } from '@/components/Loading/LoadingSpinner';
import { Output, OutputType } from '@/components/Output';
import { Panel } from '@/components/Panel';
import { ColumnDef, Table } from '@/components/Table';

import { exportCSV } from '@/lib/csv';
import { truncateAddress } from '@/lib/wallet';

export enum BonkPnlTableColumns {
  Rank = 'Rank',
  Trader = 'Trader',
  Markets = 'Markets',
  PNL = 'PNL',
}

export const BonkPnlLeaderboardPanel = () => {
  const stringGetter = useStringGetter();
  const { data: bonkPnls, isLoading } = useBonkPnlLeaderboard();
  const { dydxAddress } = useAccounts();

  const getRowKey = useCallback((row: BonkPnlLeaderboardItem) => row.position, []);

  const columns = Object.values(BonkPnlTableColumns).map((key: BonkPnlTableColumns) =>
    getBonkPnlTableColumnDef({
      key,
      stringGetter,
      dydxAddress,
    })
  );

  const userRow = bonkPnls?.find((item) => item.address === dydxAddress);
  const data = [
    ...new Set([
      ...(userRow ? [userRow] : []),
      ...(bonkPnls?.filter((item) => item.pnl !== 0) ?? []),
    ]),
  ];

  const onDownload = () => {
    if (data.length === 0) return;

    const csvRows = data.map((item) => ({
      rank: item.position,
      address: item.address,
      markets: item.markets.join(','),
      pnl: item.pnl,
      volume: item.volume,
    }));

    exportCSV(csvRows, {
      filename: 'bonk-pnl-leaderboard',
      columnHeaders: [
        {
          key: 'rank',
          displayLabel: stringGetter({ key: STRING_KEYS.RANK }),
        },
        {
          key: 'address',
          displayLabel: stringGetter({ key: STRING_KEYS.TRADER }),
        },
        {
          key: 'markets',
          displayLabel: stringGetter({ key: STRING_KEYS.MARKETS }),
        },
        {
          key: 'pnl',
          displayLabel: stringGetter({ key: STRING_KEYS.PNL }),
        },
      ],
    });
  };

  return (
    <$Panel>
      <div tw="flex flex-col gap-1">
        <div tw="flex items-center justify-between">
          <div tw="font-medium-bold">
            Top Traders
            {/* {stringGetter({ key: STRING_KEYS.TOP_TRADERS })} */}
          </div>
          <button
            onClick={onDownload}
            type="button"
            aria-label={stringGetter({ key: STRING_KEYS.DOWNLOAD })}
          >
            <Icon tw="text-color-text-0" size="1.25rem" iconName={IconName.Download} />
          </button>
        </div>

        <div tw="overflow-hidden rounded-0.5 border border-solid border-color-border">
          <$Table
            label={stringGetter({ key: STRING_KEYS.COMPETITION_LEADERBOARD_TITLE })}
            data={data}
            tableId="bonk-pnl"
            getRowKey={getRowKey}
            columns={columns}
            defaultSortDescriptor={{
              column: BonkPnlTableColumns.Rank,
              direction: 'ascending',
            }}
            getIsRowPinned={(row) => {
              return row.address === dydxAddress;
            }}
            slotEmpty={
              isLoading ? (
                <LoadingSpace id="bonk-pnl-leaderboard" />
              ) : (
                <div tw="flex flex-col items-center gap-1">
                  <Icon iconName={IconName.OrderPending} tw="text-[3em]" />
                  No data available
                </div>
              )
            }
            getRowAttributes={({ address }) => ({
              style: {
                backgroundColor: address === dydxAddress ? 'var(--color-accent-faded)' : undefined,
              },
            })}
            selectionBehavior="replace"
            initialPageSize={10}
            withScrollSnapColumns
            withScrollSnapRows
          />
        </div>
      </div>
    </$Panel>
  );
};

const getTraderLink = (address: string) => {
  return `https://www.mintscan.io/dydx/address/${address}`;
};

const getBonkPnlTableColumnDef = ({
  key,
  stringGetter,
  dydxAddress,
}: {
  key: BonkPnlTableColumns;
  stringGetter: StringGetterFunction;
  dydxAddress?: string;
}): ColumnDef<BonkPnlLeaderboardItem> => ({
  ...(
    {
      [BonkPnlTableColumns.Rank]: {
        columnKey: BonkPnlTableColumns.Rank,
        getCellValue: (row) => row.position,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.RANK })}
          </div>
        ),
        renderCell: ({ position, address }) => (
          <div tw="flex gap-0.5">
            <div tw="flex items-center justify-center rounded-20 border border-solid border-color-border p-0.5">
              <div tw="flex h-0.5 min-w-0.5 items-center justify-center text-small font-medium">
                {position}
              </div>
            </div>
            {position === 1 && <TrophyIcon tw="size-1.5 text-[#e5c346]" />}
            {position === 2 && <TrophyIcon tw="size-1.5 text-[#c9c9cb]" />}
            {position === 3 && <TrophyIcon tw="size-1.5 text-[#c37b3f]" />}
            {address === dydxAddress && (
              <div tw="flex items-center justify-center rounded-20 border border-solid border-color-accent px-0.5">
                <span tw="text-small font-medium text-color-accent">
                  {stringGetter({ key: STRING_KEYS.YOU })}
                </span>
              </div>
            )}
          </div>
        ),
      },
      [BonkPnlTableColumns.Trader]: {
        columnKey: BonkPnlTableColumns.Trader,
        getCellValue: (row) => row.address,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.TRADER })}
          </div>
        ),
        renderCell: ({ address }) => (
          <div
            css={{ color: address === dydxAddress ? 'var(--color-accent)' : 'var(--color-text-1)' }}
            tw="flex items-center gap-0.5 text-small font-medium"
          >
            {truncateAddress(address)}
            <Link
              css={{
                color: address === dydxAddress ? 'var(--color-accent)' : 'var(--color-text-0)',
              }}
              href={getTraderLink(address)}
              iconSize="1rem"
              isNewPage
              withIcon
            />
          </div>
        ),
      },
      [BonkPnlTableColumns.Markets]: {
        columnKey: BonkPnlTableColumns.Markets,
        getCellValue: (row) =>
          Array.from(new Set(row.markets.flatMap((m) => m.split('-')))).join(','),
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.MARKETS })}
          </div>
        ),
        renderCell: ({ markets }) => {
          const marketsArray = Array.from(new Set(markets.flatMap((m) => m.split('-'))));
          return (
            <div tw="flex items-center">
              {marketsArray.slice(0, 4).map((market, index) => (
                <span
                  key={market}
                  tw="-mr-0.5 flex aspect-square h-full w-auto items-center overflow-hidden rounded-full bg-color-layer-1 p-0.125"
                  style={{ zIndex: 1 + index }}
                >
                  <AssetIcon key={market} symbol={market} tw="size-full max-h-1.5 max-w-1.5" />
                </span>
              ))}
              {markets.length >= 4 && (
                <div tw="z-10 flex aspect-square items-center justify-center rounded-full bg-color-layer-0 p-0.25">
                  <span tw="w-full text-center text-small font-medium leading-none text-color-text-0">
                    +{markets.length - 3}
                  </span>
                </div>
              )}
            </div>
          );
        },
      },
      [BonkPnlTableColumns.PNL]: {
        columnKey: BonkPnlTableColumns.PNL,
        getCellValue: (row) => row.pnl,
        label: (
          <div tw="py-0.375 text-base font-medium text-color-text-0">
            {stringGetter({ key: STRING_KEYS.PNL })}
          </div>
        ),
        renderCell: ({ pnl }) => (
          <Output
            css={{ color: pnl >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}
            tw="text-small font-medium"
            type={OutputType.Fiat}
            value={pnl}
          />
        ),
      },
    } satisfies Record<BonkPnlTableColumns, ColumnDef<BonkPnlLeaderboardItem>>
  )[key],
});

const $Panel = styled(Panel)`
  --panel-content-paddingY: 1.5rem;
  --panel-content-paddingX: 1.5rem;
`;

const $Table = styled(Table)`
  --tableCell-padding: 0.25rem;
  font: var(--font-mini-book);
  --stickyArea-background: transparent;

  table {
    --stickyArea-background: transparent;
  }

  thead,
  tbody {
    --stickyArea-background: transparent;
    tr {
      td:first-of-type,
      th:first-of-type {
        --tableCell-padding: 0.5rem 0.25rem 0.5rem 1rem;
      }
      td:last-of-type,
      th:last-of-type {
        --tableCell-padding: 0.5rem 1rem 0.5rem 0.25rem;
      }
    }
  }

  tbody {
    font: var(--font-small-book);
  }

  tfoot {
    --stickyArea-background: transparent;
    --tableCell-padding: 0.5rem 1rem 0.5rem 1rem;
  }

  min-width: 1px;
  tbody {
    font: var(--font-small-book);
  }
` as typeof Table;
