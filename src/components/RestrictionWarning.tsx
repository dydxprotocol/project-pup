import styled from 'styled-components';

import { layoutMixins } from '@/styles/layoutMixins';

import { ComplianceBanner } from './ComplianceBanner';

export const RestrictionWarning = () => {
  return <$RestrictedWarning />;
};

const $RestrictedWarning = styled(ComplianceBanner)`
  /* TEMPORARY: Removed sticky behavior */
  position: static !important; /* Force non-sticky */
  height: var(--restriction-warning-currentHeight);
`;
